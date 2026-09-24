import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import ScrollToTop from './ScrollToTop'
import FloatingActions from './FloatingActions'
import BottomNav from './BottomNav'
import { scrollToHashWhenReady } from '../lib/scroll'

export default function Layout() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    const controller = new AbortController()

    if (hash) {
      const id = decodeURIComponent(hash.replace('#', ''))
      scrollToHashWhenReady(id, { signal: controller.signal })
      return () => controller.abort()
    }

    window.scrollTo(0, 0)
    return () => controller.abort()
  }, [pathname, hash])

  return (
    <div className="flex min-h-screen flex-col pt-24">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <FloatingActions />
      <BottomNav />
      <ScrollToTop />
    </div>
  )
}
