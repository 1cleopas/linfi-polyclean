import { images } from '../data/content'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

export default function BeforeAfter() {
  return (
    <section className="section" id="see-the-difference">
      <div className="wrap">
        <Reveal>
          <SectionHeader
            title="See the difference"
            subtitle="Illustrative look at buildup inside a tank, and a tank after a thorough clean. Every job is different."
          />
        </Reveal>
        <div className="compare-grid">
          <Reveal from="left">
            <figure className="compare-card">
              <img src={images.before} alt="Inside of a water tank with heavy sediment and dirty water before cleaning" />
              <figcaption>Before</figcaption>
            </figure>
          </Reveal>
          <Reveal from="right" delay={80}>
            <figure className="compare-card">
              <img src={images.after} alt="Inside of a water tank after a thorough clean" />
              <figcaption>After</figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
