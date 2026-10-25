import { MapPin, Navigation } from 'lucide-react'
import { getMapsLinks } from '../lib/cafes.js'

/**
 * "Get directions" and "View on Google Maps" buttons for one café.
 * Both open Google Maps in a new tab; no API key is involved.
 * Directions only appear when a street address is recorded.
 */
export default function MapsLinks({ cafe, className = '' }) {
  const { directionsUrl, searchUrl, isAreaOnly } = getMapsLinks(cafe)
  if (!directionsUrl && !searchUrl) return null

  return (
    <div className={`maps-links ${className}`.trim()}>
      {directionsUrl && (
        <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="btn btn--primary maps-links__btn">
          <Navigation size={15} aria-hidden="true" />
          Get directions
          <span className="visually-hidden"> to {cafe.name} (opens Google Maps in a new tab)</span>
        </a>
      )}
      {searchUrl && (
        <a
          href={searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`btn ${directionsUrl ? 'btn--secondary' : 'btn--primary'} maps-links__btn`}
        >
          <MapPin size={15} aria-hidden="true" />
          {isAreaOnly ? 'Search area on Google Maps' : 'View on Google Maps'}
          <span className="visually-hidden"> for {cafe.name} (opens in a new tab)</span>
        </a>
      )}
      {isAreaOnly && <p className="maps-links__note">No exact address on file, so this searches the area.</p>}
    </div>
  )
}
