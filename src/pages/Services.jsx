import {
  Building2,
  Droplets,
  Home,
  Warehouse,
  Search,
  Sparkles,
} from 'lucide-react'
import { images, services } from '../data/content'
import { useQuote } from '../context/QuoteContext'
import PageHero from '../components/PageHero'
import Button from '../components/Button'
import Seo from '../components/Seo'
import CTA from '../components/CTA'
import Reveal from '../components/Reveal'

const icons = {
  droplets: Droplets,
  sparkles: Sparkles,
  home: Home,
  building: Building2,
  buildings: Warehouse,
  search: Search,
}

export default function Services() {
  const { openQuote } = useQuote()

  return (
    <>
      <Seo
        title="Polytank Cleaning Services in Accra | Linfi Polyclean"
        description="Residential, apartment, estate and commercial polytank cleaning plus water tank disinfection in Accra, Ghana."
        path="/services"
      />
      <PageHero
        title="Our Services"
        subtitle="Polytank cleaning, disinfection, and tank work for homes, apartments, estates and businesses."
        image={images.compound}
        imageAlt="Polytanks at a residential compound in Accra"
      />

      <div className="bg-surface section-pad">
        <div className="wrap service-rows">
          {services.map((service, index) => {
            const Icon = icons[service.icon] || Sparkles
            const reverse = index % 2 === 1
            return (
              <Reveal key={service.id} from={reverse ? 'right' : 'left'}>
                <article id={service.id} className={`service-row ${reverse ? 'is-reverse' : ''}`}>
                  <div className="service-row-media">
                    <img src={service.image || images.hero} alt={`${service.name} in Accra by LINFI POLYCLEAN`} loading="lazy" />
                  </div>
                  <div className="service-row-copy">
                    <span className="service-row-icon">
                      <Icon className="icon-lg" aria-hidden="true" />
                    </span>
                    <h2 className="headline">{service.name}</h2>
                    <p className="lede">{service.description}</p>
                    <Button style={{ marginTop: '1.5rem' }} onClick={() => openQuote({ service: service.quoteValue })}>
                      Book This Service
                    </Button>
                  </div>
                </article>
              </Reveal>
            )
          })}
        </div>
      </div>
      <CTA />
    </>
  )
}
