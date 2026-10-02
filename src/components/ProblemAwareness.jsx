import { AlertTriangle } from 'lucide-react'
import { images } from '../data/content'
import Reveal from './Reveal'

const contaminants = ['Sediment', 'Dirt', 'Sludge', 'Algae', 'Biofilm', 'Other contaminants']

export default function ProblemAwareness() {
  return (
    <section className="section intro-section" id="about">
      <Reveal>
        <div className="intro-band">
          <div className="intro-copy">
            <p className="eyebrow">Why tanks need cleaning</p>
            <h2 className="headline">When Was the Last Time You Cleaned Your Polytank?</h2>
            <p className="lede">
              Water storage tanks can accumulate sediment, dirt, sludge, algae, biofilm and other contaminants over
              time — even when water from the tap still looks clear. Regular professional cleaning helps maintain a
              cleaner water-storage environment and keeps the tank itself in better condition.
            </p>
            <p className="lede" style={{ fontSize: '0.875rem' }}>
              Tank cleaning improves hygiene inside the vessel. It does not, on its own, make water safe to drink.
            </p>
            <ul className="chip-list">
              {contaminants.map((item) => (
                <li key={item}>
                  <AlertTriangle className="icon-sm warn-icon" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="intro-photo">
            <img
              src={images.interior}
              alt="Inside a polytank during professional cleaning in Accra"
            />
          </div>
        </div>
      </Reveal>
    </section>
  )
}
