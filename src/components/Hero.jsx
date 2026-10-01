import { CalendarDays, MessageCircle, ShieldCheck, Droplets, MapPin, Clock } from 'lucide-react'
import { hasWhatsApp, images, trustBadges, whatsappUrl } from '../data/content'
import { useQuote } from '../context/QuoteContext'
import Button from './Button'

const badgeIcons = [ShieldCheck, Droplets, MapPin, Clock]

export default function Hero() {
  const { openQuote } = useQuote()

  return (
    <section
      id="home"
      className="relative flex min-h-[85vh] scroll-mt-28 items-center justify-center overflow-hidden px-4 py-16 md:px-10"
    >
      <div className="absolute inset-0 z-0">
        <img
          src={images.hero}
          alt="Ghanaian technician wearing a face mask while professionally cleaning a polytank water storage tank in Accra"
          className="hero-zoom h-full w-full object-cover object-[center_30%]"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/40 to-surface" />
        <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
          <span className="hero-orb hero-orb-a" />
          <span className="hero-orb hero-orb-b" />
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-col items-center text-center">
        <span className="anim-fade-up mb-6 inline-flex items-center gap-1.5 rounded-full border border-secondary/20 bg-aqua-bright/20 px-4 py-1.5 text-xs font-semibold tracking-wide text-secondary uppercase">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Accra · Polytank Cleaning
        </span>
        <h1 className="anim-fade-up font-headline max-w-4xl text-[28px] leading-[34px] font-bold tracking-tight text-primary md:text-5xl md:leading-[56px]" style={{ animationDelay: '80ms' }}>
          Clean Water Starts With a <span className="text-gradient">Clean Tank.</span>
        </h1>
        <p className="anim-fade-up mt-6 max-w-2xl text-base leading-7 text-muted md:text-lg md:leading-8" style={{ animationDelay: '160ms' }}>
          Professional polytank cleaning and disinfection services in Accra. We help households, businesses,
          schools, offices, and properties keep their water storage tanks clean, hygienic, and well maintained.
        </p>
        <div className="anim-fade-up mt-10 flex w-full flex-col gap-4 sm:w-auto sm:flex-row" style={{ animationDelay: '240ms' }}>
          <Button className="px-8 py-4" onClick={() => openQuote()}>
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
            Book a Cleaning
          </Button>
          {hasWhatsApp() && (
            <Button href={whatsappUrl()} variant="outline" className="px-8 py-4">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Chat on WhatsApp
            </Button>
          )}
        </div>
        <ul className="anim-fade-up mt-14 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" style={{ animationDelay: '320ms' }}>
          {trustBadges.map((item, i) => {
            const Icon = badgeIcons[i] || ShieldCheck
            return (
              <li
                key={item}
                className="flex items-center justify-center gap-3 rounded-xl border border-outline/40 bg-white/60 px-4 py-4 backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-secondary/40 hover:shadow-[var(--shadow-card)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-aqua-bright/30 text-secondary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-primary">{item}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
