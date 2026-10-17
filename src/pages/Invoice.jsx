import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { company } from '../data/content'
import { getAdminToken, listAdminInvoices } from '../lib/api'
import { invoiceStatusLabel, invoiceSubtotal, invoiceTotal, isOverdue, lineTotal } from '../lib/invoices'
import Button from '../components/Button'

function formatCedis(amount) {
  return `GH₵${Number(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatDate(value) {
  if (!value) return ''
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function Invoice() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const meta = document.querySelector('meta[name="robots"]')
    const previous = meta?.getAttribute('content')
    if (meta) meta.setAttribute('content', 'noindex, nofollow')
    return () => {
      if (meta) meta.setAttribute('content', previous || 'index, follow')
    }
  }, [])

  useEffect(() => {
    if (!getAdminToken()) {
      window.location.replace('/admin')
      return undefined
    }
    listAdminInvoices()
      .then((data) => {
        const current = (data.invoices || []).find((item) => item.id === id)
        if (!current) setError('Invoice not found.')
        else setInvoice(current)
      })
      .catch((err) => setError(err.message))
    return undefined
  }, [id])

  if (error) {
    return (
      <main className="receipt-page" style={{ textAlign: 'center' }}>
        <p className="field-error">{error}</p>
        <Link className="field-title" to="/admin#invoices" style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--color-secondary)' }}>
          Back to invoices
        </Link>
      </main>
    )
  }

  if (!invoice) {
    return <main className="receipt-page" style={{ textAlign: 'center' }}>Loading invoice…</main>
  }

  const overdue = isOverdue(invoice)
  const discount = Number(invoice.discount) || 0

  return (
    <main className="receipt-page">
      <div className="wrap" style={{ maxWidth: '46rem' }}>
        <div className="receipt-actions">
          <Button type="button" onClick={() => window.print()}>
            Print or save PDF
          </Button>
          <Button variant="outline" to="/admin#invoices">
            Back to invoices
          </Button>
        </div>

        <article className="receipt-card">
          <img src="/logo.png" alt="" className="receipt-mark" />
          <div className="receipt-body">
            <div className="receipt-head">
              <div>
                <img src="/logo.png" alt="" className="receipt-logo" />
                <h1 className="headline" style={{ marginTop: '0.75rem', fontSize: '1.5rem' }}>{company.name}</h1>
                <p className="field-hint">{company.tagline}</p>
                <p className="field-hint" style={{ marginTop: '0.5rem' }}>
                  {company.phone}
                  <br />
                  {company.email}
                  <br />
                  {company.serviceArea}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p className="eyebrow">Invoice</p>
                <p className="headline" style={{ fontSize: '1.125rem' }}>{invoice.number}</p>
                <p className="field-hint">Issued {formatDate(invoice.issueDate)}</p>
                {invoice.dueDate && <p className="field-hint">Due {formatDate(invoice.dueDate)}</p>}
                <p className={`paid-pill ${invoice.status === 'paid' ? 'is-paid' : ''}`}>
                  {overdue ? 'Overdue' : invoiceStatusLabel(invoice.status)}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <p className="eyebrow">Bill to</p>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 600, color: 'var(--color-primary)' }}>{invoice.customerName}</p>
              <p className="field-hint">{[invoice.phone, invoice.location].filter(Boolean).join(' · ')}</p>
            </div>

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="right">Qty</th>
                  <th className="right">Unit price</th>
                  <th className="right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.description || '—'}</td>
                    <td className="right">{item.quantity}</td>
                    <td className="right">{formatCedis(item.unitPrice)}</td>
                    <td className="right">{formatCedis(lineTotal(item))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {discount > 0 && (
              <dl className="receipt-rows">
                <div>
                  <dt className="muted">Subtotal</dt>
                  <dd style={{ margin: 0 }}>{formatCedis(invoiceSubtotal(invoice))}</dd>
                </div>
                <div>
                  <dt className="muted">Discount</dt>
                  <dd style={{ margin: 0 }}>− {formatCedis(discount)}</dd>
                </div>
              </dl>
            )}

            <div className="receipt-total">
              <p className="field-hint" style={{ fontWeight: 600, margin: 0 }}>Total due</p>
              <p className="headline" style={{ margin: 0 }}>{formatCedis(invoiceTotal(invoice))}</p>
            </div>

            {invoice.notes && (
              <p className="field-hint" style={{ marginTop: '1.5rem', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{invoice.notes}</p>
            )}
            <p className="field-hint" style={{ marginTop: '1rem', lineHeight: 1.5 }}>
              Prices may vary due to location and tank position.
            </p>
          </div>
        </article>
      </div>
    </main>
  )
}
