# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

The primary user is a service member 6 to 24 months from separating or retiring, planning college for themselves, often on a phone in spare moments. They know their branch, rank and job code; they usually do not know which degree fields their experience points to, or what a given school will cost them after benefits.

Secondary users are a spouse or child using transferred benefits. They share the service member's household and are set up as extra profiles that inherit the sponsor's service details.

## Product Purpose

Service to Scholar turns a service member's job codes and off-duty skills into matched degree programs, estimates the yearly cost of each after the Post-9/11 GI Bill, Yellow Ribbon and scholarships, and builds a dated checklist with reminders anchored to the separation date.

Success is a user who leaves with a short list of programs they can afford and a plan with dates for getting into one.

## Positioning

It is the only path that runs from military job code to degree field to out-of-pocket cost in one place. The VA GI Bill Comparison Tool compares schools once you already know what to study and where; this app starts from what you did in uniform.

## Operating Context

- Used on a phone, in short sessions, during the transition period before separation.
- Onboarding steps, in order: who the profile is for, branch, rank, job codes, skills, timeline, benefits.
- Four tabs: Matches, Plan, Profiles, Settings. A program detail screen shows the cost line by line.
- A household can hold several profiles (service member, spouse, children).
- Inputs the user brings: branch, rank category, primary and secondary job codes (MOS, AFSC, Rating, Designator), free-text skills, separation date, months of service, VA disability rating, GI Bill benefit level.
- Outputs: ranked program matches with reasons, a yearly cost estimate, a dated checklist, local reminders, and a PDF export of the plan.

## Capabilities and Constraints

- Expo SDK 58 / React Native app for iOS, Android and web, using Expo Router. Native folders are generated; native behaviour is configured in `app.json`.
- Runs fully offline. All user data is stored on the device. There is no sign-in or backend yet; both are the next planned phase.
- Data is bundled snapshots rebuilt by scripts, not fetched at runtime: VA GI Bill Comparison Tool (Yellow Ribbon, school type, housing allowance), College Scorecard (tuition, degree fields), and the O*NET military crosswalk (about 13,000 active job codes for six branches).
- 27 schools and 37 degree fields. About 61% of job codes lead to at least one degree field from job data alone; the rest rely on the user's skills text and picked fields.
- Still sample data: veteran graduation rates, application deadlines, scholarships, and six Navy officer designators.
- Cost figures are estimates and are presented as such.
- Terminology follows each branch: MOS and AOC (Army), MOS (Marine Corps), Rating and Designator (Navy), AFSC (Air Force and Space Force), Rating and Officer Specialty (Coast Guard).
- Push reminders work only in the iPhone and Android app, not on the web.
- Undecided: the backend and sign-in provider; whether any contact address is published; how retired saved programs are shown to the user.

## Brand Commitments

- Name: Service to Scholar ("Service-to-Scholar" in running text in the app).
- Free to use. No paywall; optional donations only.
- For-profit schools are left out of matches by default.
- The core loop keeps working offline with data on the device, including after sign-in is added.
- Branch seals in `assets/seals/` come from Wikimedia Commons and need DoD and service branding approval before any store release.
- O*NET data carries a required credit, shown in Settings under "About the data".

## Evidence on Hand

- Real government data snapshots in `src/data/live/gids.json` and `src/data/live/onet.json`, with their snapshot dates.
- The product spec, a Google Doc titled "Service-to-Scholar_Spec" (Draft v1.0), outside the repository.
- Not available, and not to be invented: user testimonials, usage numbers, outcome statistics, endorsements by the VA, DoD or any service branch, press, and partner schools.

## Product Principles

1. Start from the user's service, not from a school list.
2. Show what the user pays, not the sticker price.
3. Never overstate aid: when a figure is uncertain, use the conservative one and say it is an estimate.
4. Say where each number comes from and which numbers are still sample data.
5. The plan must keep working with no connection and no account.
