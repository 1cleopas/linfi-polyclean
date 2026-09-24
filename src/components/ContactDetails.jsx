import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import {
  company,
  emailHref,
  hasWhatsApp,
  phoneHref,
  whatsappUrl,
} from '../data/content'

const cardClass = 'flex gap-4 rounded-2xl bg-white p-4 shadow-[var(--shadow-card)]'
const iconWrapClass = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-primary'
const valueClass = 'font-semibold text-primary'

function Value({ href, external, children }) {
  if (!href) {
    return <p className={valueClass}>{children}</p>
  }

  return (
    <a
      className={`${valueClass} hover:text-secondary`}
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
    >
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
    { icon: Clock, label: 'Working Hours', value: company.hours },
  ]

  return (
    <ul className="mt-8 space-y-4">
      {items.map(({ icon: Icon, label, value, href, external }) => (
        <li key={label} className={cardClass}>
          <span className={iconWrapClass}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold tracking-wider text-muted uppercase">{label}</p>
            <Value href={href} external={external}>
              {value}
            </Value>
          </div>
        </li>
      ))}
    </ul>
  )
}
