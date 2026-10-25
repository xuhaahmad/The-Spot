import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Info, X } from 'lucide-react'
import CafeCard from '../components/CafeCard.jsx'
import ConfirmButton from '../components/ConfirmButton.jsx'
import { usePersonal } from '../context/personal.js'
import { getCafeDataset, getPreferenceOptions } from '../data/index.js'
import { describePreferences, preferencesFromSearchParams } from '../lib/preferences.js'
import './SavedPage.css'

const dayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })

function formatWhen(iso) {
  if (!iso) return null
  const date = new Date(iso)
  return date.toDateString() === new Date().toDateString() ? 'Today' : dayFormat.format(date)
}

function RecentSearch({ entry, onRemove }) {
  const values = describePreferences(preferencesFromSearchParams(new URLSearchParams(entry.query), getPreferenceOptions()))
  const title = `${values.purpose} · ${values.moods}`
  const details = [values.budget, values.areas]
  if (values.extras !== 'No extra preferences') details.push(values.extras)
  const when = formatWhen(entry.searchedAt)

  return (
    <li className="recent">
      <Link to={`/results?${entry.query}`} className="recent__link">
        <span className="recent__title">{title}</span>
        <span className="recent__details muted">
          {details.join(' · ')}
          {when && ` · ${when}`}
        </span>
        <ArrowRight size={16} aria-hidden="true" className="recent__arrow" />
      </Link>
      <button type="button" className="icon-btn recent__remove" onClick={onRemove} aria-label={`Remove search: ${title}`}>
        <X size={15} aria-hidden="true" />
      </button>
    </li>
  )
}

export default function SavedPage() {
  const { saved, recent, storageAvailable, removedCount, clearSaved, forgetSearch, clearRecent, dismissRemovedNotice } =
    usePersonal()
  const { cafes } = getCafeDataset()
  const cafesById = useMemo(() => new Map(cafes.map((cafe) => [cafe.id, cafe])), [cafes])
  const savedCafes = saved.map((entry) => cafesById.get(entry.id)).filter(Boolean)

  // Unsaving a café here removes its card, including the button that had focus.
  // Move focus to the section heading so keyboard users don't lose their place.
  const savedHeadingRef = useRef(null)
  const previousCount = useRef(savedCafes.length)
  useEffect(() => {
    const lostFocus = document.activeElement === document.body || document.activeElement === null
    if (savedCafes.length < previousCount.current && lostFocus) savedHeadingRef.current?.focus()
    previousCount.current = savedCafes.length
  }, [savedCafes.length])

  return (
    <div className="container saved">
      <header className="saved__head">
        <p className="eyebrow">Your spots</p>
        <h1 className="serif saved__title">Saved cafés and recent searches</h1>
        <p className="muted">Kept in this browser only. There’s no account, and nothing is sent anywhere.</p>
      </header>

      {!storageAvailable && (
        <div className="notice" role="status">
          <Info size={18} aria-hidden="true" />
          <p className="notice__body">
            Your browser is blocking storage, so saved cafés and searches will be forgotten when you close or refresh
            this page. Everything else works normally.
          </p>
        </div>
      )}

      {removedCount > 0 && (
        <div className="notice" role="status">
          <Info size={18} aria-hidden="true" />
          <p className="notice__body">
            {removedCount === 1 ? 'One café you saved is' : `${removedCount} cafés you saved are`} no longer in our list,
            so {removedCount === 1 ? 'it was' : 'they were'} removed.
          </p>
          <button type="button" className="icon-btn" onClick={dismissRemovedNotice} aria-label="Dismiss notice">
            <X size={15} aria-hidden="true" />
          </button>
        </div>
      )}

      <section className="saved__section" aria-labelledby="saved-cafes-title">
        <div className="saved__section-head">
          <h2 id="saved-cafes-title" ref={savedHeadingRef} tabIndex={-1} className="saved__section-title">
            Saved cafés <span className="muted">({savedCafes.length})</span>
          </h2>
          {savedCafes.length > 0 && (
            <ConfirmButton
              label="Clear all"
              accessibleLabel="Clear all saved cafés"
              question="Remove all saved cafés?"
              confirmLabel="Yes, remove all"
              onConfirm={clearSaved}
            />
          )}
        </div>

        {savedCafes.length > 0 ? (
          <ul className="cafe-grid">
            {savedCafes.map((cafe) => (
              <li key={cafe.id}>
                <CafeCard cafe={cafe} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <h3 className="serif empty-state__title">No saved cafés yet.</h3>
            <p className="muted">Tap the heart on any café to keep it here for later.</p>
            <div className="saved__empty-actions">
              <Link to="/find" className="btn btn--primary">
                Find your spot
              </Link>
              <Link to="/explore" className="btn btn--secondary">
                Browse all cafés
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="saved__section" aria-labelledby="recent-title">
        <div className="saved__section-head">
          <h2 id="recent-title" className="saved__section-title">
            Recent searches <span className="muted">({recent.length})</span>
          </h2>
          {recent.length > 0 && (
            <ConfirmButton
              label="Clear all"
              accessibleLabel="Clear all recent searches"
              question="Clear all recent searches?"
              confirmLabel="Yes, clear"
              onConfirm={clearRecent}
            />
          )}
        </div>

        {recent.length > 0 ? (
          <ul className="recents">
            {recent.map((entry) => (
              <RecentSearch key={entry.query} entry={entry} onRemove={() => forgetSearch(entry.query)} />
            ))}
          </ul>
        ) : (
          <p className="muted saved__empty-text">
            Your last few searches will show up here so you can jump back to them.
          </p>
        )}
      </section>
    </div>
  )
}
