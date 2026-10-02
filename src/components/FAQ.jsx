import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { faqs } from '../data/content'
import SectionHeader from './SectionHeader'
import Reveal from './Reveal'

export default function FAQ() {
  const [open, setOpen] = useState(0)

  return (
    <section className="faq section" id="faqs">
      <div className="wrap" style={{ maxWidth: '48rem' }}>
        <Reveal>
          <SectionHeader
            eyebrow="FAQs"
            title="Questions people ask before they book"
            subtitle="Practical answers so you know what to expect from LINFI POLYCLEAN."
          />
        </Reveal>
        <Reveal delay={80}>
          <div className="faq-list">
            {faqs.map((item, i) => {
              const isOpen = open === i
              return (
                <div key={item.q} className="faq-item">
                  <h3>
                    <button
                      type="button"
                      className={`faq-q ${isOpen ? 'is-open' : ''}`}
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? -1 : i)}
                    >
                      {item.q}
                      <ChevronDown className="icon" aria-hidden="true" />
                    </button>
                  </h3>
                  <p className={`faq-a ${isOpen ? 'is-open' : ''}`}>{item.a}</p>
                </div>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
