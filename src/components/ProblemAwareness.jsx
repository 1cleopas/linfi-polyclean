import { AlertTriangle } from 'lucide-react'
import { images } from '../data/content'
import Reveal from './Reveal'

const contaminants = ['Sediment', 'Dirt', 'Sludge', 'Algae', 'Biofilm', 'Other contaminants']

export default function ProblemAwareness() {
  return (
    <section className="scroll-mt-28 px-4 md:px-10" id="about">
      <Reveal>
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-10 rounded-3xl border border-outline/20 bg-white p-8 shadow-[var(--shadow-card)] md:flex-row md:p-12">
          <div className="flex-1">
            <p className="mb-3 text-xs font-bold tracking-[0.2em] text-secondary uppercase">Why tanks need cleaning</p>
            <h2 className="font-headline text-[28px] leading-9 font-bold text-primary md:text-[32px] md:leading-10">
              When Was the Last Time You Cleaned Your Polytank?
            </h2>
            <p className="mt-5 text-base leading-7 text-muted">
              Water storage tanks can accumulate sediment, dirt, sludge, algae, biofilm and other contaminants over
              time — even when water from the tap still looks clear. Regular professional cleaning helps maintain a
              cleaner water-storage environment and keeps the tank itself in better condition.
            </p>
            <p className="mt-3 text-sm leading-6 text-muted">
              Tank cleaning improves hygiene inside the vessel. It does not, on its own, make water safe to drink.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-3">
              {contaminants.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm font-medium text-ink">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="w-full flex-1">
            <div className="grid grid-cols-2 gap-3">
              <figure className="overflow-hidden rounded-2xl">
                <img
                  src={images.before}
                  alt="Dirty polytank interior with visible sediment, sludge and buildup before cleaning"
                  className="h-48 w-full object-cover md:h-64"
                />
                <figcaption className="bg-primary px-3 py-2 text-center text-xs font-semibold text-white">
                  Before
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-2xl">
                <img
                  src={images.after}
                  alt="Professionally cleaned polytank interior with hygienic walls after cleaning"
                  className="h-48 w-full object-cover md:h-64"
                />
                <figcaption className="bg-secondary px-3 py-2 text-center text-xs font-semibold text-white">
                  After
                </figcaption>
              </figure>
            </div>
            <p className="mt-3 text-xs text-muted">
              Images are representative examples where actual customer photos are not available.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
