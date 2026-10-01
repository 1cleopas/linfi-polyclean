import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      className={`fixed right-4 bottom-40 z-40 hidden h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-lg transition duration-300 hover:bg-primary-soft hover:scale-105 md:bottom-24 md:flex ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  )
}
