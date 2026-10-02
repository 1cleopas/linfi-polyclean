import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import {
  company,
  emailHref,
  hasHours,
  hasWhatsApp,
  phoneHref,
  whatsappUrl,
} from '../data/content'

function Value({ href, external, children }) {
  if (!href) {
    return <p className="field-title">{children}</p>
  }

  return (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
      {children}
    </a>
  )
}

export default function ContactDetails() {
  const items = [
    { icon: Phone, label: 'Phone', value: company.phone, href: phoneHref() },
    {
      icon: MessageCircle,
      label: 'WhatsApp',
      value: company.whatsapp,
      href: hasWhatsApp() ? whatsappUrl() : null,
      external: true,
    },
    { icon: Mail, label: 'Email', value: company.email, href: emailHref() },
    { icon: MapPin, label: 'Service Area', value: company.serviceArea },
    hasHours() ? { icon: Clock, label: 'Working Hours', value: company.hours } : null,
  ].filter(Boolean)

  return (
    <ul className="contact-list">
      {items.map(({ icon: Icon, label, value, href, external }) => (
        <li key={label} className="contact-card">
          <span className="contact-icon">
            <Icon className="icon" aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">{label}</p>
            <Value href={href} external={external}>
              {value}
            </Value>
          </div>
        </li>
      ))}
    </ul>
  )
}
