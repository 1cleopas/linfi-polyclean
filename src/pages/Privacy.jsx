import { Link } from 'react-router-dom'
import { company, emailHref, images, phoneHref } from '../data/content'
import PageHero from '../components/PageHero'
import Seo from '../components/Seo'

const LAST_UPDATED = '17 October 2026'

const sections = [
  {
    id: 'who-we-are',
    title: 'Who we are',
    body: [
      `${company.name} provides polytank cleaning and water tank disinfection in ${company.serviceArea}. This policy explains what personal information we collect when you use www.linfipolyclean.com or book with us, how we use it, and the choices you have.`,
      'When we say "we", "us" or "our", we mean LINFI POLYCLEAN. If you have any question about this policy or your information, contact us using the details at the bottom of this page.',
    ],
  },
  {
    id: 'what-we-collect',
    title: 'What we collect',
    list: [
      'Booking details you enter on our website or our Google Form: your name, phone number, WhatsApp number, location, GPS (digital) address, the service you want, tank type and size, number of tanks, preferred week and time, when the tank was last cleaned, and any extra notes.',
      'Job records we create when we work for you: the date of the job, the price, payment status, the technician assigned, and the invoices and receipts we issue to you.',
      'Messages you send us by WhatsApp, phone or email, including anything you write in our contact form. The contact form does not save your message on our website; it prepares a WhatsApp message or email that you choose to send.',    ],
  },
  {
    id: 'how-we-use-it',
    title: 'How we use your information',
    list: [
      'To arrange, schedule and carry out the cleaning you ask for, including finding your property.',
      'To contact you about your booking by phone, WhatsApp, SMS or email.',
      'To prepare quotes, invoices and receipts, and to keep business and accounting records.',
      'To remind you when your tank is due for its next cleaning. You can ask us to stop these reminders at any time.',
      'To improve our service and keep our website secure.',
    ],
    after: 'We do not sell your personal information, and we do not use it for advertising by other companies.',
  },
  {
    id: 'who-we-share-it-with',
    title: 'Who we share it with',
    body: ['We only share your information with people and services that help us run the business:'],
    list: [
      'Our staff and technicians, who need your name, phone number and address to do the job.',
      'WhatsApp (Meta), when you choose to contact us or send us your booking on WhatsApp.',
      'Government authorities, if the law requires us to.',
    ],
    after:
      'Because our website is hosted outside Ghana, your booking information is stored and processed in the European Union. We use providers that apply strong security and data protection standards.',
  },
  {
    id: 'cookies',
    title: 'Cookies and tracking',
    body: [
      'We do not use advertising or analytics cookies, and we do not track you across other websites.',
      'The Google map on our home page and the fonts on our site are loaded from Google, which may receive your IP address and set its own cookies under the Google Privacy Policy.',
    ],
  },
  {
    id: 'how-long-we-keep-it',
    title: 'How long we keep it',
    body: [
      'We keep booking and job records for as long as you are a customer, and afterwards for as long as we need them for our business, accounting and legal obligations. You can ask us to delete your information earlier, unless we must keep it by law.',
    ],
  },
  {
    id: 'your-rights',
    title: 'Your rights',
    body: ["Under Ghana's Data Protection Act, 2012 (Act 843), you have the right to:"],
    list: [
      'Ask what personal information we hold about you and get a copy.',
      'Ask us to correct information that is wrong or incomplete.',
      'Ask us to delete your information.',
      'Object to us using your information for reminders or offers.',
    ],
    after:
      'To use any of these rights, contact us using the details below. If you are not happy with how we handle your information, you can complain to the Data Protection Commission of Ghana (dataprotection.org.gh).',
  },
  {
    id: 'children',
    title: 'Children',
    body: ['Our services are meant for adults. We do not knowingly collect information from children under 18.'],
  },
]

export default function Privacy() {
  return (
    <>
      <Seo
        title="Privacy Policy | Linfi Polyclean"
        description="How LINFI POLYCLEAN collects, uses and protects your personal information when you book polytank cleaning in Accra."
        path="/privacy"
      />
      <PageHero
        title="Privacy Policy"
        subtitle="How we handle the details you share with us."
        image={images.accra}
        imageAlt="Rooftops and water tanks in an Accra neighbourhood"
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
              {section.after && <p>{section.after}</p>}
            </section>
          ))}

          <section id="contact-us" className="legal-section">
            <h2>Contact us</h2>
            <p>For any privacy question or request, get in touch:</p>
            <ul>
              <li>
                Email: {emailHref() ? <a href={emailHref({ subject: 'Privacy request' })}>{company.email}</a> : company.email}
              </li>
              <li>
                Phone or WhatsApp: {phoneHref() ? <a href={phoneHref()}>{company.phone}</a> : company.phone}
              </li>
              <li>Location: {company.location}</li>
            </ul>
            <p>
              <Link to="/">Back to the home page</Link>
            </p>
          </section>
        </div>
      </section>
    </>
  )
}
