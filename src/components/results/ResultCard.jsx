import { Link } from 'react-router'
import { ArrowRight, MapPin, Wallet } from 'lucide-react'
import CafeImage from '../CafeImage.jsx'
import SaveButton from '../SaveButton.jsx'
import MatchReasons from './MatchReasons.jsx'
import MapsLinks from '../MapsLinks.jsx'
import { formatBudget } from '../../lib/cafes.js'

const LOW_COVERAGE = 0.7

export default function ResultCard({ result, rank, isTop, search }) {
  const { cafe, score, label, coverage, criteria, summary } = result
  const budget = formatBudget(cafe.estimatedBudgetPerPerson)
  const detailsUrl = `/cafe/${encodeURIComponent(cafe.id)}${search ? `?${search}` : ''}`
  const headingId = `result-${cafe.id}`

  return (
    <article className={`result-card${isTop ? ' result-card--top' : ''}`} aria-labelledby={headingId}>
      <div className="result-card__media">
        <CafeImage cafe={cafe} />
      </div>

      <div className="result-card__body">
        <div className="result-card__meta">
          <span className="result-card__rank">{isTop ? 'Top match' : `#${rank}`}</span>
          <span className={`match-badge match-badge--${label.split(' ')[0].toLowerCase()}`}>
            {label}
            <span className="match-badge__score">
              {score}
              <span className="visually-hidden"> out of 100</span>
              <span aria-hidden="true">/100</span>
            </span>
          </span>
        </div>

        {/* Visual version of the same score shown in the badge (screen readers get the number) */}
        <span className="score-meter" aria-hidden="true">
          <span className="score-meter__fill" style={{ width: `${score}%` }} />
        </span>

        <div className="result-card__title-row">
          <h3 id={headingId} className="result-card__name">
            <Link to={detailsUrl}>{cafe.name}</Link>
          </h3>
          <SaveButton cafe={cafe} />
        </div>

        <p className="result-card__facts muted">
          <span>
            <MapPin size={14} aria-hidden="true" />
            {cafe.area ?? 'Area unknown'}
          </span>
          <span>
            <Wallet size={14} aria-hidden="true" />
            {budget ? (
              `${budget} ${cafe.estimatedBudgetPerPerson.includes === 'drink' ? 'for one drink' : 'per person'} (est.)`
            ) : (
              <span className="unknown">Price unknown</span>
            )}
          </span>
        </p>

        <p className="result-card__summary">{summary}</p>

        {coverage < LOW_COVERAGE && (
          <p className="result-card__coverage">
            Limited information: some of your preferences couldn’t be checked for this café.
          </p>
        )}

        <details className="result-card__details" open={isTop}>
          <summary>Why this score</summary>
          <MatchReasons criteria={criteria} />
        </details>

        <div className="result-card__actions">
          <MapsLinks cafe={cafe} className="result-card__maps" />
          <Link to={detailsUrl} className="btn btn--ghost result-card__link">
            View details
            <span className="visually-hidden"> for {cafe.name}</span>
            <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}
