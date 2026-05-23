# Leavigation collaborator export

Generated for external review of intake wizard, results, and leave calculation logic.

## Important: monolithic plan page

There are **no separate step component files**. The multi-step intake wizard, results page (step 5), and most calculation helpers all live in one file:

| Path | Lines | Role |
|------|-------|------|
| `app/page.tsx` | ~4000 | `PlanPage` export: wizard + results + `buildTimeline` + income estimator |
| `app/plan/page.tsx` | 2 | Re-exports `PlanPage` as default for `/plan` route |

The marketing home page is also in `app/page.tsx` as `LandingPage` (default export, bottom of file).

## `app/page.tsx` section map (PlanPage)

| Lines (approx) | Content |
|----------------|---------|
| 1–72 | Imports, constants (`steps`, `US_STATES_*`, `PAID_LEAVE_STATES`, `SHOW_INCOME_UI`) |
| 74–635 | Types (`WeekInfo`, `WeekStream`), helpers, `getKeyDates`, `getSituationBullets` |
| 636–1167 | **`buildTimeline()`** — core week-by-week SDI/PFL/FMLA/PDL/CFRA/STD/employer math |
| 1169–1246 | `PlanPage` state declarations (all form fields) |
| 1248–1835 | Handlers, `handleNext`/`handleBack`, `displayTimeline`, **`incomeEstimator` useMemo** |
| 1837–1910 | Assumptions disclaimer, progress bar |
| 1912–2153 | **Step 0 — Basics** (state, SF PPLO, pre-birth, due date) |
| 2155–2218 | **Step 1 — Birth & Recovery** |
| 2220–2406 | **Step 3 — Legal & Employer** (employer leave, coordination) |
| 2408–2486 | **Step 2 — Your Income** (salary; gated by `SHOW_INCOME_UI`) |
| 2488–2674 | **Step 4 — Short-term Disability** |
| 2676–3512 | **Step 5 — Results** (banner, Gantt, income table, AI chat) |
| 3514–3740 | Feedback modal, email modal, footer nav |
| 3795+ | `LandingPage` (marketing home; separate from plan tool) |

## Supporting files

| Path | Lines | Role |
|------|-------|------|
| `stateleavedata.js` | ~857 | Per-state SDI/PFL/FMLA config, `getStateLeave()`, CA/NY/NJ/RI/HI/DEFAULT |
| `data/municipalleavedata.js` | ~127 | SF PPLO and other municipal supplements |
| `lib/leaveGuidePrograms.ts` | ~325 | Tier-1 program names/descriptions by state (reference + labels) |
| `lib/leaveGuideStateModel.ts` | ~157 | State tiers (1–4), slugs, tier-2 notices |
| `lib/leaveGuideDisplay.ts` | ~122 | Chat questions, income footnotes, program label helpers |
| `components/StateProgramsReference.tsx` | ~103 | Intake step 0 programs-at-a-glance block |

## Form steps array

```ts
const steps = [
  "Basics",           // step 0
  "Birth & Recovery", // step 1
  "Your Income",      // step 2
  "Legal & Employer", // step 3
  "Short‑term Disability", // step 4
  "Results",          // step 5
];
```

## Key calculation entry points

- **`buildTimeline()`** — constructs `WeekInfo[]` from form inputs
- **`getStateLeave(code)`** — loads state program rules from `stateleavedata.js`
- **`getMunicipalLeave(city, code)`** — SF PPLO top-up logic
- **`incomeEstimator` useMemo** — dollar totals and week-by-week income breakdown
