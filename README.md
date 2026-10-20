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
- `src/data/` the `DataRepository` interface plus a bundled seed. Swap `seedRepository` for live College Scorecard / VA GIDS / O*NET data without touching callers.
- `src/store/` zustand store persisted to AsyncStorage

## Data caveats

- GI Bill figures are VA's 2026–27 rates: $30,908.34 private-school cap and $1,261/mo online housing allowance. Schools, Yellow Ribbon amounts, veteran outcomes, scholarships and the per-ZIP housing table are approximate sample data.
- The branch seals in `assets/seals/` come from Wikimedia Commons. Get DoD/service branding approval before any store release (spec §14).

## Not yet built

Google/Apple sign-in and backend, live data APIs, remote push and email delivery, donations, full BAH tables, and Phase 2/3 items.
