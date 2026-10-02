import { steps } from '../data/content'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

export default function HowItWorks() {
  return (
    <section className="how-wrap section" id="how-it-works">
      <div className="wrap">
        <Reveal>
          <SectionHeader
            eyebrow="Simple process"
            title="How It Works"
            subtitle="Four clear steps from first message to a cleaner tank."
          />
        </Reveal>
        <div className="how-line">
          {steps.map((item, i) => (
            <Reveal key={item.step} delay={i * 80}>
              <div className="how-step">
                <div className="how-num">{item.step}</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
