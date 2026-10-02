import { gallery } from '../data/content'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

export default function WorkGallery() {
  return (
    <section className="section" id="our-work">
      <div className="wrap">
        <Reveal>
          <SectionHeader
            title="Spaces we work in"
            subtitle="Rooftops, compounds and commercial tanks across Accra. These photos show the kind of work LINFI POLYCLEAN does."
          />
        </Reveal>
        <div className="gallery-grid">
          {gallery.map((item, i) => (
            <Reveal key={item.src} delay={i * 40} className={item.wide ? 'is-wide' : ''}>
              <figure className={`gallery-card ${item.wide ? 'is-wide' : ''}`}>
                <img src={item.src} alt={item.alt} loading="lazy" />
                <figcaption>{item.label}</figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
