import { images, pricingFactors } from '../data/content'
import PageHero from '../components/PageHero'
import SectionHeader from '../components/SectionHeader'
import Seo from '../components/Seo'
import Button from '../components/Button'
import { useQuote } from '../context/QuoteContext'

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

      <section className="bg-surface py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-4 md:px-10">
          <SectionHeader
            title="What can affect the price?"
            subtitle="Share these details when you book so we can confirm a clear amount."
          />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pricingFactors.map((item) => (
              <li
                key={item}
                className="rounded-2xl border border-outline/30 bg-white p-6 font-semibold text-primary shadow-[var(--shadow-card)]"
              >
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-12 rounded-3xl bg-primary p-8 text-center text-white md:p-12">
            <h2 className="font-headline text-2xl font-bold md:text-3xl">Book a Cleaning</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              Share tank size, number of tanks, location in Accra and access notes. We will confirm availability and your price.
            </p>
            <Button variant="light" className="mt-8" onClick={() => openQuote()}>
              Book a Cleaning
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
