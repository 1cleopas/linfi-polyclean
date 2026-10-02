import { company, images } from '../data/content'
import PageHero from '../components/PageHero'
import ContactForm from '../components/ContactForm'
import ContactDetails from '../components/ContactDetails'
import Seo from '../components/Seo'
import FAQ from '../components/FAQ'
import Reveal from '../components/Reveal'

export default function Contact() {
  return (
    <>
      <Seo
        title="Contact Linfi Polyclean | Book Polytank Cleaning in Accra"
        description="Call, WhatsApp or send a message to book polytank cleaning and water tank disinfection with LINFI POLYCLEAN in Accra, Ghana."
        path="/contact"
      />
      <PageHero
        title="Contact Us"
        subtitle="LINFI POLYCLEAN — Polytank Cleaning & Disinfection in Accra, Ghana."
        image={images.accra}
        imageAlt="Accra rooftops and water storage tanks"
      />

      <section className="bg-surface section-pad">
        <div className="wrap contact-grid">
          <Reveal from="left">
            <div>
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
      <FAQ />
    </>
  )
}
