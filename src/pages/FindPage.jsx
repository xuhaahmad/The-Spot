import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react'
import ChoiceGroup from '../components/questionnaire/ChoiceGroup.jsx'
import ReviewSummary from '../components/questionnaire/ReviewSummary.jsx'
import {
  ATMOSPHERE_OPTIONS,
  BUDGET_OPTIONS,
  MOOD_OPTIONS,
  PURPOSE_OPTIONS,
  STEP_COPY,
  areaOptionsFor,
  facilityOptionsFor,
} from '../components/questionnaire/stepContent.js'
import { getPreferenceOptions } from '../data/index.js'
import {
  MAX_MOODS,
  REQUIRED_STEPS,
  STEP_IDS,
  createPreferences,
  firstIncompleteStep,
  preferencesToSearchParams,
  sanitizePreferences,
  toggleValue,
  validateStep,
} from '../lib/preferences.js'
import { PURPOSE_LABELS } from '../lib/vocabulary.js'
import { clearQuestionnaire, readQuestionnaire, saveQuestionnaire } from '../lib/questionnaireSession.js'
import './FindPage.css'

const REVIEW_STEP = STEP_IDS.length

const SANITIZE_OPTIONS = getPreferenceOptions()
const AREA_KEYS = SANITIZE_OPTIONS.areaOptions
const FACILITY_KEYS = SANITIZE_OPTIONS.facilityOptions

// Restore an in-progress questionnaire for this tab. A ?purpose= link
// (from the homepage tiles) pre-fills the first answer.
function loadInitialState(linkedPurpose) {
  const stored = readQuestionnaire()
  const prefs = sanitizePreferences(stored?.prefs, SANITIZE_OPTIONS)
  if (linkedPurpose && Object.hasOwn(PURPOSE_LABELS, linkedPurpose)) {
    prefs.purpose = linkedPurpose
  }
  // Never resume past a required question that is still unanswered.
  const storedStep = Number.isInteger(stored?.stepIndex) ? stored.stepIndex : 0
  const stepIndex = Math.max(0, Math.min(storedStep, firstIncompleteStep(prefs), REVIEW_STEP))
  return { prefs, stepIndex: linkedPurpose ? firstIncompleteStep(prefs) : stepIndex }
}

