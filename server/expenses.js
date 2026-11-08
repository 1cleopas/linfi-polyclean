import { readList, storageLabel, writeList } from './db.js'

export const EXPENSE_CATEGORIES = [
  'Cleaning supplies',
  'Transport & fuel',
  'Equipment & repairs',
  'Wages & allowances',
  'Phone & data',
  'Marketing',
  'Rent & utilities',
  'Other',
]
const METHODS = ['cash', 'momo', 'bank', 'other']

function readExpenses() {
  return readList('expenses')
    .filter((expense) => expense && typeof expense === 'object' && expense.id)
    .map(normalizeExpense)
}

function writeExpenses(expenses) {
  return writeList('expenses', expenses)
}

function invalidError(message) {
  const error = new Error(message)
  error.code = 'INVALID'
  return error
}

function text(value, max = 500) {
  return String(value ?? '').trim().slice(0, max)
}

function normalizeExpense(expense) {
  const amount = Number(expense.amount)
  return {
    id: expense.id,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
    date: /^\d{4}-\d{2}-\d{2}$/.test(String(expense.date || '')) ? expense.date : '',
    category: EXPENSE_CATEGORIES.includes(expense.category) ? expense.category : 'Other',
    description: text(expense.description, 200),
    amount: Number.isFinite(amount) ? Math.round(amount * 100) / 100 : 0,
    method: METHODS.includes(expense.method) ? expense.method : 'cash',
    paidTo: text(expense.paidTo, 120),
    notes: text(expense.notes, 1000),
  }
}

function validate(expense) {
  if (!expense.date) throw invalidError('Choose the date the money was spent.')
  if (!expense.description) throw invalidError('Say what the money was spent on.')
  if (!(expense.amount > 0)) throw invalidError('Enter an amount above zero.')
  return expense
}

export function expensesFilePath() {
  return storageLabel('expenses')
}

export function listExpenses() {
  return readExpenses().sort(
    (a, b) => b.date.localeCompare(a.date) || String(b.createdAt).localeCompare(String(a.createdAt)),
  )
}

export async function createExpense(input) {
  const existing = readExpenses()
  const now = new Date().toISOString()
  const expense = validate(
    normalizeExpense({
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      date: input.date || now.slice(0, 10),
    }),
  )
  await writeExpenses([...existing, expense])
  return expense
}

export async function updateExpense(id, patch) {
  const expenses = readExpenses()
  const index = expenses.findIndex((expense) => expense.id === id)
  if (index === -1) return null

  const current = expenses[index]
  const next = validate(
    normalizeExpense({
      ...current,
      ...patch,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
    }),
  )
  expenses[index] = next
  await writeExpenses(expenses)
  return next
}

export async function deleteExpense(id) {
  const expenses = readExpenses()
  const next = expenses.filter((expense) => expense.id !== id)
  if (next.length === expenses.length) return false
  await writeExpenses(next)
  return true
}
