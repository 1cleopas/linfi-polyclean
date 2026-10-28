import { Link } from 'react-router-dom'
import { company, emailHref, images, payment, phoneHref } from '../data/content'
import PageHero from '../components/PageHero'
import Seo from '../components/Seo'

const LAST_UPDATED = '28 October 2026'

const sections = [
  {
    id: 'about-these-terms',
    title: 'About these terms',
    body: [
      `These terms apply when you book or use a tank cleaning service from ${company.name} in ${company.serviceArea}, whether you book on www.linfipolyclean.com, through our Google Form, by WhatsApp or by phone. By booking with us, you agree to these terms.`,
      'When we say "we", "us" or "our", we mean LINFI POLYCLEAN. "You" means the person who books the service, or the business or property they book for.',
    ],
  },
  {
    id: 'our-services',
    title: 'Our services',
    body: [
      'We clean residential and commercial water storage tanks, removing sediment, dirt, sludge, algae and biofilm, and apply disinfection procedures to improve tank hygiene. Where you book a filter change, we also replace the water filter on the same visit.',
      'Tank cleaning improves hygiene inside the tank. It does not, on its own, make water safe to drink, and we do not test or treat the water supply that fills your tank.',
    ],
  },
  {
    id: 'booking',
    title: 'Booking and scheduling',
    list: [
      'A booking is a request until we confirm the date and time with you by phone, WhatsApp, SMS or email.',
      'We do our best to keep to the week and time you prefer. We may need to move a visit because of bad weather, safety concerns, or other things outside our control. If so, we will contact you to agree a new time.',
      'Our working hours are shown on our Contact page.',
    ],
  },
  {
    id: 'your-responsibilities',
    title: 'What we need from you',
    list: [
      'Safe access to the tank, including to the roof, stand or compound where it sits, and permission to work there.',
      'An adult present at the start and end of the visit, or clear instructions agreed with us beforehand.',
      'Honest information about the tank: its type, size, age, and any cracks, leaks or past repairs you know about.',
      'Understanding that the tank must be emptied to clean it. Any water left in it may be drained, and your supply may be off for a few hours.',
      'Keeping children and pets away from the work area while we work.',
    ],
  },
  {
    id: 'prices-and-payment',
    title: 'Prices and payment',
    list: [
      'We confirm the price with you before we start. It depends on the service, the number of tanks, their size and condition, and the location.',
      `${payment.terms} We accept ${payment.method}. Please use your invoice or receipt number as the payment reference.`,
      'If we find something on the day that changes the work needed, we will explain it and agree any change in price with you before doing extra work.',
    ],
  },
  {
    id: 'cancelling',
    title: 'Cancelling or rescheduling',
    body: [
      'If you need to cancel or move your visit, please tell us as early as possible, and at least 24 hours before. There is no charge for cancelling. If our team arrives and cannot get access to the tank, we may ask you to cover reasonable transport costs before we come back.',
    ],
  },
  {
    id: 'tank-condition',
    title: 'The condition of your tank',
    body: [
      'Old, sun-damaged, brittle or already cracked tanks, and worn fittings, pipes, valves and stands, can fail during normal cleaning. We look at the tank before we start and tell you about any problem we see. If you choose to go ahead, we are not responsible for damage caused by the existing condition of the tank or its fittings, unless it was caused by our carelessness.',
    ],
  },
  {
    id: 'if-something-goes-wrong',
    title: 'If something goes wrong',
    list: [
      'Please check the work before our team leaves, and tell us about any problem within 48 hours of the visit.',
      'If our work was not done properly, we will come back and put it right at no extra cost.',
      'If we cause damage through our own carelessness, we will repair it or pay a fair amount towards fixing it.',
      'Apart from that, and as far as the law allows, our responsibility for any one job is limited to the price you paid for it. Nothing in these terms limits our responsibility where the law does not allow it, such as for injury caused by our negligence.',
    ],
  },
  {
    id: 'website',
    title: 'Our website',
    body: [
      'We try to keep the information on our website accurate and up to date, but it is general information, not a quote. The prices and details we confirm with you for your booking are the ones that apply.',
      'We may update these terms from time to time. The version on this page when you book is the one that applies to your booking. How we handle your personal information is explained in our Privacy Policy.',
    ],
  },
  {
    id: 'law',
    title: 'Law that applies',
    body: [
      'These terms are governed by the laws of Ghana. If we have a disagreement, we will first try to settle it with you directly and fairly.',
    ],
  },
]

export default function Terms() {
  return (
    <>
      <Seo
        title="Terms of Service | Linfi Polyclean"
        description="The terms that apply when you book polytank cleaning and water tank disinfection with LINFI POLYCLEAN in Accra."
        path="/terms"
      />
      <PageHero
        title="Terms of Service"
        subtitle="What you can expect from us, and what we need from you."
        image={images.tank}
        imageAlt="A clean polytank on a stand in Accra"
      />

      <section className="bg-white section-pad">
        <div className="wrap legal">
          <p className="legal-updated">Last updated: {LAST_UPDATED}</p>

          <nav className="legal-toc" aria-label="On this page">
            <p className="eyebrow">On this page</p>
            <ol>
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`}>{section.title}</a>
                </li>
              ))}
              <li>
                <a href="#contact-us">Contact us</a>
              </li>
            </ol>
          </nav>

          {sections.map((section) => (
            <section key={section.id} id={section.id} className="legal-section">
              <h2>{section.title}</h2>
              {section.body?.map((para) => (
                <p key={para.slice(0, 32)}>{para}</p>
              ))}
              {section.list && (
                <ul>
                  {section.list.map((item) => (
                    <li key={item.slice(0, 32)}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section id="contact-us" className="legal-section">
            <h2>Contact us</h2>
            <p>For any question about these terms or your booking, get in touch:</p>
            <ul>
              <li>
                Email: {emailHref() ? <a href={emailHref({ subject: 'Question about your terms' })}>{company.email}</a> : company.email}
              </li>
              <li>
                Phone or WhatsApp: {phoneHref() ? <a href={phoneHref()}>{company.phone}</a> : company.phone}
              </li>
              <li>Location: {company.location}</li>
            </ul>
            <p>
              <Link to="/privacy">Privacy Policy</Link> · <Link to="/">Back to the home page</Link>
            </p>
          </section>
        </div>
      </section>
    </>
  )
}
