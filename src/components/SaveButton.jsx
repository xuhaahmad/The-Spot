import { Heart } from 'lucide-react'
import { usePersonal } from '../context/personal.js'

/**
 * Heart toggle for saving a café. `aria-pressed` tells screen readers whether
 * it is saved; the name stays "Save <café>" as recommended for toggle buttons.
 * variant="icon" for cards, "full" (with text) for the details page.
 */
export default function SaveButton({ cafe, variant = 'icon' }) {
  const { isSaved, toggleSaved } = usePersonal()
  const saved = isSaved(cafe.id)

  return (
    <button
      type="button"
      className={`save-btn save-btn--${variant}${saved ? ' is-saved' : ''}`}
      aria-pressed={saved}
      aria-label={variant === 'icon' ? `Save ${cafe.name}` : undefined}
      title={saved ? 'Saved — click to remove' : 'Save this café'}
      onClick={() => toggleSaved(cafe.id)}
    >
      <Heart size={variant === 'icon' ? 18 : 16} aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />
      {variant === 'full' && (
        <span>
          {saved ? 'Saved' : 'Save'}
          <span className="visually-hidden"> {cafe.name}</span>
        </span>
      )}
    </button>
  )
}
