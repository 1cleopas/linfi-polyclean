export default function SectionHeader({ eyebrow, title, subtitle, align = 'center', light = false }) {
  const alignment = align === 'left' ? 'text-left' : 'text-center mx-auto'
  return (
    <div className={`mb-10 max-w-2xl md:mb-14 ${alignment}`}>
      {eyebrow && (
        <p className={`mb-3 text-xs font-bold tracking-[0.2em] uppercase ${light ? 'text-aqua' : 'text-secondary'}`}>
          {eyebrow}
        </p>
      )}
      <h2 className={`font-headline text-[28px] leading-9 font-bold tracking-tight md:text-[32px] md:leading-10 ${light ? 'text-white' : 'text-primary'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-base leading-7 md:text-lg ${light ? 'text-white/80' : 'text-muted'}`}>{subtitle}</p>
      )}
    </div>
  )
}
