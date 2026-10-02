import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, MessageCircle, X } from 'lucide-react'
import { company, hasWhatsApp, navLinks, whatsappUrl } from '../data/content'
import { useQuote } from '../context/QuoteContext'
import { getHashId, scrollToHash } from '../lib/scroll'
import Button from './Button'
import Logo from './Logo'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { openQuote } = useQuote()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname, location.hash])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const isActive = (to) => {
    const hash = getHashId(to)
    if (!hash) return location.pathname === to
    if (location.pathname !== '/') return false
    if (hash === 'home') return !location.hash || location.hash === '#home'
    return location.hash === `#${hash}`
  }

  const onHashClick = (to) => {
    const id = getHashId(to)
    if (!id || location.pathname !== '/') return
    if (location.hash === `#${id}` || (!location.hash && id === 'home')) {
      scrollToHash(id)
    }
  }

  const overHero = location.pathname === '/' && !scrolled && !open

  return (
    <header className={`header ${scrolled || open ? 'is-solid' : ''} ${overHero ? 'is-over-hero' : ''}`}>
      <div className="header-bar">
        <Link to="/#home" className="brand" aria-label={`${company.name} home`}>
          <Logo className="logo-nav" />
          <span>
            <span className="brand-name">LINFI POLYCLEAN</span>
            <span className="brand-tag">Clean Tank · Safe Life</span>
          </span>
        </Link>

        <nav className="nav-desktop" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => onHashClick(link.to)}
              className={`nav-link ${isActive(link.to) ? 'is-active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          {hasWhatsApp() && (
            <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="nav-wa" aria-label="Chat on WhatsApp">
              <MessageCircle className="icon" aria-hidden="true" />
            </a>
          )}
          <Button className="nav-book" onClick={() => openQuote()}>
            Book a Tank Cleaning
          </Button>
          <button
            type="button"
            className="menu-toggle"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="icon" /> : <Menu className="icon" />}
          </button>
        </div>
      </div>

      <div id="mobile-nav" className={`mobile-nav ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <nav className="mobile-nav-inner" aria-label="Mobile">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => onHashClick(link.to)}
              className={`mobile-link ${isActive(link.to) ? 'is-active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
          <Button
            fullWidth
            onClick={() => {
              setOpen(false)
              openQuote()
            }}
          >
            Book a Tank Cleaning
          </Button>
          {hasWhatsApp() && (
            <Button href={whatsappUrl()} variant="whatsapp" fullWidth>
              <MessageCircle className="icon-sm" aria-hidden="true" />
              WhatsApp Us
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
