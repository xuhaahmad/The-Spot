import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { SlidersHorizontal } from 'lucide-react'
import ResultCard from '../components/results/ResultCard.jsx'
import { usePersonal } from '../context/personal.js'
import { getCafeDataset, getPreferenceOptions } from '../data/index.js'
import {
  STEP_IDS,
  describePreferences,
  isComplete,
  preferencesFromSearchParams,
  preferencesToSearchParams,
} from '../lib/preferences.js'
import { saveQuestionnaire } from '../lib/questionnaireSession.js'
import { DEFAULT_MIN_SCORE, WEIGHTS, recommend } from '../lib/recommend.js'
import { getRelaxSuggestions } from '../lib/suggestions.js'
import { PURPOSE_PHRASES } from '../lib/vocabulary.js'
import './ResultsPage.css'

// Below this many results we also offer ways to widen the search.
const FEW_RESULTS = 3

function plural(count, one, many) {
  return `${count} ${count === 1 ? one : many}`
}

function PreferenceChips({ prefs }) {
  const values = describePreferences(prefs)
  const chips = [values.purpose, values.moods, values.budget, values.areas]
  if (prefs.atmosphere.length || prefs.facilities.length) chips.push(values.extras)
  return (
    <ul className="pref-chips" aria-label="Your preferences">
      {chips.map((chip) => (
        <li key={chip} className="chip">
          {chip}
        </li>
      ))}
    </ul>
  )
}

function Suggestions({ suggestions }) {
  return (
    <ul className="suggestions">
      {suggestions.map((suggestion) => (
        <li key={suggestion.id}>
          <Link to={`/results?${preferencesToSearchParams(suggestion.prefs)}`} className="suggestion">
            <span className="suggestion__label">{suggestion.label}</span>
            <span className="suggestion__count muted">{plural(suggestion.resultCount, 'match', 'matches')}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function ScoringNote() {
  return (
    <details className="scoring-note">
      <summary>How matches are scored</summary>
      <div className="scoring-note__body">
        <p>
          Each café gets a score out of 100 from a simple formula. No AI is involved. Your plan and budget
          count most ({WEIGHTS.purpose} points each), then mood ({WEIGHTS.mood}), atmosphere (
          {WEIGHTS.atmosphere}), area ({WEIGHTS.location}) and facilities ({WEIGHTS.facilities}). Anything you
          skipped is left out.
        </p>
        <p>
          If we don’t know something about a café, it earns no points for it, so missing information never
          counts as a match. Cafés scoring under {DEFAULT_MIN_SCORE} aren’t shown.
        </p>
      </div>
    </details>
  )
}

export default function ResultsPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const dataset = getCafeDataset()

  const prefs = useMemo(() => preferencesFromSearchParams(params, getPreferenceOptions()), [params])
  const complete = isComplete(prefs)
  const outcome = useMemo(() => (complete ? recommend(dataset.cafes, prefs) : null), [complete, dataset.cafes, prefs])
  const suggestions = useMemo(
    () => (outcome && outcome.results.length < FEW_RESULTS ? getRelaxSuggestions(dataset.cafes, prefs) : []),
    [outcome, dataset.cafes, prefs],
  )
  const search = preferencesToSearchParams(prefs).toString()
  const { recordSearch } = usePersonal()

  // Remember this search (repeats just move to the top of the list).
  // prefs only changes when the URL does, so each search is recorded once.
  useEffect(() => {
    if (complete) recordSearch(prefs)
  }, [complete, prefs, recordSearch])

  function adjustPreferences() {
    // Reopen the questionnaire on its review step with these answers filled in.
    saveQuestionnaire(prefs, STEP_IDS.length)
    navigate('/find')
  }

  if (dataset.status === 'error') {
    return (
      <section className="container simple-page" aria-labelledby="results-title">
        <p className="eyebrow">Something went wrong</p>
        <h1 id="results-title" className="serif simple-page__title">
          We couldn’t load the café list.
        </h1>
        <p className="muted simple-page__text">{dataset.message} Please try refreshing the page.</p>
      </section>
    )
  }

  if (!complete) {
    return (
      <section className="container simple-page" aria-labelledby="results-title">
        <p className="eyebrow">Your matches</p>
        <h1 id="results-title" className="serif simple-page__title">
          We need a few answers first.
        </h1>
        <p className="muted simple-page__text">
          Tell us your plan, mood and budget, and we’ll rank the cafés for you. It takes under a minute.
        </p>
        <Link to="/find" className="btn btn--primary">
          Find your spot
        </Link>
      </section>
    )
  }

  const { results, belowThreshold } = outcome
  const hasResults = results.length > 0

  return (
    <div className="container results">
      <header className="results__head">
        <p className="eyebrow">Your matches</p>
        <h1 className="serif results__title">
          {hasResults
            ? `${plural(results.length, 'spot', 'spots')} for ${PURPOSE_PHRASES[prefs.purpose]}`
            : 'No strong matches for that combination.'}
        </h1>
        <PreferenceChips prefs={prefs} />
        <div className="results__actions">
          <button type="button" className="btn btn--secondary btn--small" onClick={adjustPreferences}>
            <SlidersHorizontal size={15} aria-hidden="true" />
            Adjust preferences
          </button>
        </div>
        <ScoringNote />
      </header>

      {hasResults ? (
        <>
          {/* Keeps the heading order h1 → h2 → h3 (café names) for screen readers */}
          <h2 className="visually-hidden">Ranked matches</h2>
          <ol className="results__list">
            {results.map((result, index) => (
              <li key={result.cafe.id}>
                <ResultCard result={result} rank={index + 1} isTop={index === 0} search={search} />
              </li>
            ))}
          </ol>

          {belowThreshold.length > 0 && (
            <p className="muted results__footnote">
              {plural(belowThreshold.length, 'other café', 'other cafés')} scored too low to recommend for this
              search.
            </p>
          )}

          {suggestions.length > 0 && (
            <section className="results__more" aria-labelledby="more-title">
              <h2 id="more-title" className="results__more-title">
                Want more options?
              </h2>
              <Suggestions suggestions={suggestions} />
            </section>
          )}
        </>
      ) : (
        <section className="empty-state results__empty" aria-labelledby="empty-title">
          <h2 id="empty-title" className="serif empty-state__title">
            {suggestions.length > 0 ? 'Try loosening one thing.' : 'Nothing fits this plan and mood yet.'}
          </h2>
          {suggestions.length > 0 ? (
            <>
              <p className="muted">
                None of the {dataset.cafes.length} cafés we know about scored {DEFAULT_MIN_SCORE} or more. These
                changes would find some:
              </p>
              <Suggestions suggestions={suggestions} />
            </>
          ) : (
            <p className="muted">
              None of the {dataset.cafes.length} cafés we know about fit this plan and mood yet. Our list is
              still small, so try a different plan or mood.
            </p>
          )}
          <button type="button" className="btn btn--secondary" onClick={adjustPreferences}>
            Change your answers
          </button>
        </section>
      )}
    </div>
  )
}
