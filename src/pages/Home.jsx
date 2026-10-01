import { accraAreas, company, images, mapEmbedSrc, pricingFactors, testimonials } from '../data/content'
import Hero from '../components/Hero'
import ProblemAwareness from '../components/ProblemAwareness'
import { ServicesGrid } from '../components/ServiceCard'
import WhyChooseUs from '../components/WhyChooseUs'
import HowItWorks from '../components/HowItWorks'
import TestimonialCard from '../components/TestimonialCard'
import CTA from '../components/CTA'
import FAQ from '../components/FAQ'
import Reveal from '../components/Reveal'
import Seo from '../components/Seo'
import SectionHeader from '../components/SectionHeader'
import BookingForm from '../components/BookingForm'
import ContactForm from '../components/ContactForm'
import ContactDetails from '../components/ContactDetails'
import Button from '../components/Button'
import { useQuote } from '../context/QuoteContext'

export default function Home() {
  const { openQuote } = useQuote()

  return (
    <>
      <Seo />
      <Hero />
      <div className="flex flex-col gap-20 pb-20 md:gap-24">
        <ProblemAwareness />
        <ServicesGrid />
        <HowItWorks />
        <WhyChooseUs />

        <section className="scroll-mt-28 px-4 md:px-10" id="booking">
          <Reveal>
            <div className="mx-auto max-w-[1200px] rounded-3xl border border-outline/20 bg-white p-8 shadow-[var(--shadow-card)] md:p-12">
            <div className="mb-10 text-center">
              <h2 className="font-headline text-[28px] font-bold text-primary md:text-[32px]">
                Book Your Polytank Cleaning in Accra
              </h2>
              <p className="mt-3 text-muted">
                Fill in the form and we will confirm your booking. You can also message us directly on WhatsApp.
              </p>
            </div>
            <div className="mx-auto max-w-4xl">
              <BookingForm />
            </div>
            </div>
          </Reveal>
        </section>

        <section className="px-4 md:px-10" id="pricing">
          <Reveal>
            <div className="mx-auto max-w-[1200px] rounded-3xl bg-primary p-8 text-white md:p-12">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-aqua uppercase">Pricing</p>
                <h2 className="font-headline mt-3 text-[28px] font-bold md:text-[32px]">
                  How Much Does Polytank Cleaning Cost?
                </h2>
                <p className="mt-4 text-white/80">
                  We confirm the price when you book. Every job is different, and the final amount can depend on:
                </p>
                <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {pricingFactors.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-aqua" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button variant="light" className="mt-8" onClick={() => openQuote()}>
                  Book a Cleaning
                </Button>
              </div>
              <div className="rounded-2xl bg-white p-8 text-center text-primary">
                <p className="text-sm font-semibold tracking-wide text-secondary uppercase">Tell us about your tank</p>
                <p className="font-headline mt-2 text-2xl font-bold">Share size, location and access</p>
                <p className="mt-3 text-sm text-muted">
                  We will confirm availability and your price before the visit.
                </p>
                <Button className="mt-6" onClick={() => openQuote()}>
                  Book a Cleaning
                </Button>
              </div>
            </div>
            </div>
          </Reveal>
        </section>

        <section className="px-4 md:px-10" id="service-area">
          <div className="mx-auto max-w-[1200px]">
            <Reveal>
              <SectionHeader
              title="Polytank Cleaning Services Across Accra"
              subtitle="We provide polytank cleaning across Accra and surrounding areas. Coverage is subject to scheduling — confirm your location when you book."
              />
            </Reveal>
            <div className="grid gap-8 lg:grid-cols-2">
              <Reveal from="left">
                <ul className="flex flex-wrap gap-2">
                  {accraAreas.map((area) => (
                    <li
                      key={area}
                      className="rounded-full border border-outline/40 bg-white px-4 py-2 text-sm font-medium text-primary transition duration-300 hover:-translate-y-0.5 hover:border-secondary hover:text-secondary"
                    >
                      {area}
                    </li>
                  ))}
                  <li className="rounded-full bg-secondary px-4 py-2 text-sm font-medium text-white">
                    And surrounding areas
                  </li>
                </ul>
                <img
                  src={images.accra}
                  alt="Residential neighborhood in Accra with typical Ghanaian houses and rooftop water storage tanks"
                  className="mt-6 h-56 w-full rounded-2xl object-cover"
                  loading="lazy"
                />
              </Reveal>
              <Reveal from="right" delay={80}>
                <div className="overflow-hidden rounded-2xl border border-outline/30 bg-surface-high">
                <iframe
                  title="Map of Accra, Ghana — LINFI POLYCLEAN coverage area"
                  src={mapEmbedSrc}
                  className="h-full min-h-[360px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="px-4 md:px-10" id="reviews">
          <div className="mx-auto max-w-[1200px]">
            <SectionHeader
              title="What customers say"
              subtitle="Sample reviews for demonstration. These are placeholder comments, not verified customer reviews."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {testimonials.map((item, i) => (
                <Reveal key={`${item.location}-${i}`} delay={i * 80} from="scale">
                  <TestimonialCard item={item} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <FAQ />
        <CTA />

        <section className="scroll-mt-28 px-4 md:px-10" id="contact">
          <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-2">
            <Reveal from="left">
              <div>
              <p className="text-xs font-bold tracking-[0.2em] text-secondary uppercase">Contact</p>
              <h2 className="font-headline mt-3 text-[28px] font-bold text-primary md:text-[32px]">
                {company.name}
              </h2>
              <p className="mt-2 text-muted">Polytank Cleaning &amp; Disinfection — Accra, Ghana</p>
              <ContactDetails />
              </div>
            </Reveal>
            <Reveal from="right" delay={80}>
              <ContactForm />
            </Reveal>
          </div>
        </section>
      </div>
    </>
  )
}
