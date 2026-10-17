export const INVOICE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function invoiceStatusLabel(value) {
  return INVOICE_STATUSES.find((item) => item.value === value)?.label || value
}

export function lineTotal(item) {
  return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
}

export function invoiceSubtotal(invoice) {
  return (invoice.items || []).reduce((sum, item) => sum + lineTotal(item), 0)
}

export function invoiceTotal(invoice) {
  return Math.max(0, invoiceSubtotal(invoice) - (Number(invoice.discount) || 0))
}

export function isOverdue(invoice, today = new Date()) {
  if (invoice.status !== 'sent' || !invoice.dueDate) return false
  return invoice.dueDate < today.toISOString().slice(0, 10)
}
