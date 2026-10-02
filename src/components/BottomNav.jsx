import { CalendarDays, Home, Sparkles } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useQuote } from '../context/QuoteContext'
import { getHashId, scrollToHash } from '../lib/scroll'

export default function BottomNav() {
  const { openQuote } = useQuote()
  const location = useLocation()

  const homeActive = location.pathname === '/' && (!location.hash || location.hash === '#home')
  const servicesActive = location.pathname === '/services' || (location.pathname === '/' && location.hash === '#services')

  const onHashClick = (to) => {
    const id = getHashId(to)
    if (!id || location.pathname !== '/') return
    if (location.hash === `#${id}` || (!location.hash && id === 'home')) {
      scrollToHash(id)
    }
  }

  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        <Link to="/#home" onClick={() => onHashClick('/#home')} className={homeActive ? 'is-active' : ''}>
          <Home className="icon" aria-hidden="true" />
          <span>Home</span>
        </Link>
        <Link to="/#services" onClick={() => onHashClick('/#services')} className={servicesActive ? 'is-active' : ''}>
          <Sparkles className="icon" aria-hidden="true" />
          <span>Services</span>
        </Link>
        <button type="button" onClick={() => openQuote()}>
          <CalendarDays className="icon" aria-hidden="true" />
          <span>Book</span>
        </button>
      </div>
    </nav>
  )
}
