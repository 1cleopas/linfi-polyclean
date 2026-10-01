import { useEffect, useRef, useState } from 'react'

const hiddenFrom = {
  up: 'translate-y-8',
  down: '-translate-y-8',
  left: '-translate-x-8',
  right: 'translate-x-8',
  scale: 'scale-[0.96]',
}

export default function Reveal({ children, className = '', delay = 0, from = 'up' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return undefined
    }

    const show = () => setVisible(true)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show()
          observer.unobserve(el)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -24px 0px' },
    )
    observer.observe(el)

    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) show()

    const fallback = window.setTimeout(show, 900)
    return () => {
      observer.disconnect()
      window.clearTimeout(fallback)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'translate-x-0 translate-y-0 scale-100 opacity-100' : `opacity-0 ${hiddenFrom[from] || hiddenFrom.up}`
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
