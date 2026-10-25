import { useEffect, useRef, useState } from 'react'

/**
 * A button that asks "Are you sure?" inline before running a destructive action.
 * Focus moves to "Cancel" so an accidental Enter doesn't confirm.
 */
export default function ConfirmButton({ label, accessibleLabel, question, confirmLabel, onConfirm }) {
  const [confirming, setConfirming] = useState(false)
  const cancelRef = useRef(null)
  const triggerRef = useRef(null)
  const wasConfirming = useRef(false)

  useEffect(() => {
    if (confirming) cancelRef.current?.focus()
    else if (wasConfirming.current) triggerRef.current?.focus()
    wasConfirming.current = confirming
  }, [confirming])

  if (!confirming) {
    return (
      <button
        ref={triggerRef}
        type="button"
        className="btn btn--ghost btn--small"
        aria-label={accessibleLabel}
        onClick={() => setConfirming(true)}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="confirm" role="group" aria-label={question}>
      <span className="confirm__question">{question}</span>
      <button
        type="button"
        className="btn btn--secondary btn--small"
        onClick={() => {
          // The trigger disappears with the list, so don't try to refocus it.
          wasConfirming.current = false
          onConfirm()
        }}
      >
        {confirmLabel}
      </button>
      <button ref={cancelRef} type="button" className="btn btn--ghost btn--small" onClick={() => setConfirming(false)}>
        Cancel
      </button>
    </div>
  )
}