export default function FindPage() {
  const [params, setParams] = useSearchParams()
  const [initial] = useState(() => loadInitialState(params.get('purpose')))
  const [prefs, setPrefs] = useState(initial.prefs)
  const [stepIndex, setStepIndex] = useState(initial.stepIndex)
  const [error, setError] = useState(null)
  const [returnToReview, setReturnToReview] = useState(false)
  const headingRef = useRef(null)
  const stepPanelRef = useRef(null)
  const previousStep = useRef(initial.stepIndex)

  const isReview = stepIndex === REVIEW_STEP
  const stepId = STEP_IDS[stepIndex]
  const isOptional = !isReview && !REQUIRED_STEPS.includes(stepId)

  // The purpose link has done its job; drop it so refresh doesn't reapply it.
  useEffect(() => {
    if (params.has('purpose')) setParams({}, { replace: true })
  }, [params, setParams])

  useEffect(() => {
    saveQuestionnaire(prefs, stepIndex)
  }, [prefs, stepIndex])

  // Move focus to the new question so keyboard and screen-reader users know the step changed.
  // Comparing with the previous step (not a "first render" flag) keeps this correct when
  // React runs effects twice in development.
  useEffect(() => {
    if (previousStep.current === stepIndex) return
    previousStep.current = stepIndex
    headingRef.current?.focus()
  }, [stepIndex])

  function update(patch) {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    if (error && validateStep(stepId, next) === null) setError(null)
  }

  function focusFirstChoice() {
    stepPanelRef.current?.querySelector('input:not(:disabled)')?.focus()
  }

  function goTo(index) {
    setError(null)
    setStepIndex(index)
  }

  function handleNext(event) {
    event.preventDefault()
    const message = validateStep(stepId, prefs)
    if (message) {
      setError(message)
      focusFirstChoice()
      return
    }
    if (returnToReview) {
      // Back to the summary — or to any required answer that is still missing.
      setReturnToReview(false)
      goTo(firstIncompleteStep(prefs))
    } else {
      goTo(stepIndex + 1)
    }
  }

  function handleBack() {
    setReturnToReview(false)
    goTo(stepIndex - 1)
  }

  function handleEdit(index) {
    setReturnToReview(true)
    goTo(index)
  }

  function handleStartOver() {
    clearQuestionnaire()
    setPrefs(createPreferences())
    setReturnToReview(false)
    goTo(0)
  }

  const copy = isReview ? null : STEP_COPY[stepId]
  const hintId = `step-${stepId}-hint`
  const errorId = `step-${stepId}-error`
  const describedBy = error ? `${hintId} ${errorId}` : hintId
  const stepHasAnswer =
    stepId === 'areas'
      ? prefs.areas.length > 0
      : stepId === 'extras'
        ? prefs.atmosphere.length + prefs.facilities.length > 0
        : true

  function renderChoices() {
    switch (stepId) {
      case 'purpose':
        return (
          <ChoiceGroup
            name="purpose"
            type="radio"
            options={PURPOSE_OPTIONS}
            selected={prefs.purpose}
            onChange={(value) => update({ purpose: value })}
            labelledBy="step-title"
            describedBy={describedBy}
          />
        )
      case 'moods':
        return (
          <>
            <ChoiceGroup
              name="moods"
              type="checkbox"
              options={MOOD_OPTIONS}
              selected={prefs.moods}
              max={MAX_MOODS}
              onChange={(value) => update({ moods: toggleValue(prefs.moods, value, MAX_MOODS) })}
              labelledBy="step-title"
              describedBy={describedBy}
            />
            <p className="step__counter muted" aria-live="polite">
              {prefs.moods.length} of {MAX_MOODS} selected
              {prefs.moods.length >= MAX_MOODS && ' — deselect one to change it'}
            </p>
          </>
        )
      case 'budget':
        return (
          <ChoiceGroup
            name="budget"
            type="radio"
            options={BUDGET_OPTIONS}
            selected={prefs.budget}
            onChange={(value) => update({ budget: value })}
            labelledBy="step-title"
            describedBy={describedBy}
          />
        )
      case 'areas':
        return AREA_KEYS.length > 0 ? (
          <ChoiceGroup
            name="areas"
            type="checkbox"
            options={areaOptionsFor(AREA_KEYS)}
            selected={prefs.areas}
            onChange={(value) => update({ areas: toggleValue(prefs.areas, value) })}
            labelledBy="step-title"
            describedBy={describedBy}
          />
        ) : (
          <p className="muted">No areas are available yet.</p>
        )
      case 'extras':
        return (
          <div className="step__subgroups">
            <div className="step__subgroup">
              <h3 id="extras-atmosphere" className="step__subtitle">
                Atmosphere
              </h3>
              <ChoiceGroup
                name="atmosphere"
                type="checkbox"
                options={ATMOSPHERE_OPTIONS}
                selected={prefs.atmosphere}
                onChange={(value) => update({ atmosphere: toggleValue(prefs.atmosphere, value) })}
                labelledBy="extras-atmosphere"
                describedBy={hintId}
              />
            </div>
            {FACILITY_KEYS.length > 0 && (
              <div className="step__subgroup">
                <h3 id="extras-facilities" className="step__subtitle">
                  Facilities
                </h3>
                <p id="extras-facilities-note" className="muted step__note">
                  Only facilities that our sources mention for at least one café are listed.
                </p>
                <ChoiceGroup
                  name="facilities"
                  type="checkbox"
                  options={facilityOptionsFor(FACILITY_KEYS)}
                  selected={prefs.facilities}
                  onChange={(value) => update({ facilities: toggleValue(prefs.facilities, value) })}
                  labelledBy="extras-facilities"
                  describedBy="extras-facilities-note"
                />
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="container find">
      <header className="find__head">
        <p className="eyebrow">Find your spot</p>
        <Progress stepIndex={stepIndex} />
      </header>

      {isReview ? (
        <section className="step" aria-labelledby="step-title">
          <h1 id="step-title" ref={headingRef} tabIndex={-1} className="serif step__title">
            Here’s what you’re looking for.
          </h1>
          <p className="muted step__hint">Check your answers, or edit anything before we look for matches.</p>

          <ReviewSummary prefs={prefs} stepIds={STEP_IDS} onEdit={handleEdit} />

          <div className="step__actions">
            <button type="button" className="btn btn--secondary" onClick={handleBack}>
              <ArrowLeft size={16} aria-hidden="true" />
              Back
            </button>
            <button type="button" className="btn btn--ghost" onClick={handleStartOver}>
              <RotateCcw size={15} aria-hidden="true" />
              Start over
            </button>
            <Link to={`/results?${preferencesToSearchParams(prefs)}`} className="btn btn--primary step__next">
              See my matches
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      ) : (
        <form className="step" onSubmit={handleNext} noValidate aria-labelledby="step-title">
          <h1 id="step-title" ref={headingRef} tabIndex={-1} className="serif step__title">
            {copy.title}
          </h1>
          <p id={hintId} className="muted step__hint">
            {copy.hint}
          </p>

          <div ref={stepPanelRef} className="step__choices">
            {renderChoices()}
          </div>

          {error && (
            <p id={errorId} className="step__error" role="alert">
              {error}
            </p>
          )}

          <div className="step__actions">
            {stepIndex > 0 && (
              <button type="button" className="btn btn--secondary" onClick={handleBack}>
                <ArrowLeft size={16} aria-hidden="true" />
                Back
              </button>
            )}
            <button type="submit" className="btn btn--primary step__next">
              {returnToReview ? 'Save and review' : isOptional && !stepHasAnswer ? 'Skip' : 'Next'}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function Progress({ stepIndex }) {
  const total = STEP_IDS.length
  const current = Math.min(stepIndex + 1, total)
  const isReview = stepIndex === total
  return (
    <div className="progress">
      <p className="progress__label">{isReview ? 'Review your answers' : `Question ${current} of ${total}`}</p>
      <div className="progress__track" aria-hidden="true">
        <div className="progress__fill" style={{ width: `${(isReview ? 1 : stepIndex / total) * 100}%` }} />
      </div>
    </div>
  )
}
