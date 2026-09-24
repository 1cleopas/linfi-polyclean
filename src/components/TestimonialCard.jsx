import { Star } from 'lucide-react'

export default function TestimonialCard({ item }) {
  return (
    <blockquote className="flex h-full flex-col rounded-2xl border border-outline/30 bg-white p-6 shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <div className="mb-3 flex gap-0.5 text-amber-400" aria-label={`${item.rating} out of 5 stars, demonstration rating`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < item.rating ? 'fill-current' : 'text-outline'}`} aria-hidden="true" />
        ))}
      </div>
      <p className="flex-1 text-sm leading-relaxed text-ink">“{item.quote}”</p>
      <footer className="mt-5">
        <cite className="not-italic text-sm font-bold text-primary">— {item.name}, {item.location}</cite>
      </footer>
    </blockquote>
  )
}
