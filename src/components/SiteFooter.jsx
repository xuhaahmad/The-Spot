import { Link } from 'react-router'

const FOOTER_LINKS = [
  { to: '/find', label: 'Find your spot' },
  { to: '/explore', label: 'Explore cafés' },
  { to: '/saved', label: 'Saved' },
]

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand-block">
          <Link to="/" className="serif site-footer__brand">
            The Spot
          </Link>
          <p className="serif site-footer__tagline">There's a spot for that.</p>
          <p className="muted">A café guide for Islamabad.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="site-footer__links">
            {FOOTER_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="muted site-footer__note">
          Café details can change. We mark what we couldn't verify, but it's always worth checking with the café
          before you go. No ratings, no reviews, no sponsored spots.
        </p>
      </div>
    </footer>
  )
}
