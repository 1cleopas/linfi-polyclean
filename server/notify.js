import './loadEnv.js'
import { company, siteUrl } from '../src/data/content.js'

/*
  Booking alerts and customer confirmations.

  - Email goes through Resend (RESEND_API_KEY, EMAIL_FROM).
  - SMS goes through Arkesel (ARKESEL_API_KEY, SMS_SENDER_ID).
  - The manager gets an alert at ALERT_EMAILS / ALERT_PHONES (comma-separated).
  - The customer gets an SMS, and an email if they gave one, unless CUSTOMER_CONFIRMATIONS=off.

  Anything without its key is skipped, so the site keeps working with none of this set up.
  NOTIFY_DRY_RUN=1 logs every message instead of sending it.
  Sending never blocks or fails a booking: errors are logged and the booking stays saved.
*/

function env(name) {
  return String(process.env[name] || '').trim()
}

function list(name) {
  return env(name).split(',').map((item) => item.trim()).filter(Boolean)
}

const config = {
  resendKey: env('RESEND_API_KEY'),
  emailFrom: env('EMAIL_FROM'),
  alertEmails: list('ALERT_EMAILS'),
  arkeselKey: env('ARKESEL_API_KEY'),
  smsSender: env('SMS_SENDER_ID').slice(0, 11),
  smsSandbox: env('SMS_SANDBOX') === '1',
  alertPhones: list('ALERT_PHONES'),
  confirmCustomers: env('CUSTOMER_CONFIRMATIONS').toLowerCase() !== 'off',
  dryRun: env('NOTIFY_DRY_RUN') === '1',
  // Limits so the public booking form cannot be used to send messages to strangers or drain SMS credit.
  customerDailyLimit: Number(env('CUSTOMER_CONFIRMATIONS_PER_DAY')) || 100,
  alertDailyLimit: Number(env('ALERTS_PER_DAY')) || 100,
  perRecipientDailyLimit: 3,
}

const DAY_MS = 24 * 60 * 60 * 1000
const sentLog = new Map()

/** Records a send under `key` and says whether it stays within `max` in the last 24 hours. */
function allowSend(key, max) {
  const now = Date.now()
  const recent = (sentLog.get(key) || []).filter((time) => now - time < DAY_MS)
  if (recent.length >= max) {
    sentLog.set(key, recent)
    return false
  }
  recent.push(now)
  sentLog.set(key, recent)
  if (sentLog.size > 5000) {
    for (const [item, times] of sentLog) {
      if (!times.some((time) => now - time < DAY_MS)) sentLog.delete(item)
    }
  }
  return true
}

const emailReady = () => config.dryRun || Boolean(config.resendKey && config.emailFrom)
const smsReady = () => config.dryRun || Boolean(config.arkeselKey && config.smsSender)

export function notificationStatus() {
  return [
    `email ${emailReady() ? 'on' : 'off'}`,
    `SMS ${smsReady() ? 'on' : 'off'}`,
    `manager alerts to ${config.alertEmails.length} email(s) and ${config.alertPhones.length} phone(s)`,
    `customer confirmations ${config.confirmCustomers ? 'on' : 'off'}`,
    config.dryRun ? 'DRY RUN (nothing is sent)' : '',
  ].filter(Boolean).join(', ')
}

/** Ghana numbers in the international form Arkesel expects, e.g. 0241234567 -> 233241234567. */
export function ghanaPhone(value) {
  let digits = String(value || '').replace(/\D/g, '')
  if (digits.startsWith('00')) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = `233${digits.slice(1)}`
  else if (digits.length === 9) digits = `233${digits}`
  return digits.length >= 11 && digits.length <= 15 ? digits : ''
}

/** Only Ghana mobile numbers get customer SMS, so the form cannot run up costs on foreign numbers. */
function ghanaMobile(value) {
  const digits = ghanaPhone(value)
  return /^233[235]\d{8}$/.test(digits) ? digits : ''
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
}

async function post(url, headers, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  })
  const text = await response.text()
  if (!response.ok) throw new Error(`${response.status} ${text.slice(0, 300)}`)
  return text
}

async function sendEmail({ to, subject, text, replyTo }) {
  const recipients = (Array.isArray(to) ? to : [to]).filter(validEmail)
  if (!recipients.length || !emailReady()) return
  if (config.dryRun) {
    console.log(`[dry run] Email to ${recipients.join(', ')}: ${subject}\n${text}`)
    return
  }
  await post(
    'https://api.resend.com/emails',
    { Authorization: `Bearer ${config.resendKey}` },
    {
      from: config.emailFrom,
      to: recipients,
      subject,
      text,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;white-space:pre-line">${escapeHtml(text)}</div>`,
      ...(validEmail(replyTo) ? { reply_to: replyTo } : {}),
    },
  )
}

async function sendSms({ to, message }) {
  const recipients = [...new Set((Array.isArray(to) ? to : [to]).map(ghanaPhone).filter(Boolean))]
  if (!recipients.length || !smsReady()) return
  if (config.dryRun) {
    console.log(`[dry run] SMS to ${recipients.join(', ')}: ${message}`)
    return
  }
  const reply = await post(
    'https://sms.arkesel.com/api/v2/sms/send',
    { 'api-key': config.arkeselKey },
    { sender: config.smsSender, message, recipients, ...(config.smsSandbox ? { sandbox: true } : {}) },
  )
  // Arkesel answers {"status":"success",...}; anything else is a failure even with an OK HTTP code.
  let status = ''
  try {
    status = JSON.parse(reply).status
  } catch {
    // Not JSON: treated as a failure below.
  }
  if (status !== 'success') throw new Error(`Arkesel: ${reply.slice(0, 300)}`)
}

