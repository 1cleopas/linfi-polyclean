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
        image={images.hero}
        imageAlt="Technician cleaning a polytank in Accra"
      />

      <div className="bg-surface py-16 md:py-24">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 md:px-10">
          {services.map((service, index) => {
            const Icon = icons[service.icon] || Sparkles
            const reverse = index % 2 === 1
            return (
              <Reveal key={service.id} from={reverse ? 'right' : 'left'}>
              <article
                id={service.id}
                className="scroll-mt-28 grid items-center gap-8 overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-card)] transition duration-500 hover:shadow-[var(--shadow-lift)] lg:grid-cols-2"
              >
                <div className={`group relative h-64 overflow-hidden lg:h-full ${reverse ? 'lg:order-2' : ''}`}>
                  <img
                    src={images.hero}
                    alt={`${service.name} in Accra by LINFI POLYCLEAN`}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
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
              </Reveal>
            )
          })}
        </div>
      </div>
      <CTA />
    </>
  )
}
