# How The Spot ranks cafés

The recommendation engine lives in [`src/lib/recommend.js`](../src/lib/recommend.js). It is a plain
JavaScript scoring function. There is no AI, no external API and no randomness, so the same answers
always produce the same ranking, and every score can be explained line by line.

## 1. What gets compared

| Criterion | Weight | User's answer | Café data used |
|---|---:|---|---|
| Purpose | 25 | One purpose (required) | `purposes` tags |
| Budget | 25 | A PKR range per person (required) | `estimatedBudgetPerPerson` |
| Mood | 20 | One or two moods (required) | `moods` tags |
| Atmosphere | 15 | Any number (optional) | `atmosphere` tags |
| Location | 10 | Any number of areas (optional) | `area` |
| Facilities | 5 | Any number (optional) | `facilities`, `outdoorSeating` |
| **Total** | **100** | | |

Purpose and budget carry the most weight because they decide whether a café works at all. A lively
spot that's great for a group reunion is the wrong pick for an exam-prep afternoon, however good the
mood. Facilities are weighted
lowest because they are the least reliably documented field in the current data.

## 2. Five possible outcomes per criterion

| Status | Meaning | Credit |
|---|---|---|
| **match** | The café's data agrees with the answer | 100% |
| **partial** | It agrees in part (see below) | 50–60%, or a share |
| **mismatch** | The data disagrees | 0% |
| **unknown** | The user asked, but we have no data | 0%, **still counted** |
| **not asked** | The user skipped this preference | left out entirely |

### Unknown never counts as a match

If you ask for Wi-Fi and we don't know whether a café has it, the café earns **nothing** for Wi-Fi,
but Wi-Fi's weight still counts in the total. Missing information therefore lowers a score; it never
raises it. The explanation says "not confirmed" rather than "no Wi-Fi", because unknown is not the
same as missing.

### Skipped preferences are left out

If you skip the area question, area is removed from the calculation entirely. A café is not penalised
for something you didn't ask about. "No fixed budget" works the same way.

## 3. The formula

```
score = 100 × (sum of weight × credit, over the criteria you answered)
            ÷ (sum of weights of the criteria you answered)
```

The result is always between 0 and 100 (tested). The score is rounded for display, but ranking uses
the unrounded value.

**Worked example.** You choose studying, cozy + productive, Rs 1,000–1,500, quiet, and Wi-Fi. For Shaghf:

| Criterion | Outcome | Credit | Weight × credit |
|---|---|---:|---:|
| Purpose | partial: tagged for working | 0.5 | 12.5 |
| Budget | match: Rs 600–1,250 for one drink | 1 | 25 |
| Mood | partial: cozy yes, productive no | 0.5 | 10 |
| Atmosphere | mismatch: not tagged quiet | 0 | 0 |
| Facilities | match: Wi-Fi mentioned in sources | 1 | 5 |
| Location | not asked | | |
| **Total** | | | **52.5 of 90 → 58** |

## 4. Partial credit rules

- **Related purposes, 50%:** studying ↔ working, and any two of catching up with friends, casual
  meetup, and reunions & group gatherings. The explanation says so, e.g. "Tagged for working, which
  can also suit studying" or "Tagged for catching up with friends, which can also suit a reunion or
  group gathering."
- **Related atmosphere, 50%:** quiet ↔ calm.
- **Moods and atmosphere:** credit is the share of your choices that match, so one of two moods
  earns 50%.
- **Facilities:** credit is the share of requested facilities that are confirmed.
- **Budget:**
  - The whole estimate fits under your maximum: **match**. Cheaper than your range also counts as a
    match, because spending less is never a problem.
  - The estimate starts within your budget but goes above it: **partial, 60%** ("some options fit").
  - The estimate starts above your maximum: **mismatch**. The explanation states the starting price.
  - Drink-only estimates are labelled "for one drink".

## 5. Ranking and ties

Cafés are sorted by:

1. Score, highest first
2. Data coverage, highest first. Coverage is the share of the answered criteria where we had data,
   so between two equal scores, the café we know more about comes first.
3. Café name, A–Z
4. Café id, as a final guarantee of a stable order

## 6. Labels and threshold

| Score | Label |
|---|---|
| 75–100 | Strong match |
| 50–74 | Good match |
| 25–49 | Partial match |
| 0–24 | Weak match |

Cafés scoring below **25** are not shown as recommendations. When nothing reaches 25, the engine
reports how many cafés failed on each criterion (`mismatchCounts`), so the results page can suggest
which preference to relax, for example "Most cafés are outside your chosen areas".

## 7. Explanations

Each criterion produces one plain sentence, and the summary lists only matches and partial matches.
Explanations are built only from the café's data, so they cannot mention a facility, price or tag
that isn't in the dataset. Tags are described as "tagged" because they are editorial
interpretations of published sources (see [DATA.md](DATA.md)).

Example: *"Good match for studying: tagged for working, fits your budget, matches your cozy mood and
Wi-Fi mentioned in sources."*

## 8. Known limitations

- The quality of the ranking depends entirely on the dataset, which is small and partly dated.
- No café in the current data is tagged "quiet" or "studying", so study searches rely on partial
  matches. The explanations say so instead of hiding it.
- Budget estimates are rough. A drink-only estimate can look cheaper than a full visit.
- The weights are a sensible starting point, not tuned on real user feedback.

## 9. Tests

[`src/lib/recommend.test.js`](../src/lib/recommend.test.js) covers exact matches, partial matches,
budget mismatches, missing data, no suitable cafés, identical-input consistency, score boundaries
(including 300 generated preference combinations), ranking order, tie-breaking, explanation wording,
and confirms the engine never modifies its inputs.
