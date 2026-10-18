import { useEffect, useMemo, useState } from 'react'
import { CircleCheckBig } from 'lucide-react'
import { Link } from 'react-router-dom'
import { company, emailHref, hasWhatsApp, serviceOptions, tankSizes, tankTypes, tryOpenWhatsApp } from '../data/content'
import { workWeeksForMonths, WORK_DAYS } from '../lib/weeks'
import { createBooking } from '../lib/api'
import { useQuote } from '../context/QuoteContext'
import Button from './Button'

const MAX_TANK_SIZE_FIELDS = 8

const empty = {
  fullName: '',
  phone: '',
  whatsapp: '',
  email: '',
  location: '',
  gpsAddress: '',
  tankType: '',
  tankSize: '',
  tankSizesByTank: [''],
  tanks: '',
  week: '',
  time: '',
  extra: '',
  service: '',
}

function tankCount(value) {
  const count = Number.parseInt(String(value).trim(), 10)
  if (!Number.isFinite(count) || count < 2) return 1
  return Math.min(count, 100)
}

function sizeFieldCount(value) {
  return Math.min(tankCount(value), MAX_TANK_SIZE_FIELDS)
}

function tankSizeList(values) {
  const count = tankCount(values.tanks)
  return Array.from({ length: count }, (_, index) => values.tankSizesByTank?.[index] || '')
}

const AUTO_PREFIX = 'I would like: '

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
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email or leave this blank.'
  }
  if (!values.location.trim()) errors.location = 'Tell us your location in Accra.'
  if (!values.week) errors.week = 'Choose a preferred week.'
  return errors
}

