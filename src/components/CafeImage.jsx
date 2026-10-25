import { useState } from 'react'
import { ImageOff } from 'lucide-react'

const TONES = ['sage', 'clay', 'sand', 'stone']

// Same café always gets the same tone, so the grid looks stable between visits.
function toneFor(id) {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return TONES[hash % TONES.length]
}

/**
 * Shows the café's own verified photo when the data has one (with its credit),
 * otherwise, or if it fails to load, a designed placeholder that says plainly
 * there is no verified photo. Generic stock photos are never used here: they
 * would imply they show this café.
 */
export default function CafeImage({ cafe }) {
  const [failed, setFailed] = useState(false)
  const showPhoto = cafe.imageUrl && !failed

  if (showPhoto) {
    return (
      <div className="cafe-image cafe-image--photo">
        <img
          src={cafe.imageUrl}
          alt={`${cafe.name}${cafe.area ? `, ${cafe.area}` : ''}`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
        {cafe.imageSource && (
          <span className="cafe-image__credit">
            Photo:{' '}
            {cafe.imageSourceUrl ? (
              <a href={cafe.imageSourceUrl} target="_blank" rel="noopener noreferrer">
                {cafe.imageSource}
                <span className="visually-hidden"> (opens in a new tab)</span>
              </a>
            ) : (
              cafe.imageSource
            )}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={`cafe-image cafe-image--placeholder cafe-image--${toneFor(cafe.id)}`}>
      <span className="cafe-image__monogram serif" aria-hidden="true">
        {cafe.name.replace(/^the\s+/i, '').charAt(0)}
      </span>
      <span className="cafe-image__note">
        <ImageOff size={13} aria-hidden="true" />
        No verified photo
      </span>
    </div>
  )
}
