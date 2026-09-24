import { useState } from 'react'
import { CircleCheckBig } from 'lucide-react'
import { hasWhatsApp, tryOpenWhatsApp } from '../data/content'
import Button from './Button'

const empty = {
  fullName: '',
  phone: '',
  email: '',
  location: '',
  message: '',
}

function validate(values) {
  const errors = {}
  if (!values.fullName.trim() || values.fullName.trim().length < 2) errors.fullName = 'Please enter your full name.'
  if (!values.phone.trim() || values.phone.trim().length < 8) errors.phone = 'Enter a valid phone number.'
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email or leave this blank.'
  }
  if (!values.message.trim()) errors.message = 'Please add a short message.'
  return errors
}

function contactMessage(values) {
  return [
    'Hello Linfi Polyclean, I would like to get in touch.',
    `Name: ${values.fullName}`,
    `Phone: ${values.phone}`,
    values.email ? `Email: ${values.email}` : '',
    values.location ? `Location: ${values.location}` : '',
    `Message: ${values.message}`,
  ]
    .filter(Boolean)
    .join('\n')
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export default function ContactForm() {
  const [values, setValues] = useState(empty)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const [whatsappLink, setWhatsappLink] = useState(null)

  const onChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const next = validate(values)
    setErrors(next)
    if (Object.keys(next).length === 0) {
      const result = tryOpenWhatsApp(contactMessage(values))
      setWhatsappLink(result.url)
      setCopied(false)
      setSuccess(true)
    }
  }

  const fieldClass =
    'mt-1 w-full rounded-lg border border-outline/70 bg-surface px-3 py-3 text-base text-ink outline-none transition focus:border-secondary focus:ring-1 focus:ring-secondary'

  if (success) {
    const message = contactMessage(values)
    return (
      <div className="rounded-2xl border border-outline/30 bg-white p-8 text-center shadow-[var(--shadow-card)]">
        <CircleCheckBig className="mx-auto h-12 w-12 text-green" aria-hidden="true" />
        <h3 className="font-headline mt-4 text-lg font-bold text-primary">Message ready</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {hasWhatsApp()
            ? 'If WhatsApp did not open, use the button below so our team can reply.'
            : 'Copy the message and send it to LINFI POLYCLEAN once a WhatsApp number is added.'}
        </p>
        {whatsappLink && (
          <Button href={whatsappLink} variant="whatsapp" className="mt-6">
            Continue on WhatsApp
          </Button>
        )}
        {!whatsappLink && (
          <Button
            className="mt-6"
            onClick={async () => {
              const ok = await copyText(message)
              setCopied(ok)
            }}
          >
            {copied ? 'Copied' : 'Copy message'}
          </Button>
        )}
        <Button
          variant="ghost"
          className="mt-3"
          onClick={() => {
            setSuccess(false)
            setCopied(false)
            setWhatsappLink(null)
            setValues(empty)
          }}
        >
          Send another message
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-outline/30 bg-white p-6 shadow-[var(--shadow-card)]">
      <div className="grid gap-4">
        <label className="text-sm font-semibold text-primary">
          Full Name
          <input className={fieldClass} name="fullName" value={values.fullName} onChange={onChange} autoComplete="name" />
          {errors.fullName && <span className="mt-1 block text-xs font-medium text-red-600">{errors.fullName}</span>}
        </label>
        <label className="text-sm font-semibold text-primary">
          Phone Number
          <input className={fieldClass} type="tel" name="phone" value={values.phone} onChange={onChange} autoComplete="tel" />
          {errors.phone && <span className="mt-1 block text-xs font-medium text-red-600">{errors.phone}</span>}
        </label>
        <label className="text-sm font-semibold text-primary">
          Email
          <input className={fieldClass} type="email" name="email" value={values.email} onChange={onChange} autoComplete="email" />
          {errors.email && <span className="mt-1 block text-xs font-medium text-red-600">{errors.email}</span>}
        </label>
        <label className="text-sm font-semibold text-primary">
          Location in Accra
          <input className={fieldClass} name="location" value={values.location} onChange={onChange} placeholder="e.g. Labone" />
        </label>
        <label className="text-sm font-semibold text-primary">
          Message
          <textarea className={`${fieldClass} min-h-28 resize-y`} name="message" value={values.message} onChange={onChange} />
          {errors.message && <span className="mt-1 block text-xs font-medium text-red-600">{errors.message}</span>}
        </label>
        <Button type="submit" fullWidth>
          Send Message
        </Button>
      </div>
    </form>
  )
}
