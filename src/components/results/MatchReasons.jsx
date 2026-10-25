import { Check, CircleHelp, CircleSlash, X } from 'lucide-react'

const CRITERION_NAMES = {
  purpose: 'Plan',
  budget: 'Budget',
  mood: 'Mood',
  atmosphere: 'Atmosphere',
  location: 'Area',
  facilities: 'Facilities',
}

// Icon + text for each status, so meaning never depends on colour alone.
const STATUS = {
  match: { icon: Check, text: 'Match' },
  partial: { icon: CircleSlash, text: 'Partial match' },
  mismatch: { icon: X, text: 'Doesn’t match' },
  unknown: { icon: CircleHelp, text: 'Unknown' },
}

/** One line per criterion the user answered, explaining how the café scored on it. */
export default function MatchReasons({ criteria }) {
  const asked = criteria.filter((criterion) => criterion.status !== 'not-asked')
  return (
    <ul className="match-reasons">
      {asked.map((criterion) => {
        const { icon: Icon, text } = STATUS[criterion.status]
        return (
          <li key={criterion.id} className={`match-reason match-reason--${criterion.status}`}>
            <Icon size={15} aria-hidden="true" className="match-reason__icon" />
            <span>
              <span className="visually-hidden">{text}: </span>
              <strong>{CRITERION_NAMES[criterion.id]}.</strong> {criterion.reason}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
