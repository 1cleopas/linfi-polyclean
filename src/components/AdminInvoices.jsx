import { useMemo, useState } from 'react'
import { CircleDollarSign, FileText, Plus, ReceiptText, Trash2 } from 'lucide-react'
import { createAdminInvoice, deleteAdminInvoice, updateAdminInvoice } from '../lib/api'
import { INVOICE_STATUSES, invoiceStatusLabel, invoiceSubtotal, invoiceTotal, lineTotal } from '../lib/invoices'
import Button from './Button'

const emptyItem = { description: '', quantity: 1, unitPrice: '' }

function today(offsetDays = 0) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

function emptyInvoice() {
  return {
    number: '',
    customerName: '',
    phone: '',
    location: '',
    gpsAddress: '',
    issueDate: today(),
    status: 'draft',
    items: [{ ...emptyItem }],
    discount: '',
    notes: '',
    jobIds: [],
  }
}

function formatCedis(amount) {
  if (amount == null || amount === '') return '—'
  return `GH₵${Number(amount).toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })
}

function customerKey(job) {
  const name = String(job.fullName || '').trim().toLowerCase()
  const phone = String(job.phone || job.whatsapp || '').replace(/\D/g, '')
  return `${name}|${phone}|${job.week || ''}`
}

export default function AdminInvoices({ invoices = [], jobs = [], priceForSize, onInvoicesUpdated, onUnauthorized }) {
  const [error, setError] = useState('')
  const [form, setForm] = useState(null)
  const [savedNote, setSavedNote] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const thisMonth = today().slice(0, 7)

  const jobGroups = useMemo(() => {
    const groups = new Map()
    const ordered = jobs
      .filter((job) => job.status !== 'cancelled')
      .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    for (const job of ordered) {
      const key = customerKey(job)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(job)
    }
    return [...groups.entries()]
      .map(([key, group]) => ({ key, jobs: group, lead: group[0] }))
      .sort((a, b) => String(b.lead.createdAt).localeCompare(String(a.lead.createdAt)))
  }, [jobs])

  const outstanding = invoices
    .filter((invoice) => invoice.status === 'sent')
    .reduce((sum, invoice) => sum + invoiceTotal(invoice), 0)
  const paidThisMonth = invoices
    .filter((invoice) => invoice.status === 'paid' && String(invoice.updatedAt || '').slice(0, 7) === thisMonth)
    .reduce((sum, invoice) => sum + invoiceTotal(invoice), 0)
  const draftCount = invoices.filter((invoice) => invoice.status === 'draft').length

  const visible = statusFilter === 'all'
    ? invoices
    : invoices.filter((invoice) => invoice.status === statusFilter)

  function closeForm() {
    setForm(null)
    setError('')
    setSavedNote('')
  }

  function setItem(index, patch) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }))
  }

  function fillFromJobs(key) {
    const group = jobGroups.find((item) => item.key === key)
    if (!group) return
    const { lead } = group
    setForm((current) => ({
      ...current,
      customerName: lead.fullName || '',
      phone: lead.phone || lead.whatsapp || '',
      location: lead.location || '',
      gpsAddress: lead.gpsAddress || '',
      jobIds: group.jobs.map((job) => job.id),
      items: group.jobs.map((job) => ({
        description: [job.service || 'Polytank cleaning', job.tankSize, job.week].filter(Boolean).join(' · '),
        quantity: 1,
        unitPrice: job.amount ?? priceForSize?.(job.tankSize) ?? '',
      })),
    }))
  }

  async function saveInvoice(e) {
    e.preventDefault()
    setError('')
    const payload = { ...form, items: form.items.filter((item) => item.description.trim() || Number(item.unitPrice)) }
    try {
      if (form.id) {
        await updateAdminInvoice(form.id, payload)
        closeForm()
      } else {
        // Keep the new invoice open so it can be sent to the customer straight away.
        const data = await createAdminInvoice(payload)
        setForm(data.invoice)
        setSavedNote(`${data.invoice.number} saved. Send it to the customer as a PDF.`)
      }
      await onInvoicesUpdated?.()
    } catch (err) {
      if (err.status === 401) onUnauthorized?.()
      setError(err.message)
    }
  }

  async function removeInvoice(id) {
    if (!window.confirm('Delete this invoice?')) return
    try {
      await deleteAdminInvoice(id)
      closeForm()
      await onInvoicesUpdated?.()
    } catch (err) {
      if (err.status === 401) onUnauthorized?.()
      setError(err.message)
    }
  }

  return (
    <section className="salary-section" id="invoices">
      <div className="salary-head">
        <div>
          <p className="eyebrow">Billing</p>
          <h2 className="headline" style={{ fontSize: '1.125rem' }}>Customer invoices</h2>
          <p className="field-hint">
            Bill customers before or after the job. Fill an invoice from a booking or type the lines yourself — every field
            stays editable.
          </p>
        </div>
        <Button type="button" onClick={() => setForm(emptyInvoice())}>
          <Plus className="icon-sm" />
          New invoice
        </Button>
      </div>

      <div className="stat-grid salary-stats">
        <div className="stat-card">
          <FileText className="icon" />
          <p className="eyebrow" style={{ marginTop: '0.75rem' }}>Invoices</p>
          <p className="headline">{invoices.length}</p>
          <p className="field-hint">{draftCount} draft{draftCount === 1 ? '' : 's'}</p>
        </div>
        <div className="stat-card">
          <CircleDollarSign className="icon" />
          <p className="eyebrow" style={{ marginTop: '0.75rem' }}>Outstanding</p>
          <p className="headline">{formatCedis(outstanding)}</p>
          <p className="field-hint">Sent and not yet paid</p>
        </div>
        <div className="stat-card">
          <CircleDollarSign className="icon" />
          <p className="eyebrow" style={{ marginTop: '0.75rem' }}>Paid this month</p>
          <p className="headline">{formatCedis(paidThisMonth)}</p>
          <p className="field-hint">Invoices marked paid</p>
        </div>
      </div>

      <label className="field" style={{ maxWidth: '16rem', marginTop: '1.5rem' }}>
        Show
        <select className="select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All invoices</option>
          {INVOICE_STATUSES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      {error && !form && <p className="field-error" style={{ marginTop: '1rem' }}>{error}</p>}

      <div className="job-table-wrap">
        <table className="job-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Issued</th>
              <th>Status</th>
              <th className="right">Total</th>
              <th className="right">Send</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((invoice) => (
              <tr key={invoice.id} className="is-clickable" onClick={() => { setError(''); setForm(invoice) }}>
                <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{invoice.number}</td>
                <td>
                  <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-primary)' }}>{invoice.customerName}</p>
                  <p className="field-hint">{[invoice.location, invoice.phone].filter(Boolean).join(' · ') || '—'}</p>
                </td>
                <td>{formatDate(invoice.issueDate)}</td>
                <td>
                  <span className="status-pill">{invoiceStatusLabel(invoice.status)}</span>
                </td>
                <td className="right" style={{ fontWeight: 600, color: 'var(--color-secondary)' }}>{formatCedis(invoiceTotal(invoice))}</td>
                <td className="right">
                  <a
                    href={`/admin/invoice/${invoice.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="receipt-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ReceiptText className="icon-xs" aria-hidden="true" />
                    Send PDF
                  </a>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--color-muted)' }}>
                  {invoices.length === 0 ? 'No invoices yet. Create one from a booking or start a blank invoice.' : 'No invoices match this filter.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="modal">
          <form onSubmit={saveInvoice} className="modal-card invoice-modal">
            <h2 className="headline" style={{ fontSize: '1.25rem' }}>{form.id ? `Edit ${form.number}` : 'New invoice'}</h2>

            <label className="field" style={{ marginTop: '1rem' }}>
              Fill from a booking
              <select className="select" value="" onChange={(e) => fillFromJobs(e.target.value)}>
                <option value="">Choose a customer booking…</option>
                {jobGroups.map((group) => (
                  <option key={group.key} value={group.key}>
                    {group.lead.fullName} · {group.lead.week || 'No week'} ({group.jobs.length} tank{group.jobs.length === 1 ? '' : 's'})
                  </option>
                ))}
              </select>
              <span className="field-hint">Replaces the customer details and lines below. You can still edit everything.</span>
            </label>

            <div className="modal-grid">
              <label className="field">
                Invoice number
                <input
                  className="input"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                  placeholder="Auto, e.g. INV-2026-0001"
                />
              </label>
              <label className="field">
                Status
                <select className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  {INVOICE_STATUSES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Customer name
                <input className="input" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
              </label>
              <label className="field">
                Phone
                <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </label>
              <label className="field">
                Location
                <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </label>
              <label className="field">
                GPS address
                <input
                  className="input"
                  value={form.gpsAddress || ''}
                  onChange={(e) => setForm({ ...form, gpsAddress: e.target.value })}
                  placeholder="e.g. GA-123-4567"
                />
              </label>
              <label className="field">
                Issue date
                <input className="input" type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
              </label>
              <label className="field">
                Discount (GH₵)
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discount ?? ''}
                  onChange={(e) => setForm({ ...form, discount: e.target.value })}
                />
              </label>
            </div>

            <h3 className="field-title" style={{ marginTop: '1.25rem' }}>Lines</h3>
            <div className="invoice-lines">
              {form.items.map((item, index) => (
                <div className="invoice-line" key={index}>
                  <label className="field invoice-line-desc">
                    Description
                    <input
                      className="input"
                      value={item.description}
                      onChange={(e) => setItem(index, { description: e.target.value })}
                      placeholder="Polytank cleaning · 1,501L – 2,500L"
                    />
                  </label>
                  <label className="field">
                    Qty
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => setItem(index, { quantity: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    Unit price
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => setItem(index, { unitPrice: e.target.value })}
                    />
                  </label>
                  <p className="invoice-line-total">{formatCedis(lineTotal(item))}</p>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Remove line"
                    title="Remove line"
                    onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })}
                  >
                    <Trash2 className="icon-sm" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '0.75rem' }}>
              <Button type="button" variant="outline" onClick={() => setForm({ ...form, items: [...form.items, { ...emptyItem }] })}>
                <Plus className="icon-sm" />
                Add line
              </Button>
            </div>

            <ul className="price-rows invoice-sums">
              <li>
                <span>Subtotal</span>
                <span>{formatCedis(invoiceSubtotal(form))}</span>
              </li>
              {Number(form.discount) > 0 && (
                <li>
                  <span>Discount</span>
                  <span>− {formatCedis(form.discount)}</span>
                </li>
              )}
              <li>
                <span style={{ fontWeight: 600 }}>Total</span>
                <span style={{ color: 'var(--color-secondary)', fontWeight: 700 }}>{formatCedis(invoiceTotal(form))}</span>
              </li>
            </ul>

            <label className="field" style={{ marginTop: '1rem' }}>
              Notes
              <textarea
                className="textarea"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Payment details, MoMo number, terms…"
              />
            </label>

            {savedNote && <p className="field-hint" style={{ marginTop: '0.75rem', color: 'var(--color-secondary)', fontWeight: 600 }}>{savedNote}</p>}
            {error && <p className="field-error" style={{ marginTop: '0.75rem' }}>{error}</p>}
            <div className="admin-actions" style={{ marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <Button type="submit">{form.id ? 'Save changes' : 'Save invoice'}</Button>
              <Button type="button" variant="outline" onClick={closeForm}>
                Close
              </Button>
              {form.id && (
                <Button variant="whatsapp" href={`/admin/invoice/${form.id}`} target="_blank" rel="noreferrer">
                  Send PDF to customer
                </Button>
              )}
              {form.id && (
                <Button type="button" variant="ghost" onClick={() => removeInvoice(form.id)}>
                  Delete
                </Button>
              )}
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
