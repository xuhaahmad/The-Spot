import { Check } from 'lucide-react'

/**
 * A group of selectable chips backed by real radio buttons or checkboxes,
 * so keyboard and screen-reader behavior comes from the browser for free.
 *
 * - type="radio": `selected` is a string or null, one choice at a time.
 * - type="checkbox": `selected` is an array; `max` limits how many.
 */
export default function ChoiceGroup({
  name,
  type,
  options,
  selected,
  onChange,
  max = Infinity,
  labelledBy,
  describedBy,
}) {
  const selectedList = type === 'radio' ? [selected].filter(Boolean) : selected
  const limitReached = type === 'checkbox' && selectedList.length >= max
  // Short one-word options fit two per row even on phones.
  const compact = options.every((option) => !option.description)

  return (
    <div
      className={`choice-group${compact ? ' choice-group--compact' : ''}`}
      role={type === 'radio' ? 'radiogroup' : 'group'}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      {options.map((option) => {
        const checked = selectedList.includes(option.value)
        const disabled = !checked && limitReached
        const id = `${name}-${option.value}`
        return (
          <label
            key={option.value}
            htmlFor={id}
            className={`choice${checked ? ' is-checked' : ''}${disabled ? ' is-disabled' : ''}`}
          >
            <input
              id={id}
              type={type}
              name={name}
              value={option.value}
              checked={checked}
              disabled={disabled}
              onChange={() => onChange(option.value)}
              className="choice__input"
            />
            <span className="choice__mark" aria-hidden="true">
              {checked && <Check size={14} strokeWidth={2.5} />}
            </span>
            <span className="choice__text">
              <span className="choice__label">{option.label}</span>
              {option.description && <span className="choice__description">{option.description}</span>}
            </span>
          </label>
        )
      })}
    </div>
  )
}
