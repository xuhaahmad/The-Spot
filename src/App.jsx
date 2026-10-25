import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import SiteHeader from './components/SiteHeader.jsx'
import SiteFooter from './components/SiteFooter.jsx'
import HomePage from './pages/HomePage.jsx'
import ExplorePage from './pages/ExplorePage.jsx'
import FindPage from './pages/FindPage.jsx'
import ResultsPage from './pages/ResultsPage.jsx'
import CafeDetailsPage from './pages/CafeDetailsPage.jsx'
import SavedPage from './pages/SavedPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

// Start each new page at the top, like a normal website would.
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <ScrollToTop />
      <SiteHeader />
      <main id="main" className="app-main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/find" element={<FindPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/cafe/:cafeId" element={<CafeDetailsPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <SiteFooter />
    </div>
  )
}
