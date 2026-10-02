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
        image={images.scrub}
        imageAlt="Technicians scrubbing and rinsing a water tank"
      />

      <section className="bg-white section-pad">
        <div className="wrap about-story">
          <Reveal from="left">
            <div>
              <SectionHeader align="left" eyebrow="Our story" title={aboutStory.heading} />
              {aboutStory.body.map((para) => (
                <p key={para.slice(0, 24)} className="lede">
                  {para}
                </p>
              ))}
            </div>
          </Reveal>
          <Reveal from="right" delay={80}>
            <div className="intro-photo">
              <img src={images.team} alt="LINFI POLYCLEAN technicians working on a water tank in a compound" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-surface section-pad">
        <div className="wrap about-grid">
          <Reveal>
            <div className="about-card is-dark">
              <p className="eyebrow eyebrow-aqua">Mission</p>
              <h2 className="headline" style={{ color: '#fff' }}>
                What we work toward every day
              </h2>
              <p className="mission-copy">
                To provide professional polytank cleaning and disinfection that helps homes and businesses in Accra
                maintain cleaner, better-kept water storage tanks.
              </p>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="about-card is-light">
              <p className="eyebrow">Vision</p>
              <h2 className="headline">Where we are headed</h2>
              <p className="lede">
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
