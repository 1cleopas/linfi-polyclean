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
    <nav className="fixed bottom-0 z-50 w-full border-t border-outline/40 bg-white shadow-[0_-4px_20px_rgba(0,51,102,0.05)] md:hidden">
      <div className="flex h-16 items-center justify-around">
        <Link
          to="/#home"
          onClick={() => onHashClick('/#home')}
          className={`flex h-full w-full flex-col items-center justify-center ${homeActive ? 'text-secondary' : 'text-muted'}`}
        >
          <Home className="h-5 w-5" aria-hidden="true" />
          <span className="mt-1 text-[10px] font-semibold">Home</span>
        </Link>
        <Link
          to="/#services"
          onClick={() => onHashClick('/#services')}
          className={`flex h-full w-full flex-col items-center justify-center ${servicesActive ? 'text-secondary' : 'text-muted'}`}
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          <span className="mt-1 text-[10px] font-semibold">Services</span>
        </Link>
        <button
          type="button"
          onClick={() => openQuote()}
          className="flex h-full w-full flex-col items-center justify-center text-muted"
        >
          <CalendarDays className="h-5 w-5" aria-hidden="true" />
          <span className="mt-1 text-[10px] font-semibold">Book</span>
        </button>
      </div>
    </nav>
  )
}
