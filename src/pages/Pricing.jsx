import { basePrices, formatCedis, images, pricingFactors } from '../data/content'
import PageHero from '../components/PageHero'
import SectionHeader from '../components/SectionHeader'
import Seo from '../components/Seo'
import Button from '../components/Button'
import PriceTable from '../components/PriceTable'
import { useQuote } from '../context/QuoteContext'

export default function Pricing() {
  const { openQuote } = useQuote()
  const lowest = formatCedis(basePrices[0].price)

  return (
    <>
      <Seo
        title="Polytank Cleaning Prices in Accra | Linfi Polyclean"
        description={`Polytank cleaning in Accra from ${lowest} per tank. See base prices by tank size, from 500L to 10,000L and above, and book with Linfi Polyclean.`}
        path="/pricing"
      />
      <PageHero
        title="Polytank Cleaning Prices"
        subtitle={`Base prices per tank, from ${lowest}. Prices may vary due to location and tank position.`}
        image={images.accra}
        imageAlt="Accra residential neighborhood where Linfi Polyclean provides polytank cleaning"
      />

      <section className="bg-surface py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-4 md:px-10">
          <SectionHeader
            eyebrow="Base prices per tank"
            title="Price list by tank size"
            subtitle="Find your tank size below. Each tank is priced separately."
          />
          <PriceTable className="mx-auto max-w-2xl" />

          <div className="mt-16">
            <SectionHeader
              title="What can affect the final price?"
              subtitle="The base price covers a standard clean. These details help us confirm your final price."
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
          </div>

          <div className="mt-12 rounded-3xl bg-primary p-8 text-center text-white md:p-12">
            <h2 className="font-headline text-2xl font-bold md:text-3xl">Book a Cleaning</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              Share tank size, number of tanks, location in Accra and access notes. We will confirm availability and your final price.
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
