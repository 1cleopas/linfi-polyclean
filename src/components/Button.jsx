import { Link } from 'react-router-dom'

const variants = {
  primary:
    'bg-primary text-white hover:bg-primary-soft shadow-md hover:shadow-lg',
  secondary:
    'bg-secondary text-white hover:bg-secondary/90 shadow-md',
  outline:
    'border-2 border-primary text-primary bg-white/90 hover:bg-surface-low',
  light:
    'bg-white text-primary hover:bg-surface shadow-sm',
  whatsapp:
    'bg-whatsapp text-white hover:bg-[#1ebe5d] shadow-md',
  green:
    'bg-green text-white hover:bg-green/90 shadow-md',
  ghost:
    'text-primary hover:bg-surface-low',
}

export default function Button({
  children,
  variant = 'primary',
  to,
  href,
  onClick,
  type = 'button',
  className = '',
  fullWidth = false,
  ...props
}) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-200 min-h-12 active:scale-[0.98] ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick} {...props}>
        {children}
      </Link>
    )
  }

  if (href) {
    const external = href.startsWith('http')
    return (
      <a
        href={href}
        className={classes}
        onClick={onClick}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        {...props}
      >
        {children}
      </a>
    )
  }

  return (
    <button type={type} className={classes} onClick={onClick} {...props}>
      {children}
    </button>
  )
}
