import { steps } from '../data/content'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

export default function HowItWorks() {
  return (
    <section className="scroll-mt-28 bg-white py-16 md:py-24" id="how-it-works">
      <div className="mx-auto max-w-[1200px] px-4 md:px-10">
        <Reveal>
        <SectionHeader
          eyebrow="Simple process"
          title="How It Works"
          subtitle="Four clear steps from first message to a cleaner tank."
        />
        </Reveal>
        <div className="how-line relative grid gap-8 md:grid-cols-4">
          {steps.map((item, i) => (
            <Reveal key={item.step} delay={i * 80}>
                <div className="relative text-center transition duration-300 hover:-translate-y-1">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary font-headline text-lg font-bold text-white shadow-md transition duration-300 hover:scale-105">
                  {item.step}
                </div>
                <h3 className="font-headline text-lg font-semibold text-primary">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
