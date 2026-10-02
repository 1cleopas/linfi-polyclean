import { MessageCircle, Phone } from 'lucide-react'
import { company, hasPhone, hasWhatsApp, phoneHref, whatsappUrl } from '../data/content'

export default function FloatingActions() {
  if (!hasPhone() && !hasWhatsApp()) return null

  return (
    <>
      {hasPhone() && (
        <a href={phoneHref()} className="float-call" aria-label={`Call ${company.name}`}>
          <Phone className="icon" aria-hidden="true" />
        </a>
      )}
      {hasWhatsApp() && (
        <a href={whatsappUrl()} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" className="float-wa pulse-wa">
          <MessageCircle className="icon-xl" aria-hidden="true" />
        </a>
      )}
    </>
  )
}
