export default function SectionHeader({ eyebrow, title, subtitle, align = 'center', light = false }) {
  return (
    <div className={`section-head ${align === 'left' ? 'is-left' : 'is-center'} ${light ? 'is-light' : ''}`}>
      {eyebrow && <p className={`eyebrow ${light ? 'eyebrow-aqua' : ''}`}>{eyebrow}</p>}
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  )
}
