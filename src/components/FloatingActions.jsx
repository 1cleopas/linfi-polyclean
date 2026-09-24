import { MessageCircle, Phone } from 'lucide-react'
import { company, hasPhone, hasWhatsApp, phoneHref, whatsappUrl } from '../data/content'

export default function FloatingActions() {
  if (!hasPhone() && !hasWhatsApp()) return null

  return (
    <>
      {hasPhone() && (
        <a
          href={phoneHref()}
          className="fixed bottom-24 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg transition hover:scale-105 md:bottom-8 md:hidden"
          aria-label={`Call ${company.name}`}
        >
          <Phone className="h-5 w-5" aria-hidden="true" />
        </a>
      )}
      {hasWhatsApp() && (
        <a
          href={whatsappUrl()}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat on WhatsApp"
          className="pulse-wa fixed right-4 bottom-24 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-lg transition hover:scale-110 md:right-6 md:bottom-8"
        >
          <MessageCircle className="h-7 w-7" aria-hidden="true" />
        </a>
      )}
    </>
  )
}
