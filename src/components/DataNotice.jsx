import { Info } from 'lucide-react'

// Explains where café details come from and lists every cited source.
export default function DataNotice({ meta, sources }) {
  const sourceList = Object.entries(sources)

  return (
    <aside className="data-notice" aria-label="About this information">
      <Info size={18} aria-hidden="true" className="data-notice__icon" />
      <div className="data-notice__body">
        <p>
          <strong>About this information.</strong> Details come from published café guides and listings
          (2019–2026) and have not been confirmed with the cafés. Prices are estimates, and anything we
          couldn't find is marked as unknown. This is not a complete list of Islamabad cafés.
        </p>
        {sourceList.length > 0 && (
          <details className="data-notice__sources">
            <summary>Sources ({sourceList.length})</summary>
            <ul>
              {sourceList.map(([id, source]) => (
                <li key={id}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-link">
                    {source.title}
                  </a>
                  <span className="muted">
                    {' '}
                    — {source.publisher}
                    {source.published ? `, ${source.published}` : ', undated'}
                  </span>
                </li>
              ))}
            </ul>
            {meta.lastChecked && <p className="muted">Sources last checked {meta.lastChecked}.</p>}
          </details>
        )}
      </div>
    </aside>
  )
}
