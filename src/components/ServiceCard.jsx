import {
  ArrowRight,
  Building2,
  Droplets,
  Home,
  Warehouse,
  Search,
  Sparkles,
} from 'lucide-react'
import { services } from '../data/content'
import { useQuote } from '../context/QuoteContext'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

const icons = {
  droplets: Droplets,
  sparkles: Sparkles,
  home: Home,
  building: Building2,
  buildings: Warehouse,
  search: Search,
}

export default function ServiceCard({ service }) {
  const { openQuote } = useQuote()
  const Icon = icons[service.icon] || Droplets

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-outline/30 bg-white p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-secondary hover:shadow-[var(--shadow-lift)]">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors group-hover:bg-secondary group-hover:text-white">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <h3 className="font-headline text-xl font-semibold text-primary">{service.name}</h3>
      <p className="mt-3 mb-6 flex-1 text-sm leading-6 text-muted">{service.short}</p>
      <button
        type="button"
        className="mt-auto inline-flex w-fit items-center gap-1 text-sm font-semibold text-secondary transition hover:gap-2 hover:text-primary"
        onClick={() => openQuote({ service: service.quoteValue })}
      >
        Book This Service
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </article>
  )
}

export function ServicesGrid() {
  return (
    <section className="scroll-mt-28 px-4 md:px-10" id="services">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          title="Our Services"
          subtitle="Professional polytank and water-tank cleaning for homes, apartments and businesses in Accra."
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.id} delay={i * 50}>
              <ServiceCard service={service} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
