# ForeRight Trips — golf trips made easy

A group-first golf trip planner: organize the whole getaway in one place instead
of juggling separate sites for courses, hotels, and flights. Optimized for
**price and participation** — everyone has a say, and everyone pays their own way.

Mobile-first web app (React + Vite + TypeScript). All data is stored locally in
your browser (`localStorage`) — no account or backend required for this build.

## Features

- **Trip setup + group survey** — create a trip (dates, destination, budget),
  invite buddies, and have each person fill out a survey (preferred locations,
  available dates, budget, hotel tier, flights needed).
- **Group voting** — everyone votes on courses, tee times, hotels, and flights
  with live tallies. Hotels show average drive time to the courses. A
  "Leading" badge marks the front-runner in each category.
- **Electronic scorecard** — live 18-hole scoring per player with color-coded
  cells (birdie/par/bogey), per-round leaderboard, side games, and overall trip
  standings.
- **Betting tracker** — log wagers and side games, see per-player net balances,
  and get a minimal "who pays whom" settle-up. Everyone pays their own way.

### Phase 1 booking (affiliate-style)

Per the product brief, booking starts as outbound links to existing services
(GolfNow for tee times, Expedia for hotels/flights). You browse on the partner
site, then add the candidate options into the app for the group to vote on.
Native in-app booking is a later milestone.

## Run it locally

```bash
npm install
npm run dev
```

Then open the printed URL (defaults to http://localhost:5191/).

The app ships with a sample **Myrtle Beach Buddies Trip** so you can explore
every screen immediately. Use the **"You are"** switcher in the top-right to act
as different group members (cast votes, enter scores, etc.) — this stands in for
real multi-user accounts. **Reset demo data** on the home screen restores the
sample trip.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production (`dist/`) |
| `npm run preview` | Preview the production build |
| `npm run lint` | Type-check only (`tsc --noEmit`) |

## Tech

- React 18 + React Router 6
- Zustand (with `persist` → `localStorage`)
- Vite + TypeScript (strict)
- Plain CSS, mobile-first, with reduced-motion support

## Roadmap (from the product brief)

- **Phase 2:** real accounts + real-time group sync (e.g. Supabase) once there's
  traction, plus native API integrations for tee times, hotels, and flights.
- Optional add-ons at checkout (local ride service, restaurant reservations).
