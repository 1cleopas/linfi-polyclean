import { accraAreas, company, images, mapEmbedSrc, pricingFactors, testimonials } from '../data/content'
import Hero from '../components/Hero'
import ProblemAwareness from '../components/ProblemAwareness'
import BeforeAfter from '../components/BeforeAfter'
import WorkGallery from '../components/WorkGallery'
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
      <div className="landing">
      <Hero />
      <div className="home-stack">
        <ProblemAwareness />
        <BeforeAfter />
        <ServicesGrid />
        <WorkGallery />
        <HowItWorks />
        <WhyChooseUs />

        <section className="section" id="booking">
          <Reveal>
            <div className="book-card">
              <div className="section-head is-center">
                <h2>Book Your Polytank Cleaning in Accra</h2>
                <p>Fill in the form and we will confirm your booking. You can also message us directly on WhatsApp.</p>
              </div>
              <div style={{ maxWidth: '56rem', marginInline: 'auto' }}>
                <BookingForm />
              </div>
            </div>
          </Reveal>
        </section>

        <section className="section" id="pricing">
          <Reveal>
            <div className="price-band">
              <div className="price-band-grid">
                <div>
                  <p className="eyebrow eyebrow-aqua">Pricing</p>
                  <h2 className="headline" style={{ color: '#fff' }}>
                    How Much Does Polytank Cleaning Cost?
                  </h2>
                  <p style={{ marginTop: '1rem', color: 'rgb(255 255 255 / 0.8)' }}>
                    We confirm the price when you book. Every job is different, and the final amount can depend on:
                  </p>
                  <ul className="factor-list">
                    {pricingFactors.map((item) => (
                      <li key={item}>
                        <span className="dot" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button variant="light" style={{ marginTop: '2rem' }} onClick={() => openQuote()}>
                    Book a Cleaning
                  </Button>
                </div>
                <div className="price-panel">
                  <p className="eyebrow">Tell us about your tank</p>
                  <p className="headline" style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>
                    Share size, location and access
                  </p>
                  <p className="lede">We will confirm availability and your price before the visit.</p>
                  <Button style={{ marginTop: '1.5rem' }} onClick={() => openQuote()}>
                    Book a Cleaning
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        <section className="section" id="service-area">
          <div className="wrap">
            <Reveal>
              <SectionHeader
                title="Polytank Cleaning Services Across Accra"
                subtitle="We provide polytank cleaning across Accra and surrounding areas. Coverage is subject to scheduling — confirm your location when you book."
              />
            </Reveal>
            <div className="area-grid">
              <Reveal from="left">
                <ul className="area-chips">
                  {accraAreas.map((area) => (
                    <li key={area}>{area}</li>
                  ))}
                  <li className="is-more">And surrounding areas</li>
                </ul>
                <img
                  src={images.accra}
                  alt="Residential neighborhood in Accra with typical Ghanaian houses and rooftop water storage tanks"
                  className="area-photo"
                  loading="lazy"
                />
              </Reveal>
              <Reveal from="right" delay={80}>
                <div className="map-frame">
                  <iframe
                    title="Map of Accra, Ghana — LINFI POLYCLEAN coverage area"
                    src={mapEmbedSrc}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="section" id="reviews">
          <div className="wrap">
            <SectionHeader
              title="What customers say"
              subtitle="Sample reviews for demonstration. These are placeholder comments, not verified customer reviews."
            />
            <div className="review-grid">
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

        <section className="section" id="contact">
          <div className="wrap contact-grid">
            <Reveal from="left">
              <div>
                <p className="eyebrow">Contact</p>
                <h2 className="headline">{company.name}</h2>
                <p className="lede">Polytank Cleaning &amp; Disinfection — Accra, Ghana</p>
                <ContactDetails />
              </div>
            </Reveal>
            <Reveal from="right" delay={80}>
              <ContactForm />
            </Reveal>
          </div>
        </section>
      </div>
      </div>
    </>
  )
}
