import {
  BadgeCheck,
  CalendarClock,
  Droplets,
  HeartHandshake,
  Home,
  MapPinned,
  MessageSquare,
  Users,
} from 'lucide-react'
import { whyChoose } from '../data/content'
import Reveal from './Reveal'
import SectionHeader from './SectionHeader'

const icons = {
  users: Users,
  badge: BadgeCheck,
  droplets: Droplets,
  calendar: CalendarClock,
  home: Home,
  map: MapPinned,
  message: MessageSquare,
  heart: HeartHandshake,
}

export default function WhyChooseUs() {
  return (
    <section className="section section-pad" id="why-choose-us">
      <div className="wrap">
        <SectionHeader
          eyebrow="Why Choose LINFI POLYCLEAN?"
          title="A cleaner water-storage system"
          subtitle="We don't just clean tanks. We help you maintain a cleaner water-storage system."
        />
        <div className="why-grid">
          {whyChoose.map((item, i) => {
            const Icon = icons[item.icon] || Droplets
            return (
              <Reveal key={item.title} delay={i * 40} from="scale">
                <div className="why-card">
                  <Icon className="icon" aria-hidden="true" />
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
