import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { company } from '../data/content'
import { nextCleaningDate } from '../lib/weeks'
import { getAdminToken, listAdminJobs } from '../lib/api'
import { buildReceiptPdf } from '../lib/receiptPdf'
import Button from '../components/Button'

function receiptNumber(job) {
  const year = new Date(job.createdAt).getFullYear()
  const code = String(job.id || '').replace(/-/g, '').slice(0, 6).toUpperCase()
  return `LPC-${year}-${code}`
}

function formatCedis(amount) {
  if (amount == null || amount === '') return 'To be confirmed'
  return `GH₵${Number(amount).toLocaleString('en-GH')}`
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-GH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function whatsappDigits(job) {
  let raw = String(job.whatsapp || job.phone || '').replace(/\D/g, '')
  if (raw.startsWith('00')) raw = raw.slice(2)
  if (raw.startsWith('0')) return `233${raw.slice(1)}`
  if (raw.length === 9) return `233${raw}`
  return raw
}

function customerKey(job) {
  const name = String(job.fullName || '').trim().toLowerCase()
  const phone = String(job.phone || job.whatsapp || '').replace(/\D/g, '')
  return `${name}|${phone}|${job.week || ''}`
}

function combinedAmount(jobs) {
  const amounts = jobs
    .map((job) => job.amount)
    .filter((amount) => amount != null && amount !== '' && !Number.isNaN(Number(amount)))
  if (amounts.length === 0) return null
  return amounts.reduce((sum, amount) => sum + Number(amount), 0)
}

export default function Receipt() {
  const { id } = useParams()
  const [jobs, setJobs] = useState(null)
  const [error, setError] = useState('')
  const [shareNote, setShareNote] = useState('')

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
    listAdminJobs()
      .then((data) => {
        const all = data.jobs || []
        const current = all.find((item) => item.id === id)
        if (!current) {
          setError('Job not found.')
          return
        }
        const group = all
          .filter((item) => item.status !== 'cancelled' && customerKey(item) === customerKey(current))
          .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
        setJobs(group.length ? group : [current])
      })
      .catch((err) => setError(err.message))
    return undefined
  }, [id])

  if (error) {
    return (
      <main className="receipt-page" style={{ textAlign: 'center' }}>
        <p className="field-error">{error}</p>
        <Link className="field-title" to="/admin" style={{ display: 'inline-block', marginTop: '1rem', color: 'var(--color-secondary)' }}>
          Back to dashboard
        </Link>
      </main>
    )
  }

  if (!jobs) {
    return <main className="receipt-page" style={{ textAlign: 'center' }}>Loading receipt…</main>
  }

  const job = jobs[0]
  const number = receiptNumber(job)
  const paid = jobs.every((item) => item.status === 'paid')
  const amount = combinedAmount(jobs)
  const rows = [
    ['Customer', job.fullName],
    ['Phone', job.phone],
    ['Location', job.location],
    ['Service', [...new Set(jobs.map((item) => item.service || 'Polytank cleaning'))].join(', ')],
    ['Number of tanks', String(jobs.length)],
    ...jobs.map((item, index) => [jobs.length > 1 ? `Tank ${index + 1}` : 'Tank size', item.tankSize || 'Size not given']),
    ['Next cleaning date', nextCleaningDate(job.week) ? formatDate(nextCleaningDate(job.week)) : ''],
  ].filter(([, value]) => value)

  async function sendPdf() {
    setShareNote('')
    const digits = whatsappDigits(job)
    const filename = `${number}.pdf`
    const blob = await buildReceiptPdf({
      number,
      date: formatDate(job.updatedAt || job.createdAt),
      paid,
      rows,
      amount: formatCedis(amount).replace('GH₵', 'GHS '),
      company,
    })
    const file = new File([blob], filename, { type: 'application/pdf' })
    const caption = `Receipt ${number} for ${job.fullName}${jobs.length > 1 ? ` (${jobs.length} tanks)` : ''}`

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
      window.open(`https://wa.me/${digits}`, '_blank', 'noopener,noreferrer')
    }

    setShareNote(
      `${filename} is in your Downloads. In the open chat, tap the paperclip, choose Document, and select that file.`,
    )
  }

  return (
    <main className="receipt-page">
      <div className="wrap" style={{ maxWidth: '42rem' }}>
        <div className="receipt-actions">
          <Button type="button" onClick={() => window.print()}>
            Print receipt
          </Button>
          {whatsappDigits(job) && (
            <Button variant="whatsapp" onClick={sendPdf}>
              Send PDF on WhatsApp
            </Button>
          )}
          {shareNote && <p className="field-hint" style={{ width: '100%' }}>{shareNote}</p>}
          <Button variant="outline" to="/admin">
            Back to dashboard
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
                <p className="eyebrow">Receipt</p>
                <p className="headline" style={{ fontSize: '1.125rem' }}>{number}</p>
                <p className="field-hint">{formatDate(job.updatedAt || job.createdAt)}</p>
                <p className={`paid-pill ${paid ? 'is-paid' : ''}`}>{paid ? 'Paid' : 'Unpaid'}</p>
              </div>
            </div>

            <dl className="receipt-rows">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt className="muted">{label}</dt>
                  <dd style={{ margin: 0, textAlign: 'right', fontWeight: 600, color: 'var(--color-primary)' }}>{value}</dd>
                </div>
              ))}
            </dl>

            <div className="receipt-total">
              <p className="field-hint" style={{ fontWeight: 600, margin: 0 }}>Amount</p>
              <p className="headline" style={{ margin: 0 }}>{formatCedis(amount)}</p>
            </div>

            <p className="field-hint" style={{ marginTop: '1.5rem', lineHeight: 1.5 }}>
              Prices may vary due to location and tank position. This receipt covers every tank booked for this customer in the same week.
            </p>
          </div>
        </article>
      </div>
    </main>
  )
}
