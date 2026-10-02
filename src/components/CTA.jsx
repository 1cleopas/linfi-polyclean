import { CalendarDays, MessageCircle, Phone } from 'lucide-react'
import { hasPhone, hasWhatsApp, images, phoneHref, whatsappUrl } from '../data/content'
import { useQuote } from '../context/QuoteContext'
import Button from './Button'
import Reveal from './Reveal'

export default function CTA({
  title = 'Is Your Polytank Due for a Cleaning?',
  text = "Don't wait until dirt and buildup become a problem. Contact LINFI POLYCLEAN today and schedule your tank cleaning.",
}) {
  const { openQuote } = useQuote()

  return (
    <section className="cta-band">
      <img src={images.commercial} alt="" className="cta-photo" />
      <div className="cta-wash" />
      <Reveal>
        <div className="cta-inner">
          <h2>{title}</h2>
          <p>{text}</p>
          <div className="cta-actions">
            {hasPhone() && (
              <Button variant="light" href={phoneHref()}>
                <Phone className="icon-sm" aria-hidden="true" />
                Call Now
              </Button>
            )}
            {hasWhatsApp() && (
              <Button variant="whatsapp" href={whatsappUrl()}>
                <MessageCircle className="icon-sm" aria-hidden="true" />
                WhatsApp Us
              </Button>
            )}
            <Button variant="green" onClick={() => openQuote()}>
              <CalendarDays className="icon-sm" aria-hidden="true" />
              Book a Cleaning
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
