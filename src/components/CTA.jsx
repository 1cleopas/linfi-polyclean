import { CalendarDays, MessageCircle, Phone } from 'lucide-react'
import { hasPhone, hasWhatsApp, phoneHref, whatsappUrl } from '../data/content'
import { useQuote } from '../context/QuoteContext'
import Button from './Button'

export default function CTA({
  title = 'Is Your Polytank Due for a Cleaning?',
  text = "Don't wait until dirt and buildup become a problem. Contact LINFI POLYCLEAN today and schedule your tank cleaning.",
}) {
  const { openQuote } = useQuote()

  return (
    <section className="cta-band px-4 py-16 text-center md:py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-headline text-3xl font-bold tracking-tight text-white md:text-4xl">{title}</h2>
        <p className="mt-4 text-base text-white/85 md:text-lg">{text}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {hasPhone() && (
            <Button variant="light" href={phoneHref()}>
              <Phone className="h-4 w-4" aria-hidden="true" />
              Call Now
            </Button>
          )}
          {hasWhatsApp() && (
            <Button variant="whatsapp" href={whatsappUrl()}>
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp Us
            </Button>
          )}
          <Button variant="green" onClick={() => openQuote()}>
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Book a Cleaning
          </Button>
        </div>
      </div>
    </section>
  )
}
