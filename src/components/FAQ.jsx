import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { faqs } from '../data/content'
import SectionHeader from './SectionHeader'

export default function FAQ() {
  const [open, setOpen] = useState(0)

  return (
    <section className="scroll-mt-28 bg-white py-16 md:py-24" id="faqs">
      <div className="mx-auto max-w-3xl px-4 md:px-10">
        <SectionHeader
          eyebrow="FAQs"
          title="Questions people ask before they book"
          subtitle="Practical answers so you know what to expect from LINFI POLYCLEAN."
        />
        <div className="divide-y divide-outline/50 overflow-hidden rounded-2xl border border-outline/40">
          {faqs.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q}>
                <h3>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-primary hover:bg-surface"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    {item.q}
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-secondary transition ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm leading-relaxed text-muted">{item.a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
