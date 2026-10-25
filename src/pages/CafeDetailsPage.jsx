import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, Check, CircleHelp, ExternalLink, X } from 'lucide-react'
import CafeImage from '../components/CafeImage.jsx'
import MapsLinks from '../components/MapsLinks.jsx'
import SaveButton from '../components/SaveButton.jsx'
import MatchReasons from '../components/results/MatchReasons.jsx'
import { getCafeDataset, getPreferenceOptions } from '../data/index.js'
import { buildMapsSearchUrl, formatBudget, getFacility } from '../lib/cafes.js'
import { isComplete, preferencesFromSearchParams, preferencesToSearchParams } from '../lib/preferences.js'
import { scoreCafe } from '../lib/recommend.js'
import {
  ATMOSPHERE_LABELS,
  CONFIDENCE_LABELS,
  FACILITY_LABELS,
  MOOD_LABELS,
  PURPOSE_LABELS,
} from '../lib/vocabulary.js'
import './CafeDetailsPage.css'

// Readable names for the keys used in a café's fieldSources.
const FIELD_NAMES = {
  area: 'area',
  address: 'address',
  description: 'description',
  purposes: 'purpose tags',
  moods: 'mood tags',
  atmosphere: 'atmosphere tags',
  estimatedBudgetPerPerson: 'price estimate',
  outdoorSeating: 'outdoor seating',
  'facilities.wifi': 'Wi-Fi',
  'facilities.powerOutlets': 'power outlets',
  'facilities.parking': 'parking',
  'facilities.airConditioning': 'air conditioning',
}

function Unknown({ children = 'Unknown' }) {
  return <span className="unknown">{children}</span>
}

function ExternalLinkItem({ href, children, note }) {
  return (
    <li>
      <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn--secondary btn--small">
        {children}
        <ExternalLink size={14} aria-hidden="true" />
        <span className="visually-hidden"> (opens in a new tab)</span>
      </a>
      {note && <p className="muted details-links__note">{note}</p>}
    </li>
  )
}

function FacilityRow({ cafe, facilityKey }) {
  const value = getFacility(cafe, facilityKey)
  const [Icon, text, className] =
    value === true
      ? [Check, 'Mentioned in our sources', 'facility--yes']
      : value === false
        ? [X, 'Not available, according to our sources', 'facility--no']
        : [CircleHelp, 'Not confirmed', 'facility--unknown']
  return (
    <div className={`facility ${className}`}>
      <dt>{FACILITY_LABELS[facilityKey]}</dt>
      <dd>
        <Icon size={15} aria-hidden="true" />
        {text}
      </dd>
    </div>
  )
}

function TagRow({ label, values, labels }) {
  return (
    <div className="details-row">
      <dt>{label}</dt>
      <dd>
        {values.length ? (
          <ul className="details-tags">
            {values.map((value) => (
              <li key={value} className="chip">
                {labels[value]}
              </li>
            ))}
          </ul>
        ) : (
          <Unknown>Not described in our sources</Unknown>
        )}
      </dd>
    </div>
  )
}

