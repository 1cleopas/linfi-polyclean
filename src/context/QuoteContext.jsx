import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { scrollToHashWhenReady } from '../lib/scroll'

const QuoteContext = createContext(null)

export function QuoteProvider({ children }) {
  const [defaults, setDefaults] = useState({ service: '' })
  const navigate = useNavigate()
  const location = useLocation()

  const openQuote = useCallback(
    (preset = {}) => {
      setDefaults({ service: preset.service || '' })

      if (location.pathname !== '/') {
        navigate({ pathname: '/', hash: 'booking' })
        return
      }

      if (location.hash !== '#booking') {
        navigate({ pathname: '/', hash: 'booking' }, { replace: true })
      }

      scrollToHashWhenReady('booking')
    },
    [location.hash, location.pathname, navigate],
  )

  const value = useMemo(() => ({ defaults, setDefaults, openQuote }), [defaults, openQuote])

  return <QuoteContext.Provider value={value}>{children}</QuoteContext.Provider>
}

export function useQuote() {
  const ctx = useContext(QuoteContext)
  if (!ctx) throw new Error('useQuote must be used within QuoteProvider')
  return ctx
}
