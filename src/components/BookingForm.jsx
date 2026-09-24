import { useEffect, useMemo, useState } from 'react'
import { CircleCheckBig } from 'lucide-react'
import { hasWhatsApp, tankSizes, tankTypes, tryOpenWhatsApp } from '../data/content'
import { useQuote } from '../context/QuoteContext'
import Button from './Button'

const empty = {
  fullName: '',
  phone: '',
  whatsapp: '',
  location: '',
  tankType: '',
  tankSize: '',
  tanks: '',
  date: '',
  time: '',
  extra: '',
  service: '',
}

const AUTO_PREFIX = 'I would like: '

function todayLocal() {
  const d = new Date()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

function withDefaults(service) {
  return {
    ...empty,
    service: service || '',
    extra: service ? `${AUTO_PREFIX}${service}` : '',
  }
}

function validate(values) {
  const errors = {}
  if (!values.fullName.trim() || values.fullName.trim().length < 2) errors.fullName = 'Please enter your full name.'
  if (!values.phone.trim() || values.phone.trim().length < 8) errors.phone = 'Enter a valid phone number.'
  if (!values.location.trim()) errors.location = 'Tell us your location in Accra.'
  return errors
}

function bookingMessage(values) {
  return [
    'Hello Linfi Polyclean, I would like to book a polytank cleaning. Please send me more information.',
    '',
    `Name: ${values.fullName}`,
    `Phone: ${values.phone}`,
    `WhatsApp: ${values.whatsapp || values.phone}`,
    `Location: ${values.location}`,
    values.service ? `Service: ${values.service}` : '',
    values.tankType ? `Tank type: ${values.tankType}` : '',
    values.tankSize ? `Tank size: ${values.tankSize}` : '',
    values.tanks ? `Number of tanks: ${values.tanks}` : '',
    values.date ? `Preferred date: ${values.date}` : '',
    values.time ? `Preferred time: ${values.time}` : '',
    values.extra ? `Additional information: ${values.extra}` : '',
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

export default function BookingForm() {
  const { defaults } = useQuote()
  const [values, setValues] = useState(() => withDefaults(defaults.service))
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const [copied, setCopied] = useState(false)
  const [whatsappLink, setWhatsappLink] = useState(null)
  const minDate = useMemo(() => todayLocal(), [])

  useEffect(() => {
    setValues((prev) => {
      const wasAuto = !prev.extra || prev.extra.startsWith(AUTO_PREFIX)
      return {
        ...prev,
        service: defaults.service || '',
        extra: defaults.service ? (wasAuto ? `${AUTO_PREFIX}${defaults.service}` : prev.extra) : wasAuto ? '' : prev.extra,
      }
    })
  }, [defaults.service])

  const onChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const next = validate(values)
    setErrors(next)
    if (Object.keys(next).length === 0) {
      const message = bookingMessage(values)
      const result = tryOpenWhatsApp(message)
      setWhatsappLink(result.url)
      setCopied(false)
      setSuccess(true)
    }
  }

  const fieldClass =
    'rounded-lg border border-outline/70 bg-surface px-3 py-3 text-base text-ink outline-none transition focus:border-secondary focus:ring-1 focus:ring-secondary'

  if (success) {
    const message = bookingMessage(values)
    return (
      <div className="rounded-3xl border border-outline/30 bg-white p-8 text-center shadow-[var(--shadow-card)] md:p-12">
        <CircleCheckBig className="mx-auto h-14 w-14 text-green" aria-hidden="true" />
        <h3 className="font-headline mt-4 text-2xl font-bold text-primary">Request received</h3>
        <p className="mx-auto mt-3 max-w-lg text-muted">
          Thank you, {values.fullName.split(' ')[0] || 'there'}. Your polytank cleaning request is ready.
          {hasWhatsApp()
            ? ' If WhatsApp did not open, use the button below to send the details.'
            : ' Copy the request below and send it to LINFI POLYCLEAN when contact details are added.'}
        </p>
        {whatsappLink && (
          <Button href={whatsappLink} variant="whatsapp" className="mt-8">
            Continue on WhatsApp
          </Button>
        )}
        {!whatsappLink && (
          <Button
            className="mt-8"
            onClick={async () => {
              const ok = await copyText(message)
              setCopied(ok)
            }}
          >
            {copied ? 'Copied' : 'Copy request details'}
          </Button>
        )}
        <Button
          variant="ghost"
          className="mt-3"
          onClick={() => {
            setSuccess(false)
            setCopied(false)
            setWhatsappLink(null)
            setValues(withDefaults(defaults.service))
          }}
        >
          Submit another request
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
        Full Name *
        <input className={fieldClass} name="fullName" value={values.fullName} onChange={onChange} autoComplete="name" />
        {errors.fullName && <span className="font-medium normal-case text-red-600">{errors.fullName}</span>}
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
        Phone Number *
        <input className={fieldClass} type="tel" name="phone" value={values.phone} onChange={onChange} autoComplete="tel" />
        {errors.phone && <span className="font-medium normal-case text-red-600">{errors.phone}</span>}
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
        WhatsApp Number
        <input className={fieldClass} type="tel" name="whatsapp" value={values.whatsapp} onChange={onChange} autoComplete="tel" />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
        Location in Accra *
        <input
          className={fieldClass}
          name="location"
          value={values.location}
          onChange={onChange}
          placeholder="e.g. East Legon, Spintex"
        />
        {errors.location && <span className="font-medium normal-case text-red-600">{errors.location}</span>}
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
        Tank Type
        <select className={fieldClass} name="tankType" value={values.tankType} onChange={onChange}>
          <option value="">Select type</option>
          {tankTypes.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
        Tank Size
        <select className={fieldClass} name="tankSize" value={values.tankSize} onChange={onChange}>
          <option value="">Select size</option>
          {tankSizes.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
        Number of Tanks
        <input className={fieldClass} name="tanks" value={values.tanks} onChange={onChange} inputMode="numeric" placeholder="e.g. 1" />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
        Preferred Date
        <input className={fieldClass} type="date" name="date" value={values.date} min={minDate} onChange={onChange} />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase">
        Preferred Time
        <select className={fieldClass} name="time" value={values.time} onChange={onChange}>
          <option value="">Any time</option>
          <option>Morning (8am – 12pm)</option>
          <option>Afternoon (12pm – 4pm)</option>
          <option>Evening (4pm – 6pm)</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold tracking-wide text-muted uppercase md:col-span-2">
        Additional Information
        <textarea
          className={`${fieldClass} min-h-28 resize-y`}
          name="extra"
          value={values.extra}
          onChange={onChange}
          placeholder="Access notes, tank condition, or the service you need"
        />
      </label>
      <input type="hidden" name="service" value={values.service} />
      {values.service && (
        <p className="text-sm font-medium text-secondary md:col-span-2">Selected service: {values.service}</p>
      )}
      <div className="md:col-span-2">
        <Button type="submit" fullWidth className="rounded-xl py-4">
          Book a Cleaning
        </Button>
        <p className="mt-3 text-center text-xs text-muted">
          {hasWhatsApp()
            ? 'Submitting opens WhatsApp with your details so LINFI POLYCLEAN can respond quickly.'
            : 'Submit the form to prepare your request. Add a WhatsApp number in the site contact details before publishing.'}
        </p>
      </div>
    </form>
  )
}