function firstName(fullName) {
  return String(fullName || '').trim().split(/\s+/)[0] || 'there'
}

// "Tue 13 Oct 2026 – Sun 18 Oct 2026" -> "Tue 13 Oct 2026"
function weekStart(week) {
  return String(week || '').split(/\s+[–-]\s+/)[0]
}

function bookingLines(jobs) {
  const lead = jobs[0]
  const sizes = jobs.map((job, index) => (jobs.length > 1 ? `Tank ${index + 1}: ` : '') + (job.tankSize || 'size not given'))
  return [
    `Name: ${lead.fullName}`,
    `Phone: ${lead.phone}`,
    lead.whatsapp ? `WhatsApp: ${lead.whatsapp}` : '',
    lead.email ? `Email: ${lead.email}` : '',
    `Location: ${lead.location || '—'}`,
    lead.gpsAddress ? `GPS address: ${lead.gpsAddress}` : '',
    lead.service ? `Service: ${lead.service}` : '',
    lead.tankType ? `Tank type: ${lead.tankType}` : '',
    `Number of tanks: ${jobs.length}`,
    ...sizes,
    `Preferred week: ${lead.week || '—'}`,
    lead.time ? `Preferred time: ${lead.time}` : '',
    lead.extra ? `Notes: ${lead.extra.replace(/^Tank 1 of \d+\.\s*/, '')}` : '',
  ].filter(Boolean)
}

function managerAlerts(jobs, via) {
  if (!allowSend('alerts', config.alertDailyLimit)) {
    console.warn(`Booking alerts skipped: more than ${config.alertDailyLimit} bookings in 24 hours. Check the dashboard for spam.`)
    return []
  }
  const lead = jobs[0]
  const tanks = `${jobs.length} tank${jobs.length === 1 ? '' : 's'}`
  return [
    sendEmail({
      to: config.alertEmails,
      subject: `New booking: ${lead.fullName} (${tanks}, ${weekStart(lead.week) || 'no week'})`,
      text: [`A new booking came in ${via}.`, '', ...bookingLines(jobs), '', `Open the dashboard: ${siteUrl}/admin`].join('\n'),
      replyTo: lead.email,
    }),
    sendSms({
      to: config.alertPhones,
      message: `New booking: ${lead.fullName}, ${lead.phone}, ${lead.location || 'no location'}, ${tanks}, week of ${weekStart(lead.week) || 'not given'}. See the dashboard.`,
    }),
  ]
}

/** Decides which confirmations this customer gets, applying the per-recipient and daily limits. */
function confirmationChannels(lead) {
  if (!config.confirmCustomers || !lead) return { sms: '', email: '' }
  const phone = smsReady() ? ghanaMobile(lead.phone) : ''
  const email = emailReady() && validEmail(lead.email) ? String(lead.email).trim().toLowerCase() : ''
  const sms = phone && allowSend(`sms:${phone}`, config.perRecipientDailyLimit) ? phone : ''
  const mail = email && allowSend(`email:${email}`, config.perRecipientDailyLimit) ? email : ''
  if ((sms || mail) && !allowSend('confirmations', config.customerDailyLimit)) {
    console.warn(`Customer confirmations skipped: more than ${config.customerDailyLimit} in 24 hours.`)
    return { sms: '', email: '' }
  }
  return { sms, email: mail }
}

function customerConfirmations(jobs, channels) {
  const lead = jobs[0]
  const tanks = `${jobs.length} tank${jobs.length === 1 ? '' : 's'}`
  const week = weekStart(lead.week)
  return [
    channels.sms && sendSms({
      to: channels.sms,
      message: `Hi ${firstName(lead.fullName)}, ${company.name} has received your booking for ${tanks}${week ? `, week of ${week}` : ''}. We will call you to confirm the day and time. Questions? Call ${company.phone}.`,
    }),
    channels.email && sendEmail({
      to: channels.email,
      subject: `We received your booking — ${company.name}`,
      text: [
        `Hi ${firstName(lead.fullName)},`,
        '',
        `Thank you for booking with ${company.name}. We have received your request and will call you to confirm the day and time.`,
        '',
        'Your booking:',
        ...bookingLines(jobs),
        '',
        'Payment is made only after the work is done, by MTN Mobile Money.',
        '',
        `Questions? Call or WhatsApp us on ${company.phone}, or reply to this email.`,
        '',
        company.name,
        company.tagline,
      ].join('\n'),
      replyTo: company.email,
    }),
  ].filter(Boolean)
}

/**
  Starts every alert and confirmation for one booking in the background and returns at once with
  the confirmations the customer should expect (['sms', 'email']), so the website only promises
  what is actually sent. Never throws, and a failed send never affects the saved booking.
*/
export function notifyNewBooking(jobs, { via = 'on the website' } = {}) {
  if (!jobs?.length) return []
  try {
    const channels = confirmationChannels(jobs[0])
    Promise.allSettled([...managerAlerts(jobs, via), ...customerConfirmations(jobs, channels)])
      .then((results) => {
        for (const result of results) {
          if (result.status === 'rejected') console.error(`Booking notification failed: ${result.reason?.message || result.reason}`)
        }
      })
      .catch((error) => console.error(`Booking notification failed: ${error?.message || error}`))
    return [channels.sms ? 'sms' : '', channels.email ? 'email' : ''].filter(Boolean)
  } catch (error) {
    console.error(`Booking notification failed: ${error?.message || error}`)
    return []
  }
}
