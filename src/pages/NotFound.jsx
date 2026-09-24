import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Seo from '../components/Seo'

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <Seo title="Page not found | Linfi Polyclean" description="The page you requested does not exist." path="/404" />
      <p className="text-sm font-bold tracking-widest text-secondary uppercase">404</p>
      <h1 className="font-headline mt-3 text-3xl font-bold text-primary">This page does not exist</h1>
      <p className="mt-3 max-w-md text-muted">The link may be outdated. Head back home or book a tank cleaning from the homepage.</p>
      <div className="mt-8">
        <Button to="/">Back to Home</Button>
      </div>
      <Link to="/#contact" className="mt-4 text-sm font-semibold text-secondary">
        Contact us
      </Link>
    </section>
  )
}
