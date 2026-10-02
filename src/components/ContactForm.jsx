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

  if (success) {
    const message = contactMessage(values)
    return (
      <div className="success-card">
        <CircleCheckBig className="icon-success" aria-hidden="true" />
        <h3 className="headline" style={{ fontSize: '1.125rem', marginTop: '1rem' }}>
          Message ready
        </h3>
        <p className="lede">
          {hasWhatsApp()
            ? 'If WhatsApp did not open, use the button below so our team can reply.'
            : 'Copy the message and send it to LINFI POLYCLEAN once a WhatsApp number is added.'}
        </p>
        {whatsappLink && (
          <Button href={whatsappLink} variant="whatsapp" style={{ marginTop: '1.5rem' }}>
            Continue on WhatsApp
          </Button>
        )}
        {!whatsappLink && (
          <Button
            style={{ marginTop: '1.5rem' }}
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
          style={{ marginTop: '0.75rem' }}
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
    <form onSubmit={onSubmit} noValidate className="form-card">
      <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
        <label className="field field-title">
          Full Name
          <input className="input" name="fullName" value={values.fullName} onChange={onChange} autoComplete="name" />
          {errors.fullName && <span className="field-error">{errors.fullName}</span>}
        </label>
        <label className="field field-title">
          Phone Number
          <input className="input" type="tel" name="phone" value={values.phone} onChange={onChange} autoComplete="tel" />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </label>
        <label className="field field-title">
          Email
          <input className="input" type="email" name="email" value={values.email} onChange={onChange} autoComplete="email" />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </label>
        <label className="field field-title">
          Location in Accra
          <input className="input" name="location" value={values.location} onChange={onChange} placeholder="e.g. Labone" />
        </label>
        <label className="field field-title">
          Message
          <textarea className="textarea" name="message" value={values.message} onChange={onChange} />
          {errors.message && <span className="field-error">{errors.message}</span>}
        </label>
        <Button type="submit" fullWidth>
          Send Message
        </Button>
      </div>
    </form>
  )
}
