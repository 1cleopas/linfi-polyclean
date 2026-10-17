import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { company, payment } from '../data/content'
import { getAdminToken, listAdminInvoices } from '../lib/api'
import { invoiceStatusLabel, invoiceSubtotal, invoiceTotal, lineTotal } from '../lib/invoices'
import { buildInvoicePdf } from '../lib/receiptPdf'
import Button from '../components/Button'
import PaymentDetails from '../components/PaymentDetails'

function formatCedis(amount) {
  return `GH₵${Number(amount || 0).toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function pdfCedis(amount) {
  return formatCedis(amount).replace('GH₵', 'GHS ')
}

function whatsappDigits(phone) {
  let raw = String(phone || '').replace(/\D/g, '')
  if (raw.startsWith('00')) raw = raw.slice(2)
  if (raw.startsWith('0')) return `233${raw.slice(1)}`
  if (raw.length === 9) return `233${raw}`
  return raw
}

export function invoicePdf(invoice) {
  const discount = Number(invoice.discount) || 0
  return buildInvoicePdf({
    number: invoice.number,
    issued: formatDate(invoice.issueDate),
    status: invoiceStatusLabel(invoice.status),
    paid: invoice.status === 'paid',
    billTo: {
      name: invoice.customerName,
      details: [invoice.phone, invoice.location, invoice.gpsAddress ? `GPS: ${invoice.gpsAddress}` : ''],
    },
    items: invoice.items.map((item) => ({
      description: item.description,
      quantity: String(item.quantity),
      unitPrice: pdfCedis(item.unitPrice),
      amount: pdfCedis(lineTotal(item)),
    })),
    subtotal: pdfCedis(invoiceSubtotal(invoice)),
    discount: discount ? pdfCedis(discount) : '',
    total: pdfCedis(invoiceTotal(invoice)),
    notes: invoice.notes,
    company,
    payment,
  })
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
  const [shareNote, setShareNote] = useState('')
  const [sending, setSending] = useState(false)

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

  const discount = Number(invoice.discount) || 0
  const digits = whatsappDigits(invoice.phone)

  async function sendPdf() {
    setShareNote('')
    setSending(true)
    try {
      const filename = `${invoice.number}.pdf`
      const blob = await invoicePdf(invoice)
      const file = new File([blob], filename, { type: 'application/pdf' })
      const caption = `Invoice ${invoice.number} for ${invoice.customerName} from ${company.name}: ${formatCedis(invoiceTotal(invoice))} due after the work is done. Pay by MoMo: dial *170#, MoMoPay, Merchant ID ${payment.merchantId} (${payment.merchantName}), reference ${invoice.number}.`

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: filename, text: caption })
          return
        } catch (err) {
          if (err?.name === 'AbortError') return
        }
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)

      if (digits) {
        window.open(`https://wa.me/${digits}?text=${encodeURIComponent(caption)}`, '_blank', 'noopener,noreferrer')
        setShareNote(`${filename} is in your Downloads. In the WhatsApp chat that opened, tap the paperclip, choose Document, and select that file.`)
      } else {
        setShareNote(`${filename} is in your Downloads. Add the customer's phone number to the invoice to open their WhatsApp chat directly.`)
      }
    } catch {
      setShareNote('The PDF could not be created. Try again, or use Print or save PDF.')
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="receipt-page">
      <div className="wrap" style={{ maxWidth: '46rem' }}>
        <div className="receipt-actions">
          <Button variant="whatsapp" onClick={sendPdf} disabled={sending}>
            {sending ? 'Preparing PDF…' : 'Send PDF to customer'}
          </Button>
          <Button type="button" variant="outline" onClick={() => window.print()}>
            Print or save PDF
          </Button>
          <Button variant="outline" to="/admin#invoices">
            Back to invoices
          </Button>
          {shareNote && <p className="field-hint" style={{ width: '100%' }}>{shareNote}</p>}
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
                <p className={`paid-pill ${invoice.status === 'paid' ? 'is-paid' : ''}`}>
                  {invoiceStatusLabel(invoice.status)}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <p className="eyebrow">Bill to</p>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 600, color: 'var(--color-primary)' }}>{invoice.customerName}</p>
              <p className="field-hint">{[invoice.phone, invoice.location, invoice.gpsAddress].filter(Boolean).join(' · ')}</p>
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
              <p className="field-hint" style={{ fontWeight: 600, margin: 0 }}>{invoice.status === 'paid' ? 'Total paid' : 'Total due'}</p>
              <p className="headline" style={{ margin: 0 }}>{formatCedis(invoiceTotal(invoice))}</p>
            </div>

            <PaymentDetails reference={invoice.number} paid={invoice.status === 'paid'} />

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
