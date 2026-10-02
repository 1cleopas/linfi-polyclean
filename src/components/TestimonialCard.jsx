import { Star } from 'lucide-react'

export default function TestimonialCard({ item }) {
  return (
    <blockquote className="review-card">
      <div className="stars" aria-label={`${item.rating} out of 5 stars, demonstration rating`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`icon-sm ${i < item.rating ? '' : 'star-empty'}`} fill={i < item.rating ? 'currentColor' : 'none'} aria-hidden="true" />
        ))}
      </div>
      <p>“{item.quote}”</p>
      <footer>
        <cite>
          — {item.name}, {item.location}
        </cite>
      </footer>
    </blockquote>
  )
}
