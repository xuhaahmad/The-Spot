# Testing The Spot

## Automated checks

| Command | What it checks |
|---|---|
| `npm test` | Unit tests: theme logic, data validation, search and filters, preferences, the recommendation engine, URL handling, saved cafés and recent searches, colour contrast |
| `npm run lint` | ESLint, including React's hook rules |
| `npm run build` | Production build |

Run all three before every commit.

### Colour contrast

[`src/styles/contrast.test.js`](../src/styles/contrast.test.js) reads `tokens.css` and checks WCAG 2.2
AA contrast for every important colour pair in both themes: 4.5:1 for text, and 3:1 for focus rings,
form-field borders and meaningful icons. It also checks that the no-JavaScript dark fallback matches
the dark theme exactly. If you change a colour and this test fails, adjust the colour rather than the
test.

## Regression checklist

Run this in a browser after significant changes. Check both themes, at phone (375px), tablet (768px)
and desktop (1280px) widths.

### Theme and layout (Phase 1)
- [ ] First visit follows the system light or dark setting
- [ ] Theme toggle switches every surface, and the choice survives a refresh
- [ ] No horizontal scrolling at any width
- [ ] Mobile menu opens, closes with Escape, and closes when any link is followed (including the current page)
- [ ] Skip link appears on the first Tab and jumps to the main content
- [ ] Every interactive element shows a visible focus ring

### Homepage design, photos and motion
- [ ] Hero photo, the five plan tiles, the "Honest by design" photo and the latte-art tile all load
- [ ] Text over photos stays readable in both themes (also covered by `contrast.test.js`)
- [ ] If a photo fails to load, the tile or hero keeps a dark background, so its text stays readable
- [ ] Plan tiles and hero quick links open the questionnaire with that plan selected
- [ ] "A few spots to start with" shows real cafés from the data, not demo cards
- [ ] With reduced motion on, nothing animates and every section is visible straight away
- [ ] With motion on, sections fade in when scrolled to, and jumping straight to the bottom (End key) leaves nothing hidden
- [ ] Café cards never show stock photos; they keep the "No verified photo" placeholder
- [ ] No dating-related options or wording anywhere in the app

### Explore (Phase 2)
- [ ] All cafés listed. Search ignores case, accents and hyphens ("cafe f7")
- [ ] Area, budget and facility filters work, and survive a refresh (they're in the URL)
- [ ] Hidden-because-unknown notes appear for budget and facility filters
- [ ] Empty search shows the empty state, and "Clear all filters" resets it
- [ ] Cards show "No verified photo", "Price unknown" and "exact address unknown" honestly

### Questionnaire (Phase 3)
- [ ] Next without an answer shows an error. Choosing an answer clears it
- [ ] Mood allows at most two; the others become disabled
- [ ] Optional steps say "Skip" until something is chosen
- [ ] Refreshing mid-way resumes on the same question
- [ ] Edit from the review step returns to the review step ("Save and review")
- [ ] Homepage tiles preselect the purpose
- [ ] Works with keyboard only (Tab, Space, Enter)

### Recommendations and results (Phases 4–5)
- [ ] "See my matches" opens ranked results, with the top match highlighted
- [ ] "Why this score" explains every answered preference; unknowns say so
- [ ] Few-result searches offer only suggestions that really add matches
- [ ] Impossible searches show the empty state, without misleading results
- [ ] An incomplete or tampered results URL asks for answers instead of crashing
- [ ] Details page: facts, unknowns, facilities, tags note, sources, and "Back to your matches"
- [ ] Google Maps and source links open in a new tab, with `rel="noopener noreferrer"`
- [ ] An unknown café id shows "We couldn't find that café"

### Saved cafés and recent searches (Phase 6)
- [ ] The heart saves and unsaves without opening the card. The nav count updates
- [ ] Saved cafés and recent searches survive a refresh
- [ ] A repeated search moves to the top and isn't duplicated
- [ ] Clicking a recent search reopens the same results
- [ ] "Clear all" asks for confirmation, and Cancel keeps everything
- [ ] Corrupted storage is cleaned. A café that no longer exists shows a notice
- [ ] Blocked storage shows a notice and the app keeps working
- [ ] Two open tabs stay in sync

### Whole app (Phase 7)
- [ ] One `<h1>` per page, with no skipped heading levels
- [ ] No unnamed buttons or links, duplicate ids, or unlabelled fields
- [ ] No console errors or warnings on any page
- [ ] Reduced-motion users get no transitions (`prefers-reduced-motion`)

## Not covered automatically

- Testing with a real screen reader (NVDA, VoiceOver)
- Real phones and tablets. Checks so far used browser emulation
- What Google Maps actually returns for each café search
