import { Link } from 'react-router-dom'

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  light: 'btn-light',
  whatsapp: 'btn-whatsapp',
  green: 'btn-green',
  ghost: 'btn-ghost',
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
  disabled = false,
  ...props
}) {
  const classes = ['btn', variants[variant], fullWidth ? 'btn-full' : '', disabled ? 'is-disabled' : '', className]
    .filter(Boolean)
    .join(' ')

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
    <button type={type} className={classes} onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  )
}
