import { Link } from 'react-router-dom'
import Button from '../components/Button'
import Seo from '../components/Seo'

export default function NotFound() {
  return (
    <section className="not-found anim-fade-up">
      <Seo title="Page not found | Linfi Polyclean" description="The page you requested does not exist." path="/404" />
      <p className="eyebrow">404</p>
      <h1 className="headline">This page does not exist</h1>
      <p className="lede" style={{ maxWidth: '28rem' }}>
        The link may be outdated. Head back home or book a tank cleaning from the homepage.
      </p>
      <div style={{ marginTop: '2rem' }}>
        <Button to="/">Back to Home</Button>
      </div>
      <Link to="/#contact">Contact us</Link>
    </section>
  )
}
