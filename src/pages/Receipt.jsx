import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { company } from '../data/content'
import { nextCleaningDate } from '../lib/weeks'
import { getAdminJob, getAdminToken } from '../lib/api'
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

export default function Receipt() {
  const { id } = useParams()
  const [job, setJob] = useState(null)
  const [error, setError] = useState('')
  const [shareNote, setShareNote] = useState('')

  useEffect(() => {
    if (!getAdminToken()) {
      window.location.replace('/admin')
      return undefined
    }
    getAdminJob(id)
      .then((data) => setJob(data.job))
      .catch((err) => setError(err.message))
    return undefined
  }, [id])

  if (error) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-red-600">{error}</p>
        <Link className="mt-4 inline-block font-semibold text-secondary" to="/admin">
          Back to dashboard
        </Link>
      </main>
    )
  }

  if (!job) {
    return <main className="px-4 py-16 text-center text-muted">Loading receipt…</main>
  }

  const number = receiptNumber(job)
  const paid = job.status === 'paid'
  const rows = [
    ['Customer', job.fullName],
    ['Phone', job.phone],
    ['Location', job.location],
    ['Service', job.service || 'Polytank cleaning'],
    ['Tank size', job.tankSize],
    ['Number of tanks', job.tanks],
    ['Next cleaning date', nextCleaningDate(job.week) ? formatDate(nextCleaningDate(job.week)) : ''],
  ].filter(([, value]) => value)

  async function sendPdf() {
    setShareNote('')
    const digits = whatsappDigits(job)
    const filename = `${number}.pdf`
    const blob = buildReceiptPdf({
      number,
      date: formatDate(job.updatedAt || job.createdAt),
      paid,
      rows,
      amount: formatCedis(job.amount).replace('GH₵', 'GHS '),
      company,
    })
    const file = new File([blob], filename, { type: 'application/pdf' })
    const caption = `Receipt ${number} for ${job.fullName}`

    // Share the PDF first. Opening wa.me before this leaves an empty chat,
    // because a WhatsApp link cannot carry a file.
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
    <main className="min-h-screen bg-surface px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex flex-wrap gap-2 print:hidden">
          <Button type="button" onClick={() => window.print()}>
            Print receipt
          </Button>
          {whatsappDigits(job) && (
            <Button variant="whatsapp" onClick={sendPdf}>
              Send PDF on WhatsApp
            </Button>
          )}
          {shareNote && <p className="w-full text-sm text-muted">{shareNote}</p>}
          <Button variant="outline" to="/admin">
            Back to dashboard
          </Button>
        </div>

        <article className="rounded-3xl bg-white p-8 shadow-[var(--shadow-card)] print:rounded-none print:shadow-none">
          <div className="flex items-start justify-between gap-4 border-b border-outline/40 pb-6">
            <div>
              <img src="/logo.png" alt="" className="h-16 w-16 rounded-xl object-contain" />
              <h1 className="font-headline mt-3 text-2xl font-bold text-primary">{company.name}</h1>
              <p className="text-sm text-muted">{company.tagline}</p>
              <p className="mt-2 text-sm text-muted">
                {company.phone}
                <br />
                {company.email}
                <br />
                {company.serviceArea}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold tracking-[0.2em] text-secondary uppercase">Receipt</p>
              <p className="font-headline mt-1 text-lg font-bold text-primary">{number}</p>
              <p className="mt-1 text-sm text-muted">{formatDate(job.updatedAt || job.createdAt)}</p>
              <p className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold ${paid ? 'bg-green/15 text-green' : 'bg-surface text-primary'}`}>
                {paid ? 'Paid' : 'Unpaid'}
              </p>
            </div>
          </div>

          <dl className="mt-6 divide-y divide-outline/30">
            {rows.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 py-3 text-sm">
                <dt className="text-muted">{label}</dt>
                <dd className="text-right font-semibold text-primary">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-surface px-5 py-4">
            <p className="text-sm font-semibold text-muted">Amount</p>
            <p className="font-headline text-2xl font-bold text-primary">{formatCedis(job.amount)}</p>
          </div>

          <p className="mt-6 text-xs leading-5 text-muted">
            Prices may vary due to location and tank position. This receipt confirms the amount recorded for this job.
          </p>
        </article>
      </div>
    </main>
  )
}
