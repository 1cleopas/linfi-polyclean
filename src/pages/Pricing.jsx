import { images, pricingFactors } from '../data/content'
import PageHero from '../components/PageHero'
import SectionHeader from '../components/SectionHeader'
import Seo from '../components/Seo'
import Button from '../components/Button'
import { useQuote } from '../context/QuoteContext'
import Reveal from '../components/Reveal'

export default function Pricing() {
  const { openQuote } = useQuote()

  return (
    <>
      <Seo
        title="Polytank Cleaning Cost in Accra | Linfi Polyclean"
        description="Polytank cleaning prices in Accra depend on tank size, number of tanks, access, location and buildup. Book with Linfi Polyclean to confirm your price."
        path="/pricing"
      />
      <PageHero
        title="How Much Does Polytank Cleaning Cost?"
        subtitle="Every tank is different. Book a cleaning and we will confirm your price."
        image={images.accra}
        imageAlt="Accra residential neighborhood where Linfi Polyclean provides polytank cleaning"
      />

      <section className="bg-surface section-pad">
        <div className="wrap">
          <Reveal>
            <SectionHeader
              title="What can affect the price?"
              subtitle="Share these details when you book so we can confirm a clear amount."
            />
          </Reveal>
          <ul className="price-grid">
            {pricingFactors.map((item, i) => (
              <Reveal key={item} delay={i * 60} from="scale">
                <li className="price-card">{item}</li>
              </Reveal>
            ))}
          </ul>

          <Reveal>
            <div className="price-band" style={{ marginTop: '3rem', textAlign: 'center' }}>
              <h2 className="headline" style={{ color: '#fff' }}>
                Book a Cleaning
              </h2>
              <p style={{ maxWidth: '36rem', margin: '0.75rem auto 0', color: 'rgb(255 255 255 / 0.8)' }}>
                Share tank size, number of tanks, location in Accra and access notes. We will confirm availability and
                your price.
              </p>
              <Button variant="light" style={{ marginTop: '2rem' }} onClick={() => openQuote()}>
                Book a Cleaning
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  )
}
