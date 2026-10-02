import { Link, useLocation } from 'react-router-dom'
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import {
  company,
  emailHref,
  hasWhatsApp,
  navLinks,
  phoneHref,
  services,
  socialLinks,
  whatsappUrl,
} from '../data/content'
import { getHashId, scrollToHash } from '../lib/scroll'
import Logo from './Logo'

function SocialIcon({ name, className }) {
  const paths = {
    Facebook: 'M14 8h3V4h-3c-2.8 0-5 2.2-5 5v3H7v4h2v8h4v-8h3.1l.9-4H13V9c0-.6.4-1 1-1z',
    Instagram:
      'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm-5 3.2A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2zm0 1.6A2.2 2.2 0 1 0 14.2 12 2.2 2.2 0 0 0 12 9.8zM17.4 6.6a1 1 0 1 1-1 1 1 1 0 0 1 1-1z',
    TikTok:
      'M14.5 3c.4 2.4 1.8 4.2 4.2 4.6v2.4c-1.5 0-2.9-.5-4.1-1.3v6.6c0 3.4-2.7 6.1-6.1 6.1S2.4 18.7 2.4 15.3 5.1 9.2 8.5 9.2c.4 0 .8 0 1.2.1v2.6c-.4-.1-.8-.2-1.2-.2-2 0-3.6 1.6-3.6 3.6s1.6 3.6 3.6 3.6 3.6-1.6 3.6-3.6V3h2.4z',
    LinkedIn:
      'M6.5 9H3.7v11h2.8V9zM5.1 3.3A1.7 1.7 0 1 0 5.1 6.7 1.7 1.7 0 0 0 5.1 3.3zM20.3 13.2c0-3.1-1.6-4.6-3.8-4.6a3.3 3.3 0 0 0-2.9 1.5V9H10.8c0 1.6 0 11 0 11h2.8v-6.1c0-.3 0-.7.1-1 .3-.7.9-1.4 2-1.4 1.4 0 2 1.1 2 2.6V20h2.8v-6.8z',
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}

export default function Footer() {
  const location = useLocation()
  const onHashClick = (to) => {
    if (location.pathname !== '/') return
    const id = getHashId(to)
    if (id) scrollToHash(id)
  }

  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <div>
            <Logo className="logo-footer" />
          </div>
          <p className="footer-name">LINFI POLYCLEAN</p>
          <p>Clean Tank · Safe Life. Professional polytank cleaning &amp; disinfection in Accra.</p>
          {hasWhatsApp() && (
            <a className="footer-wa" href={whatsappUrl()} target="_blank" rel="noreferrer">
              <MessageCircle className="icon-sm" aria-hidden="true" />
              WhatsApp Us
            </a>
          )}
        </div>

        <div>
          <h3>Quick Links</h3>
          <ul>
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} onClick={() => onHashClick(link.to)}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Services</h3>
          <ul>
            {services.slice(0, 6).map((item) => (
              <li key={item.id}>
                <Link to={`/services#${item.id}`}>{item.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Contact Information</h3>
          <ul>
            <li className="contact-row">
              <Phone className="icon-sm" aria-hidden="true" />
              {phoneHref() ? <a href={phoneHref()}>{company.phone}</a> : <span>{company.phone}</span>}
            </li>
            <li className="contact-row">
              <MessageCircle className="icon-sm" aria-hidden="true" />
              {hasWhatsApp() ? (
                <a href={whatsappUrl()} target="_blank" rel="noreferrer">
                  {company.whatsapp}
                </a>
              ) : (
                <span>{company.whatsapp}</span>
              )}
            </li>
            <li className="contact-row">
              <Mail className="icon-sm" aria-hidden="true" />
              {emailHref() ? <a href={emailHref()}>{company.email}</a> : <span>{company.email}</span>}
            </li>
            <li className="contact-row">
              <MapPin className="icon-sm" aria-hidden="true" />
              <span>{company.serviceArea}</span>
            </li>
          </ul>
          {socialLinks.length > 0 && (
            <div className="socials">
              {socialLinks.map(({ label, href }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}>
                  <SocialIcon name={label} className="icon-sm" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="footer-copy">© {new Date().getFullYear()} LINFI POLYCLEAN. All rights reserved.</div>
    </footer>
  )
}
