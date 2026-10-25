import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <section className="container simple-page" aria-labelledby="simple-page-title">
      <p className="eyebrow">Page not found</p>
      <h1 id="simple-page-title" className="serif simple-page__title">
        This spot doesn't exist.
      </h1>
      <p className="muted simple-page__text">The link may be old or mistyped.</p>
      <Link to="/" className="btn btn--primary">
        Back to home
      </Link>
    </section>
  )
}
