import { Navigate, Route, Routes } from 'react-router-dom'
import { QuoteProvider } from './context/QuoteContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Services from './pages/Services'
import About from './pages/About'
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'
import Admin from './pages/Admin'
import Receipt from './pages/Receipt'
import Invoice from './pages/Invoice'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <QuoteProvider>
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/receipt/:id" element={<Receipt />} />
        <Route path="/admin/invoice/:id" element={<Invoice />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Navigate to="/" replace />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </QuoteProvider>
  )
}
