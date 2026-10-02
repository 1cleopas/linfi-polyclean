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
    <article className="service-card">
      {service.image && (
        <div className="service-card-photo">
          <img src={service.image} alt={service.name} />
        </div>
      )}
      <div className="service-icon">
        <Icon className="icon-xl" aria-hidden="true" />
      </div>
      <h3>{service.name}</h3>
      <p>{service.short}</p>
      <button type="button" className="service-book" onClick={() => openQuote({ service: service.quoteValue })}>
        Book This Service
        <ArrowRight className="icon-sm" aria-hidden="true" />
      </button>
    </article>
  )
}

export function ServicesGrid() {
  return (
    <section className="section" id="services">
      <div className="wrap">
        <SectionHeader
          title="Our Services"
          subtitle="Professional polytank and water-tank cleaning for homes, apartments and businesses in Accra."
        />
        <div className="service-grid">
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
