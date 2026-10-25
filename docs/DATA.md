# Café data

All café information lives in [`src/data/cafes.json`](../src/data/cafes.json). The app reads it
through [`src/lib/cafes.js`](../src/lib/cafes.js), which validates every record, so a bad entry is
skipped instead of breaking the page. The recommendation logic never needs to change when cafés
are added or edited.

## Current state (checked 2026-10-25)

- 12 café branches, compiled from published guides and listings dated 2019–2026.
- **None of it has been confirmed directly with the cafés.** The app says so on the Explore page.
- No photos: no image could be verified as a genuine photo of each café, so every card uses a
  labelled placeholder.
- Opening hours are left unknown. The only hours found came from a 2019 article, which is too old
  to show as fact.
- This is not a complete list of Islamabad cafés.

## Rules for editing

1. **`null` means unknown.** Never fill a field with a guess.
2. **`true` / `false` for facilities must come from a source.** Add the source id to `fieldSources`
   (for example `"facilities.wifi": "wanderlog-shaghf"`). The tests fail if you forget.
3. **Every source goes in the top-level `sources` object** with its title, publisher, URL and
   publish date. Cafés refer to it by id.
4. **Budgets are estimates.** `estimatedBudgetPerPerson` is one drink plus one food item, taken from
   a cited menu price list. Write how it was calculated in `basis` and cite `sourceId`.
5. **Tags (`moods`, `purposes`, `atmosphere`) are editorial.** They interpret the source's
   description and should stay close to what the source actually says. Allowed values are listed in
   [`src/lib/vocabulary.js`](../src/lib/vocabulary.js); unknown values are ignored.
6. **No ratings, review counts or popularity numbers.** A test checks for this.
7. **Update `lastChecked`** whenever you re-check a café, and set `dataConfidence`:
   - `high` – confirmed against the café's own website or official social media in the last year
   - `medium` – at least one published source from the last year
   - `low` – only older sources

## Fields

| Field | Type | Notes |
|---|---|---|
| `id` | string, required | Unique, URL-safe, e.g. `shaghf-f8` |
| `name` | string, required | Café name |
| `branch` | string or null | Which branch, for chains |
| `area` | string or null | Sector or neighbourhood, e.g. `F-6`, `Blue Area` |
| `address` | string or null | As given by the source |
| `description` | string or null | Short, factual, based on sources |
| `estimatedBudgetPerPerson` | `{min, max, basis, sourceId, includes?}` or null | PKR. Set `includes: "drink"` when no food prices were available |
| `moods`, `purposes`, `atmosphere` | string arrays | Editorial tags, see above |
| `facilities` | `{wifi, powerOutlets, parking, airConditioning}` | each `true` / `false` / `null` |
| `outdoorSeating` | `true` / `false` / `null` | |
| `noiseLevel`, `openingHours` | string or null | Currently all unknown |
| `website`, `instagram`, `imageUrl` | URL or null | Only `http(s)` URLs are accepted |
| `googlePlaceId` | string or null | Optional. A Google place ID (e.g. `ChIJ…`) you have checked points to this exact branch. Makes "Get directions" and "View on Google Maps" exact. Never guess one |
| `imageSource` | string or null | Credit shown on the photo, e.g. `Shaghf Islamabad, used with permission`. Required when `imageUrl` is set |
| `imageSourceUrl` | URL or null | Optional link for the credit (the original photo or the café's page) |
| `sourceIds`, `fieldSources` | source references | Which source backs which field |
| `notes` | string or null | Anything a future editor should know |
| `lastChecked` | date | When the sources were last reviewed |
| `dataConfidence` | `high` / `medium` / `low` | See rule 7 |

## Adding a café photo

No café has a photo yet. No photo of these specific cafés was found that may be reused
(October 2026 search: café websites, Wikimedia Commons, published articles). When you have one,
for example your own photo or one a café has given permission to use:

1. Resize it to about 1200px wide (WebP or JPEG, ideally under 200 KB).
2. Save it as `public/cafes/<café id>.webp`, for example `public/cafes/shaghf-f8.webp`.
3. In `src/data/cafes.json`, set on that café:
   ```json
   "imageUrl": "/cafes/shaghf-f8.webp",
   "imageSource": "Your name, own photo",
   "imageSourceUrl": null
   ```
4. Run `npm test`. A photo without an `imageSource` credit fails the tests.

The card, results and details page then show the photo with its credit, cropped to the same shape
as the placeholder. If it ever fails to load, the "No verified photo" placeholder comes back.

Never use a generic or stock photo here: on a named café's card it would imply it shows that café.

**Google Places photos** are possible later, but they need a Google Cloud project with billing
enabled and an API key. They must be loaded live (they can't be saved in this repository), and they
must show the photographer's credit plus Google Maps attribution. Ask before setting this up.

## Leads not yet included

The 2026 Pakistan Connect guide also lists Coffee Wagera, Bunch of Beans, Sugar Loop and Crusteez.
They were left out because no reliable Islamabad branch location was found. Coffee Wagera is
described there as having Wi-Fi and charging points, which would be useful once a location is
confirmed.
