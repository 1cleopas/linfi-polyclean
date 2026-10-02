import { CalendarDays, MessageCircle, ShieldCheck, Droplets, MapPin, Clock } from 'lucide-react'
import { company, hasWhatsApp, images, trustBadges, whatsappUrl } from '../data/content'
import { useQuote } from '../context/QuoteContext'
import Button from './Button'

const badgeIcons = [ShieldCheck, Droplets, MapPin, Clock]

export default function Hero() {
  const { openQuote } = useQuote()

  return (
    <section id="home" className="hero">
      <div className="hero-media">
        <img
          src={images.hero}
          alt="Ghanaian technician wearing a face mask while professionally cleaning a polytank water storage tank in Accra"
          className="hero-photo"
          fetchPriority="high"
        />
        <div className="hero-wash" />
      </div>

      <div className="hero-copy">
        <span className="pill anim-fade-up">{company.name}</span>
        <h1 className="anim-fade-up" style={{ animationDelay: '80ms' }}>
          Clean Water Starts With a <em>Clean Tank.</em>
        </h1>
        <p className="hero-lead anim-fade-up" style={{ animationDelay: '160ms' }}>
          Professional polytank cleaning and disinfection services in Accra. We help households, businesses,
          schools, offices, and properties keep their water storage tanks clean, hygienic, and well maintained.
        </p>
        <div className="hero-actions anim-fade-up" style={{ animationDelay: '240ms' }}>
          <Button onClick={() => openQuote()}>
            <CalendarDays className="icon" aria-hidden="true" />
            Book a Cleaning
          </Button>
          {hasWhatsApp() && (
            <Button href={whatsappUrl()} variant="outline">
              <MessageCircle className="icon" aria-hidden="true" />
              Chat on WhatsApp
            </Button>
          )}
        </div>
        <ul className="trust-list anim-fade-up" style={{ animationDelay: '320ms' }}>
          {trustBadges.map((item, i) => {
            const Icon = badgeIcons[i] || ShieldCheck
            return (
              <li key={item} className="trust-item">
                <span className="trust-icon">
                  <Icon className="icon" aria-hidden="true" />
                </span>
                <span>{item}</span>
              </li>
            )
          })}
        </ul>
      </div>
      <a className="hero-scroll" href="#about">
        Scroll to discover
      </a>
    </section>
  )
}
