import { Link } from 'react-router'
import { ArrowRight, Check, MapPin, Wallet } from 'lucide-react'
import CafeImage from './CafeImage.jsx'
import MapsLinks from './MapsLinks.jsx'
import SaveButton from './SaveButton.jsx'
import { formatBudget, getFacility } from '../lib/cafes.js'
import {
  ATMOSPHERE_LABELS,
  CONFIDENCE_LABELS,
  FACILITY_LABELS,
  MOOD_LABELS,
  PURPOSE_LABELS,
} from '../lib/vocabulary.js'
import './CafeCard.css'

const MAX_TAGS = 4

function getTags(cafe) {
  return [
    ...cafe.purposes.map((value) => PURPOSE_LABELS[value]),
    ...cafe.moods.map((value) => MOOD_LABELS[value]),
    ...cafe.atmosphere.map((value) => ATMOSPHERE_LABELS[value]),
  ].slice(0, MAX_TAGS)
}

export default function CafeCard({ cafe }) {
  const tags = getTags(cafe)
  const confirmedFacilities = Object.keys(FACILITY_LABELS).filter((key) => getFacility(cafe, key) === true)
  const budget = formatBudget(cafe.estimatedBudgetPerPerson)
  const confidence = CONFIDENCE_LABELS[cafe.dataConfidence]

  return (
    <article className="cafe-card" aria-labelledby={`cafe-${cafe.id}-name`}>
      <CafeImage cafe={cafe} />

      <div className="cafe-card__body">
        <header className="cafe-card__header">
          <h3 id={`cafe-${cafe.id}-name`} className="cafe-card__name">
            <Link to={`/cafe/${encodeURIComponent(cafe.id)}`} className="cafe-card__link">
              {cafe.name}
            </Link>
          </h3>
          <div className="cafe-card__actions">
            {cafe.area && <span className="chip cafe-card__area">{cafe.area}</span>}
            <SaveButton cafe={cafe} />
          </div>
        </header>

        <dl className="cafe-card__facts">
          <div className="cafe-card__fact">
            <dt>
              <MapPin size={15} aria-hidden="true" />
              <span className="visually-hidden">Location</span>
            </dt>
            <dd>
              {cafe.address ?? (
                <>
                  {cafe.area && `${cafe.area} · `}
                  <span className="unknown">{cafe.area ? 'exact address unknown' : 'Address unknown'}</span>
                </>
              )}
            </dd>
          </div>
          <div className="cafe-card__fact">
            <dt>
              <Wallet size={15} aria-hidden="true" />
              <span className="visually-hidden">Estimated budget per person</span>
            </dt>
            <dd>
              {budget ? (
                <>
                  {budget}{' '}
                  <span className="muted">
                    {cafe.estimatedBudgetPerPerson.includes === 'drink'
                      ? 'for one drink, estimated'
                      : 'per person, estimated'}
                  </span>
                </>
              ) : (
                <span className="unknown">Price unknown</span>
              )}
            </dd>
          </div>
        </dl>

        {cafe.description && <p className="cafe-card__description muted">{cafe.description}</p>}

        {tags.length > 0 && (
          <ul className="cafe-card__tags" aria-label="Good for">
            {tags.map((tag) => (
              <li key={tag} className="chip">
                {tag}
              </li>
            ))}
          </ul>
        )}

        {confirmedFacilities.length > 0 && (
          <ul className="cafe-card__tags" aria-label="Facilities mentioned in sources">
            {confirmedFacilities.map((key) => (
              <li key={key} className="chip chip--accent">
                <Check size={13} aria-hidden="true" />
                {FACILITY_LABELS[key]}
              </li>
            ))}
          </ul>
        )}

        <MapsLinks cafe={cafe} className="cafe-card__maps" />

        <div className="cafe-card__footer">
          <p className="cafe-card__confidence" title={confidence.description}>
            <span className={`confidence-dot confidence-dot--${cafe.dataConfidence}`} aria-hidden="true" />
            {confidence.label}
            <span className="visually-hidden">: {confidence.description}</span>
          </p>
          {/* Visual cue only: the café name above is the real link and covers the card */}
          <span className="cafe-card__more" aria-hidden="true">
            Details <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </article>
  )
}
