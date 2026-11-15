# Service to Scholar

Expo / React Native app (iOS, Android, web) that turns a service member's job codes and off-duty skills into matched degree programs, estimates net cost after GI Bill, Yellow Ribbon and scholarships, and builds a dated checklist with reminders. Spec: Google Doc "Service-to-Scholar_Spec" (Draft v1.0).

This build covers the Phase 1 core loop: it runs offline and stores everything on the device.

## Run

```bash
npm install
npx expo start          # scan the QR code with Expo Go, or press w for web
npm test                # matching, cost calculator, timeline, reminders
npx tsc --noEmit
```

## Layout

- `src/app/` routes: `onboarding/*` (who → branch → rank → codes → skills → timeline → benefits), `(tabs)/` Matches · Plan · Profiles · Settings, `program/[key]` cost breakdown
- `src/lib/` pure logic: `matching.ts` (O*NET SOC → CIP + custom crossover + KSBP keywords, for-profit exclusion), `costCalculator.ts`, `timeline.ts`, `reminders.ts` (schedule planner), `notifications.ts` (expo-notifications glue), `exportPdf.ts`
- `src/data/` the `DataRepository` interface, a bundled seed, and `live/gids.json`: real VA and College Scorecard figures laid over the seed's schools by `withGids`. `npm run refresh-data` re-pulls them. No key is needed; if College Scorecard's shared demo key is throttled, set a free api.data.gov key as `SCORECARD_API_KEY` in your shell (never in the repo).
- `src/store/` zustand store persisted to AsyncStorage

## Data caveats

- GI Bill figures are VA's 2026–27 rates: $30,908.34 private-school cap and $1,261/mo online housing allowance. Yellow Ribbon participation and caps, public/private/for-profit status and housing allowance come from the VA GI Bill Comparison Tool; tuition and fees and each school's degree fields come from the College Scorecard (snapshot date in `src/data/live/gids.json`). Yellow Ribbon caps use the lowest cap across a school's divisions at each degree level. Degree fields are matched by 4-digit CIP family, so a school counts as offering Cybersecurity if it awards any degree in that family. Veteran graduation rates, application deadlines, scholarships and Excelsior's tuition are still approximate sample data.
- The branch seals in `assets/seals/` come from Wikimedia Commons. Get DoD/service branding approval before any store release (spec §14).

## Not yet built

Google/Apple sign-in and backend, O*NET job-code data, remote push and email delivery, donations, full BAH tables, and Phase 2/3 items.
