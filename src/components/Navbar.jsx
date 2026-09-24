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

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled || open ? 'glass-nav shadow-sm border-b border-outline/40' : 'bg-surface/80 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 md:px-10">
        <Link to="/#home" className="flex min-h-11 items-center gap-2.5" aria-label={`${company.name} home`}>
          <Logo className="h-12 w-12 shrink-0 shadow-sm ring-1 ring-outline/40 sm:h-14 sm:w-14" />
          <span className="leading-tight">
            <span className="block font-headline text-sm font-bold tracking-tight text-primary sm:text-base">
              LINFI POLYCLEAN
            </span>
            <span className="hidden text-[11px] font-medium uppercase tracking-wider text-secondary sm:block">
              Clean Tank · Safe Life
            </span>
          </span>
        </Link>

        <nav className="hidden items-center xl:flex" aria-label="Primary">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => onHashClick(link.to)}
              className={`rounded-full px-3 py-2 text-[13px] font-semibold transition-colors ${
                isActive(link.to) ? 'bg-surface-low text-secondary' : 'text-ink/80 hover:bg-surface-low hover:text-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {hasWhatsApp() && (
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noreferrer"
              className="hidden h-11 w-11 items-center justify-center rounded-full bg-whatsapp text-white shadow-sm transition hover:scale-105 sm:inline-flex"
              aria-label="Chat on WhatsApp"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </a>
          )}
          <Button className="hidden px-5 text-[13px] sm:inline-flex" onClick={() => openQuote()}>
            Book a Tank Cleaning
          </Button>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-outline text-primary xl:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-nav"
        className={`overflow-hidden transition-[max-height,opacity] duration-300 xl:hidden ${
          open ? 'max-h-[640px] opacity-100' : 'pointer-events-none max-h-0 opacity-0'
        }`}
        aria-hidden={!open}
      >
        <nav className="flex flex-col gap-1 border-t border-outline/50 px-4 py-4" aria-label="Mobile">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => onHashClick(link.to)}
              className={`rounded-xl px-4 py-3 text-base font-semibold ${
                isActive(link.to) ? 'bg-surface-low text-secondary' : 'text-primary hover:bg-surface-low'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Button
            className="mt-2"
            fullWidth
            onClick={() => {
              setOpen(false)
              openQuote()
            }}
          >
            Book a Tank Cleaning
          </Button>
          {hasWhatsApp() && (
            <Button href={whatsappUrl()} variant="whatsapp" fullWidth className="mt-1">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp Us
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
