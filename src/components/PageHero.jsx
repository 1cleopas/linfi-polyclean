export default function PageHero({ title, subtitle, image, imageAlt }) {
  return (
    <section className="page-hero">
      <img src={image} alt={imageAlt} className="hero-zoom" />
      <div className="page-hero-wash" />
      <div className="page-hero-copy">
        <h1 className="anim-fade-up">{title}</h1>
        {subtitle && (
          <p className="anim-fade-up" style={{ animationDelay: '120ms' }}>
            {subtitle}
          </p>
        )}
      </div>
    </section>
  )
}