export default function CafeDetailsPage() {
  const { cafeId } = useParams()
  const [params] = useSearchParams()
  const dataset = getCafeDataset()
  const cafe = dataset.cafes.find((item) => item.id === cafeId)

  // When opened from a results page, the search is carried in the URL so we can explain the match.
  const prefs = useMemo(() => preferencesFromSearchParams(params, getPreferenceOptions()), [params])
  const fromSearch = isComplete(prefs)
  const match = cafe && fromSearch ? scoreCafe(cafe, prefs) : null
  const backLink = fromSearch
    ? { to: `/results?${preferencesToSearchParams(prefs)}`, label: 'Back to your matches' }
    : { to: '/explore', label: 'Back to all cafés' }

  if (!cafe) {
    return (
      <section className="container simple-page" aria-labelledby="details-title">
        <p className="eyebrow">Café not found</p>
        <h1 id="details-title" className="serif simple-page__title">
          We couldn’t find that café.
        </h1>
        <p className="muted simple-page__text">The link may be old, or the café may have been removed from our list.</p>
        <Link to="/explore" className="btn btn--primary">
          Browse all cafés
        </Link>
      </section>
    )
  }

  const budget = cafe.estimatedBudgetPerPerson
  const hasMapLink = Boolean(buildMapsSearchUrl(cafe))
  const confidence = CONFIDENCE_LABELS[cafe.dataConfidence]
  // "F-6 · Kohsar Market", but not "F-6 · F-6 Markaz"
  const showBranch = cafe.branch && !(cafe.area && cafe.branch.startsWith(cafe.area))
  const eyebrow = [cafe.area, showBranch ? cafe.branch : null].filter(Boolean).join(' · ') || 'Islamabad'

  // Invert fieldSources so each source lists what it was used for.
  const fieldsBySource = {}
  for (const [field, sourceId] of Object.entries(cafe.fieldSources)) {
    ;(fieldsBySource[sourceId] ??= []).push(FIELD_NAMES[field] ?? field)
  }
  const sources = cafe.sourceIds.map((id) => ({ id, ...dataset.sources[id] })).filter((source) => source.url)

  return (
    <article className="container details" aria-labelledby="details-title">
      <Link to={backLink.to} className="details__back text-link">
        <ArrowLeft size={15} aria-hidden="true" />
        {backLink.label}
      </Link>

      <header className="details__hero">
        <div className="details__image">
          <CafeImage cafe={cafe} />
        </div>
        <div className="details__intro">
          <p className="eyebrow">{eyebrow}</p>
          <h1 id="details-title" className="serif details__title">
            {cafe.name}
          </h1>
          {cafe.description && <p className="details__description">{cafe.description}</p>}
          <div>
            <SaveButton cafe={cafe} variant="full" />
          </div>
          <p className="details__confidence muted">
            <span className={`confidence-dot confidence-dot--${cafe.dataConfidence}`} aria-hidden="true" />
            {confidence.label}. {confidence.description}
          </p>
        </div>
      </header>

      {match && (
        <section className="details-card details-match" aria-labelledby="match-title">
          <h2 id="match-title" className="details-card__title">
            How it matches your search
          </h2>
          <p>
            <strong>
              {match.label}, {match.score}/100.
            </strong>{' '}
            {match.summary}
          </p>
          <MatchReasons criteria={match.criteria} />
        </section>
      )}

      <div className="details__grid">
        <section className="details-card" aria-labelledby="facts-title">
          <h2 id="facts-title" className="details-card__title">
            The basics
          </h2>
          <dl className="details-list">
            <div className="details-row">
              <dt>Address</dt>
              <dd>{cafe.address ?? <Unknown>Exact address unknown</Unknown>}</dd>
            </div>
            <div className="details-row">
              <dt>Area</dt>
              <dd>{cafe.area ?? <Unknown />}</dd>
            </div>
            <div className="details-row">
              <dt>Estimated budget</dt>
              <dd>
                {budget ? (
                  <>
                    {formatBudget(budget)} {budget.includes === 'drink' ? 'for one drink' : 'per person'}
                    {budget.basis && <span className="details-row__note muted">{budget.basis}</span>}
                  </>
                ) : (
                  <Unknown>Price unknown</Unknown>
                )}
              </dd>
            </div>
            <div className="details-row">
              <dt>Opening hours</dt>
              <dd>{cafe.openingHours ?? <Unknown>Not known. Check with the café before you go.</Unknown>}</dd>
            </div>
          </dl>
        </section>

        <section className="details-card" aria-labelledby="facilities-title">
          <h2 id="facilities-title" className="details-card__title">
            Facilities
          </h2>
          <dl className="details-list">
            {Object.keys(FACILITY_LABELS).map((key) => (
              <FacilityRow key={key} cafe={cafe} facilityKey={key} />
            ))}
          </dl>
        </section>

        <section className="details-card" aria-labelledby="tags-title">
          <h2 id="tags-title" className="details-card__title">
            The vibe
          </h2>
          <dl className="details-list">
            <TagRow label="Good for" values={cafe.purposes} labels={PURPOSE_LABELS} />
            <TagRow label="Mood" values={cafe.moods} labels={MOOD_LABELS} />
            <TagRow label="Atmosphere" values={cafe.atmosphere} labels={ATMOSPHERE_LABELS} />
          </dl>
          <p className="muted details-card__note">
            Tags are our reading of how published sources describe the café, not official information.
          </p>
        </section>

        <section className="details-card" aria-labelledby="links-title">
          <h2 id="links-title" className="details-card__title">
            Find it
          </h2>
          {hasMapLink ? (
            <>
              <MapsLinks cafe={cafe} />
              <p className="muted details-card__note">
                Google Maps looks the café up by its name and the address in our sources. Check the pin before you
                set off.
              </p>
            </>
          ) : (
            <p className="muted">We don’t have enough location details to link to a map.</p>
          )}
          {(cafe.website || cafe.instagram) && (
            <ul className="details-links">
              {cafe.website && <ExternalLinkItem href={cafe.website}>Website</ExternalLinkItem>}
              {cafe.instagram && <ExternalLinkItem href={cafe.instagram}>Instagram</ExternalLinkItem>}
            </ul>
          )}
          {!cafe.website && !cafe.instagram && (
            <p className="muted details-card__note">No verified website or social media account on file.</p>
          )}
        </section>
      </div>

      <section className="details-card" aria-labelledby="sources-title">
        <h2 id="sources-title" className="details-card__title">
          Where this information comes from
        </h2>
        {sources.length ? (
          <ul className="details-sources">
            {sources.map((source) => (
              <li key={source.id}>
                <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-link">
                  {source.title}
                  <span className="visually-hidden"> (opens in a new tab)</span>
                </a>
                <span className="muted">
                  {' '}
                  — {source.publisher}, {source.published ?? 'undated'}
                </span>
                {fieldsBySource[source.id] && (
                  <span className="details-sources__used muted">Used for: {fieldsBySource[source.id].join(', ')}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No sources are recorded for this café.</p>
        )}
        {cafe.notes && <p className="details-card__note muted">Note: {cafe.notes}</p>}
        {cafe.lastChecked && <p className="details-card__note muted">Sources last checked {cafe.lastChecked}.</p>}
      </section>
    </article>
  )
}
