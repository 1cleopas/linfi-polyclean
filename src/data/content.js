export const WHATSAPP_MESSAGE =
  'Hello Linfi Polyclean, I would like to book a polytank cleaning. Please send me more information.'

/* ------------------------------------------------------------------
   CONTACT DETAILS
   Replace the placeholder values below before publishing.
   whatsappDigits should be country code + number with no + or spaces,
   e.g. 233241234567
   ------------------------------------------------------------------ */
export const siteUrl = 'https://linfi-polyclean-live.onrender.com'

export const company = {
  name: 'LINFI POLYCLEAN',
  shortName: 'Linfi Polyclean',
  tagline: 'Clean Tank · Safe Life',
  phone: '024 191 5966',
  phoneHref: 'tel:+233241915966',
  whatsapp: '024 191 5966',
  whatsappDigits: '233241915966',
  email: 'linfipolyclean@gmail.com',
  hours: '[ADD HOURS]',
  serviceArea: 'Accra, Ghana',
  location: 'Accra, Ghana',
}

function isUnset(value) {
  return !value || /\[ADD\b|000000000|example\.com/i.test(String(value))
}

export function hasHours() {
  return !isUnset(company.hours)
}

export function hasPhone() {
  return !isUnset(company.phone) && !isUnset(company.phoneHref)
}

export function hasWhatsApp() {
  return Boolean(company.whatsappDigits) && !isUnset(company.whatsappDigits)
}

export function hasEmail() {
  return !isUnset(company.email) && String(company.email).includes('@')
}

export function phoneHref() {
  return hasPhone() ? company.phoneHref : null
}

export function emailHref() {
  return hasEmail() ? `mailto:${company.email}` : null
}

export function whatsappUrl(message = WHATSAPP_MESSAGE) {
  return `https://wa.me/${company.whatsappDigits}?text=${encodeURIComponent(message)}`
}

export function tryOpenWhatsApp(message = WHATSAPP_MESSAGE) {
  if (!hasWhatsApp()) return { opened: false, url: null }
  const url = whatsappUrl(message)
  const popup = window.open(url, '_blank', 'noopener,noreferrer')
  return { opened: Boolean(popup), url }
}

export const socialLinks = []

export const navLinks = [
  { to: '/#home', label: 'Home' },
  { to: '/about', label: 'About Us' },
  { to: '/#services', label: 'Our Services' },
  { to: '/#pricing', label: 'Pricing' },
  { to: '/#how-it-works', label: 'How It Works' },
  { to: '/#why-choose-us', label: 'Why Choose Us' },
  { to: '/#faqs', label: 'FAQs' },
  { to: '/#contact', label: 'Contact' },
]

export const trustBadges = [
  'Professional Service',
  'Thorough Cleaning',
  'Accra-Based',
  'Convenient Scheduling',
]

export const services = [
  {
    id: 'polytank-cleaning',
    icon: 'droplets',
    name: 'Polytank Cleaning & Water Tank Disinfection',
    short: 'Thorough cleaning and disinfection of residential and commercial water storage tanks.',
    description:
      'We clean residential and commercial polytanks, removing visible sediment, dirt, sludge, algae and biofilm, then apply professional disinfection procedures to improve tank hygiene. This supports a cleaner storage environment — it is not a guarantee that water is safe to drink on its own.',
    quoteValue: 'Polytank Cleaning & Water Tank Disinfection',
    image: '/images/work-interior.jpg',
  },
  {
    id: 'residential',
    icon: 'home',
    name: 'Residential, Apartment & Estate Tank Cleaning',
    short: 'Homes, apartments, compounds, estates, and properties with shared water storage systems.',
    description:
      'Polytank cleaning for homes, apartments, compounds, estates and properties with shared water storage systems across Accra. We can schedule around your day and plan sequential cleaning so disruption stays practical.',
    quoteValue: 'Residential, Apartment & Estate Tank Cleaning',
    image: '/images/work-residential.jpg',
  },
  {
    id: 'commercial',
    icon: 'building',
    name: 'Commercial Tank Cleaning',
    short: 'Cleaning services for offices, shops, hotels, restaurants, schools, and other businesses.',
    description:
      'Tank cleaning for offices, shops, hotels, restaurants, schools and other businesses, with scheduling that respects your operating hours.',
    quoteValue: 'Commercial Tank Cleaning',
    image: '/images/work-commercial.jpg',
  },
]

export const serviceOptions = services.map((s) => s.name)

export const tankTypes = [
  'Polytank / overhead tank',
  'Ground tank',
  'Underground tank',
  'Multiple tank types',
  'Not sure',
]

export const tankSizes = [
  '500L – 1,500L',
  '1,501L – 2,500L',
  '2,501L – 3,500L',
  '3,501L – 4,500L',
  '4,501L – 5,500L',
  '5,501L – 6,500L',
  '6,501L – 7,500L',
  '7,501L – 8,500L',
  '8,501L – 9,500L',
  '10,000L and above',
  'Not sure',
]

export const whyChoose = [
  {
    icon: 'users',
    title: 'Experienced cleaning team',
    text: 'A crew that focuses on polytank and water-tank cleaning, not a general house-cleaning add-on.',
  },
  {
    icon: 'badge',
    title: 'Professional approach',
    text: 'We arrive prepared, work methodically, and leave the area as neat as we found it.',
  },
  {
    icon: 'droplets',
    title: 'Thorough cleaning',
    text: 'Sediment, dirt, sludge, algae and biofilm are cleaned from the tank — not just a surface rinse.',
  },
  {
    icon: 'calendar',
    title: 'Convenient scheduling',
    text: 'Choose a preferred week that works for your home or business. We work Tuesday to Sunday.',
  },
  {
    icon: 'home',
    title: 'Residential & commercial services',
    text: 'Homes, apartments, offices, schools, hotels and other properties are all within scope.',
  },
  {
    icon: 'map',
    title: 'Accra-wide service',
    text: 'We provide polytank cleaning across Accra and surrounding areas, subject to scheduling.',
  },
  {
    icon: 'message',
    title: 'Transparent communication',
    text: 'Clear updates on timing, what to expect, and how to prepare your tank for the visit.',
  },
  {
    icon: 'heart',
    title: 'Customer-focused service',
    text: 'We treat every booking as a relationship, not a one-off job.',
  },
]

export const steps = [
  {
    step: '01',
    title: 'Contact Us',
    text: 'Call or WhatsApp LINFI POLYCLEAN to start your booking.',
  },
  {
    step: '02',
    title: 'Tell Us About Your Tank',
    text: 'Provide the tank size, location, and preferred cleaning week.',
  },
  {
    step: '03',
    title: 'We Clean Your Tank',
    text: 'Our team arrives with the appropriate equipment and carries out the cleaning.',
  },
  {
    step: '04',
    title: 'Enjoy a Cleaner Tank',
    text: 'Your tank is cleaned and left in a neat condition.',
  },
]

export const testimonials = [
  {
    quote:
      'Very professional service. They arrived on time, cleaned the tank thoroughly, and explained the process clearly.',
    name: 'Customer',
    location: 'Accra',
    rating: 5,
  },
  {
    quote:
      'I booked on WhatsApp and they fitted us in the same week. The team was polite and left the compound tidy after the clean.',
    name: 'Customer',
    location: 'East Legon',
    rating: 5,
  },
  {
    quote:
      'We used them for two tanks at our shop. Straightforward communication and a thorough job on both tanks.',
    name: 'Customer',
    location: 'Osu',
    rating: 5,
  },
  {
    quote:
      'The before-and-after difference inside the polytank was obvious. Would book again for our next scheduled clean.',
    name: 'Customer',
    location: 'Spintex',
    rating: 5,
  },
]

export const pricingFactors = [
  'Tank size',
  'Number of tanks',
  'Tank accessibility',
  'Location',
  'Level of dirt/buildup',
  'Type of service required',
]

export const accraAreas = [
  'East Legon',
  'Airport Residential',
  'Cantonments',
  'Osu',
  'Labone',
  'Spintex',
  'Adenta',
  'Madina',
  'Haatso',
  'Achimota',
  'Dansoman',
  'Kasoa',
  'Tema',
]

export const faqs = [
  {
    q: 'How often should I clean my polytank?',
    a: 'Many households in Accra schedule a professional clean every 3 to 6 months, and more often if the tank sits in full sun or has visible buildup. The right interval depends on tank size, usage and how quickly sediment collects. We can advise after looking at your tank.',
  },
  {
    q: 'How long does polytank cleaning take?',
    a: 'A typical household tank often takes a couple of hours, depending on size, access and how much buildup is inside. Larger commercial tanks and multi-tank sites take longer. We confirm a practical window when we schedule the visit.',
  },
  {
    q: 'Can you clean large commercial tanks?',
    a: 'Yes. We clean tanks for offices, shops, hotels, restaurants, schools and other businesses. Share the tank size, number of tanks and access details so we can plan the visit properly.',
  },
  {
    q: 'Do you clean tanks at homes and apartments?',
    a: 'Yes. We clean tanks at homes, apartments, compounds, estates and properties with shared water storage systems.',
  },
  {
    q: 'Do I need to empty the tank before you arrive?',
    a: 'Not usually. Tell us the tank size and current water level when you book. We will let you know if you should use some of the water first, and we agree timing so you can plan around the visit.',
  },
  {
    q: 'Do you provide disinfection services?',
    a: 'Yes. Polytank cleaning includes water tank disinfection. We clean the tank, then apply professional disinfection procedures designed to improve tank hygiene. This helps maintain a cleaner storage environment; it does not, on its own, guarantee that water is safe to drink.',
  },
  {
    q: 'How much does polytank cleaning cost?',
    a: 'Pricing depends on tank size, number of tanks, accessibility, location, the level of dirt or buildup, and the type of service required. Book a cleaning or WhatsApp us with those details and we will confirm the price — we do not publish a single flat rate because jobs vary.',
  },
  {
    q: 'Which areas in Accra do you cover?',
    a: 'We provide polytank cleaning across Accra and surrounding areas, including East Legon, Airport Residential, Cantonments, Osu, Labone, Spintex, Adenta, Madina, Haatso, Achimota, Dansoman, Kasoa, Tema and nearby communities. Coverage is subject to scheduling, so confirm your location when you book.',
  },
]

export const aboutStory = {
  heading: 'An Accra-based specialist in polytank cleaning',
  body: [
    'LINFI POLYCLEAN is a Ghanaian cleaning company focused on polytank and water-tank cleaning and disinfection in Accra. We work with households, businesses, schools, offices and properties that want their water storage tanks kept clean, hygienic and well maintained.',
    'Our work is practical and thorough: we clean sediment, dirt, sludge, algae and biofilm from tanks, apply professional disinfection procedures where requested, and leave the tank in a neat condition.',
    'We are locally based, easy to reach by call or WhatsApp, and set up for convenient scheduling — so booking a tank cleaning is straightforward.',
  ],
}

export const images = {
  hero: '/images/hero-tank-cinematic.jpg',
  accra: '/images/accra-neighborhood.jpg',
  residential: '/images/work-residential.jpg',
  commercial: '/images/work-commercial.jpg',
  interior: '/images/work-interior.jpg',
  compound: '/images/work-compound.jpg',
  detail: '/images/work-detail.jpg',
  team: '/images/technicians-compound.png',
  scrub: '/images/why-us.jpg',
  tank: '/images/polytank-hero.jpg',
  before: '/images/tank-before.png',
  after: '/images/tank-after.png',
}

export const gallery = [
  {
    src: '/images/hero-tank-cinematic.jpg',
    alt: 'Technician cleaning rooftop polytanks at golden hour in Accra',
    label: 'Rooftop cleaning',
    wide: true,
  },
  {
    src: '/images/work-residential.jpg',
    alt: 'Residential rooftop polytank being rinsed with a hose',
    label: 'Home tanks',
  },
  {
    src: '/images/work-commercial.jpg',
    alt: 'Commercial rooftop water tanks being serviced',
    label: 'Commercial tanks',
  },
  {
    src: '/images/work-interior.jpg',
    alt: 'Inside a polytank during professional cleaning',
    label: 'Inside the tank',
  },
  {
    src: '/images/work-compound.jpg',
    alt: 'Estate compound with several polytanks',
    label: 'Estates & compounds',
  },
  {
    src: '/images/technicians-compound.png',
    alt: 'Two technicians preparing a black water tank in a compound',
    label: 'On-site team',
  },
  {
    src: '/images/why-us.jpg',
    alt: 'Technicians scrubbing and rinsing a water tank',
    label: 'Thorough cleaning',
  },
  {
    src: '/images/work-detail.jpg',
    alt: 'Close detail of a freshly rinsed tank lid and hose',
    label: 'The finish',
  },
  {
    src: '/images/accra-neighborhood.jpg',
    alt: 'Accra residential rooftops with water storage tanks',
    label: 'Across Accra',
    wide: true,
  },
]

export const mapEmbedSrc =
  'https://maps.google.com/maps?q=Accra%2C%20Ghana&t=&z=11&ie=UTF8&iwloc=&output=embed'
