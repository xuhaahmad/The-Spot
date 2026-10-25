import { Pencil } from 'lucide-react'
import { describePreferences } from '../../lib/preferences.js'
import { STEP_COPY } from './stepContent.js'

export default function ReviewSummary({ prefs, stepIds, onEdit }) {
  const values = describePreferences(prefs)
  return (
    <dl className="review">
      {stepIds.map((stepId, index) => (
        <div key={stepId} className="review__row">
          <dt className="review__label">{STEP_COPY[stepId].summaryLabel}</dt>
          <dd className="review__value">{values[stepId]}</dd>
          <dd className="review__action">
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => onEdit(index)}
              aria-label={`Edit ${STEP_COPY[stepId].summaryLabel.toLowerCase()}`}
            >
              <Pencil size={14} aria-hidden="true" />
              Edit
            </button>
          </dd>
        </div>
      ))}
    </dl>
  )
}
