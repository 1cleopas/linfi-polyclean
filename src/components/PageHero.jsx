export default function PageHero({ title, subtitle, image, imageAlt }) {
  return (
    <section className="relative isolate overflow-hidden py-16 md:py-24">
      <img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/30" />
      <div className="relative mx-auto max-w-[1200px] px-4 md:px-10">
        <h1 className="font-headline max-w-3xl text-4xl font-bold tracking-tight text-white md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-base text-white/90 md:text-lg">{subtitle}</p>}
      </div>
    </section>
  )
}
