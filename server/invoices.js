import './loadEnv.js'
import { mkdirSync, readFileSync, writeFileSync, existsSync, renameSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('..', import.meta.url))
const dataDir = process.env.DATA_DIR || join(rootDir, 'data')
const filePath = join(dataDir, 'invoices.json')

const STATUSES = ['draft', 'sent', 'paid', 'cancelled']

function ensureFile() {
  mkdirSync(dirname(filePath), { recursive: true })
  if (!existsSync(filePath)) {
    writeFileSync(filePath, '[]', 'utf8')
  }
}

function readInvoices() {
  ensureFile()
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'))
    return Array.isArray(parsed) ? parsed.map(normalizeInvoice) : []
  } catch {
    return []
  }
}

function writeInvoices(invoices) {
  mkdirSync(dirname(filePath), { recursive: true })
  const payload = JSON.stringify(invoices, null, 2)
  const tmp = `${filePath}.${process.pid}.tmp`
  writeFileSync(tmp, payload, 'utf8')
  try {
    renameSync(tmp, filePath)
  } catch {
    writeFileSync(filePath, payload, 'utf8')
    try {
      unlinkSync(tmp)
    } catch {
      // The temp file can remain if Windows still has it open.
    }
  }
}

function invalidError(message) {
  const error = new Error(message)
  error.code = 'INVALID'
  return error
}

function parseMoney(value) {
  if (value === '' || value == null) return 0
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : 0
}

function normalizeItem(item) {
  const quantity = item?.quantity === '' || item?.quantity == null ? 1 : Number(item.quantity)
  return {
    description: String(item?.description || '').trim(),
    quantity: Number.isFinite(quantity) ? quantity : 1,
    unitPrice: parseMoney(item?.unitPrice),
  }
}

function normalizeInvoice(invoice) {
  const items = Array.isArray(invoice.items) ? invoice.items.map(normalizeItem) : []
  return {
    id: invoice.id,
    number: String(invoice.number || '').trim(),
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
    customerName: String(invoice.customerName || '').trim(),
    phone: String(invoice.phone || '').trim(),
    location: String(invoice.location || '').trim(),
    issueDate: String(invoice.issueDate || '').trim(),
    status: STATUSES.includes(invoice.status) ? invoice.status : 'draft',
    items,
    discount: parseMoney(invoice.discount),
    notes: String(invoice.notes || '').trim(),
    jobIds: Array.isArray(invoice.jobIds) ? invoice.jobIds.map(String) : [],
  }
}

function validate(invoice) {
  if (!invoice.customerName) throw invalidError('Customer name is required.')
  if (invoice.items.some((item) => item.quantity < 0 || item.unitPrice < 0)) {
    throw invalidError('Quantities and prices cannot be negative.')
  }
  return invoice
}

function nextNumber(invoices, now) {
  const year = new Date(now).getFullYear()
  const prefix = `INV-${year}-`
  const highest = invoices
    .map((invoice) => invoice.number)
    .filter((number) => number.startsWith(prefix))
    .map((number) => Number.parseInt(number.slice(prefix.length), 10) || 0)
    .reduce((max, value) => Math.max(max, value), 0)
  return `${prefix}${String(highest + 1).padStart(4, '0')}`
}

export function invoicesFilePath() {
  return filePath
}

export function listInvoices() {
  return readInvoices().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
}

export function createInvoice(input) {
  const existing = readInvoices()
  const now = new Date().toISOString()
  const invoice = validate(
    normalizeInvoice({
      ...input,
      id: crypto.randomUUID(),
      number: String(input.number || '').trim() || nextNumber(existing, now),
      createdAt: now,
      updatedAt: now,
      issueDate: input.issueDate || now.slice(0, 10),
    }),
  )
  if (existing.some((item) => item.number === invoice.number)) {
    throw invalidError('That invoice number is already used.')
  }
  writeInvoices([...existing, invoice])
  return invoice
}

export function updateInvoice(id, patch) {
  const invoices = readInvoices()
  const index = invoices.findIndex((invoice) => invoice.id === id)
  if (index === -1) return null

  const current = invoices[index]
  const next = validate(
    normalizeInvoice({
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
      number: String(patch.number ?? current.number).trim() || current.number,
    }),
  )
  if (invoices.some((item) => item.id !== id && item.number === next.number)) {
    throw invalidError('That invoice number is already used.')
  }

  invoices[index] = next
  writeInvoices(invoices)
  return next
}

export function deleteInvoice(id) {
  const invoices = readInvoices()
  const next = invoices.filter((invoice) => invoice.id !== id)
  if (next.length === invoices.length) return false
  writeInvoices(next)
  return true
}
