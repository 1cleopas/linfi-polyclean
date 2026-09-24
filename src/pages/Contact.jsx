import { company, images } from '../data/content'
import PageHero from '../components/PageHero'
import ContactForm from '../components/ContactForm'
import ContactDetails from '../components/ContactDetails'
import Seo from '../components/Seo'
import FAQ from '../components/FAQ'

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
        image={images.hero}
        imageAlt="Technician cleaning a polytank in Accra"
      />

      <section className="bg-surface py-16 md:py-24">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-4 md:px-10 lg:grid-cols-2">
          <div>
            <h2 className="font-headline text-3xl font-bold text-primary">{company.name}</h2>
            <p className="mt-3 text-muted">Polytank Cleaning &amp; Disinfection — Accra, Ghana</p>
            <ContactDetails />
          </div>
          <ContactForm />
        </div>
      </section>
      <FAQ />
    </>
  )
}
