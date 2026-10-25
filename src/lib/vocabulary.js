// Human-readable labels for the tag values used in src/data/cafes.json.
// Adding a new tag value means adding it here; unknown values are ignored.

export const MOOD_LABELS = {
  cozy: 'Cozy',
  productive: 'Productive',
  social: 'Social',
  relaxed: 'Relaxed',
  energetic: 'Energetic',
}

export const PURPOSE_LABELS = {
  study: 'Studying',
  work: 'Working',
  friends: 'Catching up with friends',
  group: 'Reunions & group gatherings',
  'casual-meetup': 'Casual meetup',
  solo: 'Solo outing',
}

// How each purpose reads inside a sentence: "Strong match for ___".
export const PURPOSE_PHRASES = {
  study: 'studying',
  work: 'working',
  friends: 'catching up with friends',
  group: 'a reunion or group gathering',
  'casual-meetup': 'a casual meetup',
  solo: 'a solo outing',
}

export const ATMOSPHERE_LABELS = {
  quiet: 'Quiet',
  calm: 'Calm',
  aesthetic: 'Aesthetic',
  lively: 'Lively',
  spacious: 'Spacious',
  comfortable: 'Comfortable',
}

// outdoorSeating lives outside the facilities object in the data,
// but users think of it as a facility, so it is listed here too.
export const FACILITY_LABELS = {
  wifi: 'Wi-Fi',
  powerOutlets: 'Power outlets',
  outdoorSeating: 'Outdoor seating',
  parking: 'Parking',
  airConditioning: 'Air conditioning',
}

// How each facility reads mid-sentence ("Wi-Fi" keeps its capitals).
export const FACILITY_PHRASES = {
  wifi: 'Wi-Fi',
  powerOutlets: 'power outlets',
  outdoorSeating: 'outdoor seating',
  parking: 'parking',
  airConditioning: 'air conditioning',
}

export const CONFIDENCE_LABELS = {
  high: {
    label: 'Checked recently',
    description: 'Checked against the café’s own information in the last year.',
  },
  medium: {
    label: 'Recent source',
    description: 'At least one published source from the last year. Not confirmed with the café.',
  },
  low: {
    label: 'Older sources',
    description: 'Based on published sources more than a year old. Details may have changed.',
  },
}

export const BUDGET_OPTIONS = [
  { value: 1000, label: 'Up to Rs 1,000' },
  { value: 1500, label: 'Up to Rs 1,500' },
  { value: 2000, label: 'Up to Rs 2,000' },
]
