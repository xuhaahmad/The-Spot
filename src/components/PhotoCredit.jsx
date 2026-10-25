// Small "Photo: Name / Unsplash" line. Links open the original photo page.
export default function PhotoCredit({ credit, className = '' }) {
  if (!credit) return null
  return (
    <p className={`photo-credit ${className}`.trim()}>
      Photo:{' '}
      {credit.url ? (
        <a href={credit.url} target="_blank" rel="noopener noreferrer">
          {credit.name}
          {credit.source && ` / ${credit.source}`}
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      ) : (
        credit.name
      )}
    </p>
  )
}
