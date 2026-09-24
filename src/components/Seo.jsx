import { useEffect } from 'react'
import { siteUrl } from '../data/content'

export default function Seo({
  title = 'Linfi Polyclean | Professional Polytank Cleaning in Accra',
  description = 'Professional polytank cleaning and water tank disinfection services in Accra, Ghana. Linfi Polyclean provides reliable tank cleaning for homes, apartments and businesses. Book today.',
  path = '/',
}) {
  useEffect(() => {
    document.title = title
    const canonicalUrl = `${siteUrl}${path === '/' ? '/' : path}`

    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', description)

    const ogTitle = document.querySelector('meta[property="og:title"]')
    if (ogTitle) ogTitle.setAttribute('content', title)

    const ogDesc = document.querySelector('meta[property="og:description"]')
    if (ogDesc) ogDesc.setAttribute('content', description)

    const ogUrl = document.querySelector('meta[property="og:url"]')
    if (ogUrl) ogUrl.setAttribute('content', canonicalUrl)

    const canonical = document.querySelector('link[rel="canonical"]')
    if (canonical) canonical.setAttribute('href', canonicalUrl)
  }, [title, description, path])

  return null
}
