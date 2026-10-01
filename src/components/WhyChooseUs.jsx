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
    <section className="scroll-mt-28 px-4 py-16 md:px-10 md:py-24" id="why-choose-us">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeader
          eyebrow="Why Choose LINFI POLYCLEAN?"
          title="A cleaner water-storage system"
          subtitle="We don't just clean tanks. We help you maintain a cleaner water-storage system."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {whyChoose.map((item, i) => {
            const Icon = icons[item.icon] || Droplets
            return (
              <Reveal key={item.title} delay={i * 40} from="scale">
                <div className="h-full rounded-2xl border border-outline/30 bg-white p-4 shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:border-secondary/50 hover:shadow-[var(--shadow-lift)]">
                  <Icon className="h-5 w-5 text-secondary" aria-hidden="true" />
                  <h3 className="mt-2 text-sm font-bold text-primary">{item.title}</h3>
                  <p className="mt-1 text-sm leading-5 text-muted">{item.text}</p>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
