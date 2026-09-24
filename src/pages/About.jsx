import { images, aboutStory } from '../data/content'
import PageHero from '../components/PageHero'
import SectionHeader from '../components/SectionHeader'
import Reveal from '../components/Reveal'
import Seo from '../components/Seo'
import CTA from '../components/CTA'
import WhyChooseUs from '../components/WhyChooseUs'

export default function About() {
  return (
    <>
      <Seo
        title="About Us | Linfi Polyclean Accra"
        description="LINFI POLYCLEAN is an Accra-based specialist in polytank cleaning and water tank disinfection for homes, apartments and businesses."
        path="/about"
      />
      <PageHero
        title="About LINFI POLYCLEAN"
        subtitle="An Accra-based specialist in polytank cleaning and disinfection."
        image={images.about}
        imageAlt="Technicians cleaning a water storage tank at a residential compound in Accra"
      />

      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 md:px-10 lg:grid-cols-2">
          <Reveal>
            <img
              src={images.whyUs}
              alt="Linfi Polyclean crew at a Ghanaian residential compound"
              className="h-[380px] w-full rounded-3xl object-cover shadow-[var(--shadow-card)] md:h-[460px]"
              loading="lazy"
            />
          </Reveal>
          <div>
            <SectionHeader align="left" eyebrow="Our story" title={aboutStory.heading} />
            {aboutStory.body.map((para) => (
              <p key={para.slice(0, 24)} className="mt-4 text-sm leading-relaxed text-muted md:text-base">
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface py-16 md:py-24">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-4 md:px-10 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-3xl bg-primary p-8 text-white md:p-10">
              <p className="text-xs font-bold tracking-[0.2em] text-aqua uppercase">Mission</p>
              <h2 className="font-headline mt-3 text-2xl font-bold">What we work toward every day</h2>
              <p className="mt-4 text-white/85">
                To provide professional polytank cleaning and disinfection that helps homes and businesses in Accra
                maintain cleaner, better-kept water storage tanks.
              </p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="h-full rounded-3xl bg-white p-8 shadow-[var(--shadow-card)] md:p-10">
              <p className="text-xs font-bold tracking-[0.2em] text-secondary uppercase">Vision</p>
              <h2 className="font-headline mt-3 text-2xl font-bold text-primary">Where we are headed</h2>
              <p className="mt-4 text-muted">
                To be a trusted Accra name for polytank cleaning — local, reliable, and easy to book.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <WhyChooseUs />
      <CTA />
    </>
  )
}
