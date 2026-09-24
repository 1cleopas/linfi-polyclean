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
import { images, whyChoose } from '../data/content'
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
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <div className="relative">
            <img
              src={images.whyUs}
              alt="Linfi Polyclean technicians cleaning a polytank at a residential compound in Accra"
              className="h-[380px] w-full rounded-3xl object-cover shadow-[var(--shadow-lift)] md:h-[520px]"
              loading="lazy"
            />
            <div className="absolute right-5 bottom-5 left-5 rounded-2xl bg-white/95 p-4 shadow-lg sm:left-auto sm:w-64">
              <p className="text-sm font-bold text-primary">Accra-based specialists</p>
              <p className="mt-1 text-xs text-muted">Local crews focused on polytank cleaning and disinfection.</p>
            </div>
          </div>
        </Reveal>
        <div>
          <SectionHeader
            align="left"
            eyebrow="Why Choose LINFI POLYCLEAN?"
            title="A cleaner water-storage system"
            subtitle="We don't just clean tanks. We help you maintain a cleaner water-storage system."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            {whyChoose.map((item, i) => {
              const Icon = icons[item.icon] || Droplets
              return (
                <Reveal key={item.title} delay={i * 40}>
                  <div className="rounded-2xl border border-outline/30 bg-white p-4 shadow-[var(--shadow-card)]">
                    <Icon className="h-5 w-5 text-secondary" aria-hidden="true" />
                    <h3 className="mt-2 text-sm font-bold text-primary">{item.title}</h3>
                    <p className="mt-1 text-sm leading-5 text-muted">{item.text}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
