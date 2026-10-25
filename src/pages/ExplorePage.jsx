import { useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { Search, X } from 'lucide-react'
import CafeCard from '../components/CafeCard.jsx'
import DataNotice from '../components/DataNotice.jsx'
import { getCafeDataset } from '../data/index.js'
import { filterCafes, getAreaOptions, getFilterableFacilities } from '../lib/cafes.js'
import { BUDGET_OPTIONS, FACILITY_LABELS } from '../lib/vocabulary.js'
import './ExplorePage.css'

// Filters live in the URL (?q=&area=&budget=&has=) so refresh and back/forward keep them.
// Values that don't match a real option are ignored rather than breaking the page.
function readFilters(params, areaOptions, facilityOptions) {
  const area = params.get('area') ?? ''
  const budget = Number(params.get('budget'))
  const facilities = (params.get('has') ?? '').split(',').filter((key) => facilityOptions.includes(key))
  return {
    query: params.get('q') ?? '',
    area: areaOptions.includes(area) ? area : '',
    maxBudget: BUDGET_OPTIONS.some((option) => option.value === budget) ? budget : null,
    facilities,
  }
}

function pluralCafes(count) {
  return `${count} ${count === 1 ? 'café' : 'cafés'}`
}

export default function ExplorePage() {
  const dataset = getCafeDataset()
  const [params, setParams] = useSearchParams()

  const areaOptions = useMemo(() => getAreaOptions(dataset.cafes), [dataset.cafes])
  const facilityOptions = useMemo(() => getFilterableFacilities(dataset.cafes), [dataset.cafes])
  const filters = readFilters(params, areaOptions, facilityOptions)
  const { results, hiddenUnknownBudget, hiddenUnknownFacility } = filterCafes(dataset.cafes, filters)

  const hasActiveFilters =
    filters.query.trim() !== '' || filters.area !== '' || filters.maxBudget !== null || filters.facilities.length > 0

  function updateParam(key, value) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value === '' || value == null) next.delete(key)
        else next.set(key, value)
        return next
      },
      // Typing in the search box shouldn't add a history entry per keystroke.
      { replace: key === 'q' },
    )
  }

  function toggleFacility(key) {
    const next = filters.facilities.includes(key)
      ? filters.facilities.filter((item) => item !== key)
      : [...filters.facilities, key]
    updateParam('has', next.join(','))
  }

  function clearFilters() {
    setParams(new URLSearchParams())
  }

  if (dataset.status === 'error') {
    return (
      <section className="container simple-page" aria-labelledby="explore-title">
        <p className="eyebrow">Something went wrong</p>
        <h1 id="explore-title" className="serif simple-page__title">
          We couldn't load the café list.
        </h1>
        <p className="muted simple-page__text">{dataset.message} Please try refreshing the page.</p>
      </section>
    )
  }

  return (
    <div className="container explore">
      <header className="explore__head">
        <p className="eyebrow">Islamabad</p>
        <h1 className="serif explore__title">Explore cafés</h1>
        <p className="muted explore__lede">
          Browse every café in The Spot, or narrow it down by name, area, budget and listed facilities.
        </p>
      </header>

      <DataNotice meta={dataset.meta} sources={dataset.sources} />

      <section className="filters" aria-label="Search and filters">
        <div className="field filters__search">
          <label htmlFor="cafe-search" className="label">
            Search by name or area
          </label>
          <div className="search-input">
            <Search size={16} aria-hidden="true" className="search-input__icon" />
            <input
              id="cafe-search"
              type="search"
              className="input search-input__field"
              placeholder="e.g. Kohsar, F-7, Shaghf"
              value={filters.query}
              onChange={(event) => updateParam('q', event.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="area-filter" className="label">
            Area
          </label>
          <select
            id="area-filter"
            className="input select"
            value={filters.area}
            onChange={(event) => updateParam('area', event.target.value)}
          >
            <option value="">All areas</option>
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="budget-filter" className="label">
            Budget per person
          </label>
          <select
            id="budget-filter"
            className="input select"
            value={filters.maxBudget ?? ''}
            onChange={(event) => updateParam('budget', event.target.value)}
          >
            <option value="">Any budget</option>
            {BUDGET_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {facilityOptions.length > 0 && (
          <fieldset className="filters__facilities">
            <legend className="label">Listed facilities</legend>
            <div className="filters__chips">
              {facilityOptions.map((key) => {
                const active = filters.facilities.includes(key)
                return (
                  <button
                    key={key}
                    type="button"
                    className={`toggle-chip${active ? ' is-active' : ''}`}
                    aria-pressed={active}
                    onClick={() => toggleFacility(key)}
                  >
                    {FACILITY_LABELS[key]}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}
      </section>

      <div className="explore__status">
        <p aria-live="polite" className="explore__count">
          {hasActiveFilters
            ? `Showing ${results.length} of ${pluralCafes(dataset.cafes.length)}`
            : pluralCafes(dataset.cafes.length)}
        </p>
        {hasActiveFilters && (
          <button type="button" className="btn btn--ghost btn--small" onClick={clearFilters}>
            <X size={14} aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>

      {(hiddenUnknownBudget > 0 || hiddenUnknownFacility > 0) && (
        <ul className="explore__hidden-notes muted">
          {hiddenUnknownBudget > 0 && (
            <li>
              {pluralCafes(hiddenUnknownBudget)} with an unknown price {hiddenUnknownBudget === 1 ? 'is' : 'are'}{' '}
              not shown, because we can't tell if {hiddenUnknownBudget === 1 ? 'it fits' : 'they fit'} your
              budget.
            </li>
          )}
          {hiddenUnknownFacility > 0 && (
            <li>
              {pluralCafes(hiddenUnknownFacility)} with unknown facilities{' '}
              {hiddenUnknownFacility === 1 ? 'is' : 'are'} not shown.
            </li>
          )}
        </ul>
      )}

      {results.length > 0 ? (
        <>
          {/* Keeps the heading order h1 → h2 → h3 (card titles) for screen readers */}
          <h2 className="visually-hidden">Café list</h2>
          <ul className="cafe-grid">
            {results.map((cafe) => (
              <li key={cafe.id}>
                <CafeCard cafe={cafe} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="empty-state">
          <h2 className="serif empty-state__title">No cafés match that yet.</h2>
          <p className="muted">
            {dataset.cafes.length === 0
              ? 'There are no cafés in the list right now.'
              : 'Try a different search, a wider budget, or fewer filters.'}
          </p>
          {hasActiveFilters && (
            <button type="button" className="btn btn--secondary" onClick={clearFilters}>
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
