import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { Menu, X } from 'lucide-react'
import ThemeToggle from './ThemeToggle.jsx'
import { usePersonal } from '../context/personal.js'
import './SiteHeader.css'

export default function SiteHeader() {
  const location = useLocation()
  const { saved } = usePersonal()

  // The menu remembers which page it was opened on, so it closes by itself
  // when the page changes (no effect needed).
  const [openOnPath, setOpenOnPath] = useState(null)
  const menuOpen = openOnPath === location.pathname
  const setMenuOpen = (open) => setOpenOnPath(open ? location.pathname : null)

  useEffect(() => {
    if (!menuOpen) return undefined
    const handleKey = (event) => {
      if (event.key === 'Escape') setOpenOnPath(null)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [menuOpen])

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="wordmark" aria-label="The Spot, home">
          <span className="wordmark__dot" aria-hidden="true" />
          <span className="serif">The Spot</span>
        </Link>

        {/* The menu button sits right before the list so keyboard focus moves into it when opened */}
        <nav aria-label="Main" className="site-nav">
          <button
            type="button"
            className="icon-btn site-header__menu-btn"
            aria-expanded={menuOpen}
            aria-controls="site-nav-list"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
          {/* Following any link closes the menu, even one to the page you're already on */}
          <ul
            id="site-nav-list"
            className={`site-nav__list${menuOpen ? ' is-open' : ''}`}
            onClick={(event) => {
              if (event.target.closest('a')) setMenuOpen(false)
            }}
          >
            <li>
              <NavLink to="/explore" className="site-nav__link">
                Explore cafés
              </NavLink>
            </li>
            <li>
              <NavLink to="/saved" className="site-nav__link">
                Saved
                {saved.length > 0 && (
                  <span className="site-nav__count">
                    <span className="visually-hidden">, </span>
                    {saved.length}
                    <span className="visually-hidden"> {saved.length === 1 ? 'café' : 'cafés'}</span>
                  </span>
                )}
              </NavLink>
            </li>
            <li>
              <Link to="/find" className="btn btn--primary btn--small site-nav__cta">
                Find your spot
              </Link>
            </li>
          </ul>
        </nav>

        <div className="site-header__actions">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