function bookingMessage(values) {
  return [
    'Hello Linfi Polyclean, I would like to book a polytank cleaning. Please send me more information.',
    '',
    `Name: ${values.fullName}`,
    `Phone: ${values.phone}`,
    `WhatsApp: ${values.whatsapp || values.phone}`,
    values.email ? `Email: ${values.email}` : '',
    `Location: ${values.location}`,
    values.gpsAddress ? `GPS address: ${values.gpsAddress}` : '',
    values.service ? `Service: ${values.service}` : '',
    values.tankType ? `Tank type: ${values.tankType}` : '',
    tankSizeList(values).some(Boolean)
      ? tankSizeList(values)
          .map((size, index) => `Tank ${index + 1}: ${size || 'size not given'}`)
          .join('\n')
      : '',
    values.tanks ? `Number of tanks: ${values.tanks}` : '',
    values.week ? `Preferred week: ${values.week} (working days ${WORK_DAYS})` : '',
    values.time ? `Preferred time: ${values.time}` : '',
    values.extra ? `Additional information: ${values.extra}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function confirmationNote(channels) {
  const sms = channels.includes('sms')
  const email = channels.includes('email')
  if (sms && email) return ' A confirmation is on its way by SMS and email.'
  if (sms) return ' A confirmation is on its way by SMS.'
  if (email) return ' A confirmation is on its way by email.'
  return ''
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
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [confirmations, setConfirmations] = useState([])
  const workWeeks = useMemo(() => workWeeksForMonths(3), [])

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
    setValues((prev) => {
      if (name === 'service') {
        const wasAuto = !prev.extra || prev.extra.startsWith(AUTO_PREFIX)
        return { ...prev, service: value, extra: wasAuto ? (value ? `${AUTO_PREFIX}${value}` : '') : prev.extra }
      }
      if (name !== 'tanks') return { ...prev, [name]: value }
      const count = sizeFieldCount(value)
      const tankSizesByTank = Array.from({ length: count }, (_, i) => prev.tankSizesByTank?.[i] || (i === 0 ? prev.tankSize : ''))
      return { ...prev, tanks: value, tankSizesByTank }
    })
  }

  const onTankSizeChange = (index, value) => {
    setValues((prev) => {
      const tankSizesByTank = Array.from({ length: Math.max(prev.tankSizesByTank.length, index + 1) }, (_, i) => prev.tankSizesByTank[i] || '')
      tankSizesByTank[index] = value
      return {
        ...prev,
        tankSizesByTank,
        tankSize: sizeFieldCount(prev.tanks) < 2 ? value : prev.tankSize,
      }
    })
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const next = validate(values)
    setErrors(next)
    if (Object.keys(next).length !== 0) return

    setSaving(true)
    setSaveError('')
    let saved
    try {
      saved = await createBooking({
        fullName: values.fullName,
        phone: values.phone,
        whatsapp: values.whatsapp,
        email: values.email.trim(),
        location: values.location,
        gpsAddress: values.gpsAddress,
        service: values.service,
        tankType: values.tankType,
        tankSize: tankSizeList(values)[0] || '',
        tankSizes: tankSizeList(values),
        tanks: values.tanks,
        week: values.week,
        time: values.time,
        extra: values.extra,
      })
    } catch (err) {
      setSaveError(err.message || 'The booking could not be saved. Please try again.')
      setSaving(false)
      return
    }

    const message = bookingMessage(values)
    const result = tryOpenWhatsApp(message)
    setConfirmations(Array.isArray(saved?.confirmations) ? saved.confirmations : [])
    setWhatsappLink(result.url)
    setCopied(false)
    setSuccess(true)
    setSaving(false)
  }

  if (success) {
    const message = bookingMessage(values)
    return (
      <div className="success-card">
        <CircleCheckBig className="icon-2xl" aria-hidden="true" />
        <h3 className="headline" style={{ marginTop: '1rem' }}>
          Request received
        </h3>
        <p className="lede" style={{ maxWidth: '32rem', marginInline: 'auto' }}>
          Thank you, {values.fullName.split(' ')[0] || 'there'}. Your booking has been saved and our team will call you to
          confirm the day and time.
          {tankCount(values.tanks) > 1 ? ' Each tank was saved as its own booking.' : ''}
          {confirmationNote(confirmations)}
        </p>
        {whatsappLink && (
          <>
            <p className="field-hint" style={{ marginTop: '1.5rem', fontWeight: 600 }}>
              WhatsApp didn’t open? Tap below to send us your booking details.
            </p>
            <Button href={whatsappLink} variant="whatsapp" style={{ marginTop: '0.75rem' }}>
              Continue on WhatsApp
            </Button>
          </>
        )}
        {!whatsappLink && (
          <p className="field-hint" style={{ marginTop: '1.5rem' }}>Copy the request below and send it to {company.name}.</p>
        )}
        {!whatsappLink && (
          <Button
            style={{ marginTop: '2rem' }}
            onClick={async () => {
              const ok = await copyText(message)
              setCopied(ok)
            }}
          >
            {copied ? 'Copied' : 'Copy request details'}
          </Button>
        )}
        {emailHref() && (
          <Button
            variant="outline"
            href={emailHref({ subject: `Booking request from ${values.fullName}`, body: message })}
            style={{ marginTop: '0.75rem' }}
          >
            Send by email instead
          </Button>
        )}
        <Button
          variant="ghost"
          style={{ marginTop: '0.75rem' }}
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
    <form onSubmit={onSubmit} noValidate className="form-grid">
      <label className="field">
        Full Name *
        <input className="input" name="fullName" value={values.fullName} onChange={onChange} autoComplete="name" />
        {errors.fullName && <span className="field-error">{errors.fullName}</span>}
      </label>
      <label className="field">
        Phone Number *
        <input className="input" type="tel" name="phone" value={values.phone} onChange={onChange} autoComplete="tel" />
        {errors.phone && <span className="field-error">{errors.phone}</span>}
      </label>
      <label className="field">
        WhatsApp Number
        <input className="input" type="tel" name="whatsapp" value={values.whatsapp} onChange={onChange} autoComplete="tel" />
      </label>
      <label className="field">
        Email
        <input className="input" type="email" name="email" value={values.email} onChange={onChange} autoComplete="email" />
        {errors.email && <span className="field-error">{errors.email}</span>}
        <span className="field-hint">Optional. We will email you a copy of your booking.</span>
      </label>
      <label className="field">
        Location in Accra *
        <input className="input" name="location" value={values.location} onChange={onChange} placeholder="e.g. East Legon, Spintex" />
        {errors.location && <span className="field-error">{errors.location}</span>}
      </label>
      <label className="field">
        GPS Address
        <input
          className="input"
          name="gpsAddress"
          value={values.gpsAddress}
          onChange={onChange}
          onBlur={(e) => setValues((prev) => ({ ...prev, gpsAddress: e.target.value.trim().toUpperCase() }))}
          placeholder="e.g. GA-123-4567"
          autoCapitalize="characters"
        />
        <span className="field-hint">Your Ghana Post GPS digital address, so our team can find you.</span>
      </label>
      <label className="field">
        Service
        <select className="select" name="service" value={values.service} onChange={onChange}>
          <option value="">Select service</option>
          {values.service && !serviceOptions.includes(values.service) && <option value={values.service}>{values.service}</option>}
          {serviceOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Tank Type
        <select className="select" name="tankType" value={values.tankType} onChange={onChange}>
          <option value="">Select type</option>
          {tankTypes.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        Number of Tanks
        <input className="input" name="tanks" value={values.tanks} onChange={onChange} inputMode="numeric" placeholder="e.g. 1" />
        <span className="field-hint">Each tank is saved as its own booking.</span>
      </label>
      {sizeFieldCount(values.tanks) < 2 ? (
        <label className="field">
          Tank Size
          <select className="select" value={values.tankSizesByTank[0] || ''} onChange={(e) => onTankSizeChange(0, e.target.value)}>
            <option value="">Select size</option>
            {tankSizes.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <div className="form-grid form-span">
          {Array.from({ length: sizeFieldCount(values.tanks) }, (_, index) => (
            <label key={index} className="field">
              Tank {index + 1} size
              <select className="select" value={values.tankSizesByTank[index] || ''} onChange={(e) => onTankSizeChange(index, e.target.value)}>
                <option value="">Select size</option>
                {tankSizes.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <p className="field-hint form-span">
            Choose a size for each tank if they are different.
            {tankCount(values.tanks) > MAX_TANK_SIZE_FIELDS
              ? ` For tanks after ${MAX_TANK_SIZE_FIELDS}, list the other sizes in Additional Information.`
              : ''}
          </p>
        </div>
      )}
      <label className="field">
        Preferred Week *
        <select className="select" name="week" value={values.week} onChange={onChange}>
          <option value="">Select a week</option>
          {workWeeks.map((week) => (
            <option key={week.value} value={week.label}>
              {week.label}
            </option>
          ))}
        </select>
        {errors.week && <span className="field-error">{errors.week}</span>}
        <span className="field-hint">Working days are {WORK_DAYS} (Monday off).</span>
      </label>
      <label className="field">
        Preferred Time
        <select className="select" name="time" value={values.time} onChange={onChange}>
          <option value="">Any time</option>
          <option>Morning (8am – 12pm)</option>
          <option>Afternoon (12pm – 4pm)</option>
          <option>Evening (4pm – 6pm)</option>
        </select>
        <span className="field-hint">We will confirm a day in your chosen week.</span>
      </label>
      <label className="field form-span">
        Additional Information
        <textarea
          className="textarea"
          name="extra"
          value={values.extra}
          onChange={onChange}
          placeholder="Access notes, tank condition, or the service you need"
        />
      </label>
      <div className="form-span">
        {saveError && <p className="field-error" style={{ textAlign: 'center', marginBottom: '0.75rem' }}>{saveError}</p>}
        <Button type="submit" fullWidth disabled={saving}>
          {saving ? 'Saving booking…' : 'Book a Cleaning'}
        </Button>
        <p className="field-hint" style={{ textAlign: 'center', marginTop: '0.75rem' }}>
          {hasWhatsApp()
            ? 'Submitting opens WhatsApp with your details so LINFI POLYCLEAN can respond quickly.'
            : 'Submit the form to prepare your request. Add a WhatsApp number in the site contact details before publishing.'}
        </p>
        <p className="field-hint form-privacy-note" style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          We use your details only to arrange your cleaning. See our <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </form>
  )
}
