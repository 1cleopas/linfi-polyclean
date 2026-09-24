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
        description="Residential, commercial and estate polytank cleaning plus water tank disinfection and tank inspection in Accra, Ghana."
        path="/services"
      />
      <PageHero
        title="Our Services"
        subtitle="Polytank cleaning, disinfection, residential and commercial tank work, estate cleaning and visual inspections."
        image={images.hero}
        imageAlt="Technician cleaning a polytank in Accra"
      />

      <div className="bg-surface py-16 md:py-24">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 md:px-10">
          {services.map((service, index) => {
            const Icon = icons[service.icon] || Sparkles
            const reverse = index % 2 === 1
            return (
              <article
                key={service.id}
                id={service.id}
                className="scroll-mt-28 grid items-center gap-8 overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-card)] lg:grid-cols-2"
              >
                <div className={`relative h-64 lg:h-full ${reverse ? 'lg:order-2' : ''}`}>
                  <img
                    src={index % 2 === 0 ? images.whyUs : images.after}
                    alt={`${service.name} in Accra by LINFI POLYCLEAN`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 md:p-10">
                  <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-primary">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h2 className="font-headline text-2xl font-bold text-primary md:text-3xl">{service.name}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">{service.description}</p>
                  <Button className="mt-6" onClick={() => openQuote({ service: service.quoteValue })}>
                    Book This Service
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      </div>
      <CTA />
    </>
  )
}
