import { AlertTriangle } from 'lucide-react'
import Reveal from './Reveal'

const contaminants = ['Sediment', 'Dirt', 'Sludge', 'Algae', 'Biofilm', 'Other contaminants']

export default function ProblemAwareness() {
  return (
    <section className="scroll-mt-28 px-4 md:px-10" id="about">
      <Reveal>
        <div className="mx-auto max-w-[1200px] rounded-3xl border border-outline/20 bg-white p-8 shadow-[var(--shadow-card)] md:p-12">
          <div>
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
        </div>
      </Reveal>
    </section>
  )
}
