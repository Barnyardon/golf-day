# Kirtlington Golf Day PWA

Live mobile scoring PWA for a mixed-tee golf day at Kirtlington Golf Club (Yellow Par 70 / Red Par 71 / Medal Par 70).

## Features
- Single hole-by-hole gross score entry per fourball (plus one-tap Blob/Pickup).
- Official WHS allowances: **85% Course Handicap** for Team Better Ball (best 2 of 4 Stableford) and **95% Course Handicap** for Individual Stableford (both configurable in Organiser settings).
- Five live leaderboards from the same scorecard: **Team (Best 2)**, **Overall**, **Men**, **Women**, and **Gerald** (tagged subset of players), with standard countback tie-breaking (Back 9, Back 6, Back 3, Hole 18).
- Supports both **Handicap Index** (auto-calculated to Kirtlington WHS Course Handicap using tee Course Rating and Slope) and direct **Course Handicap** entry.
- Offline-first score queuing with Supabase Realtime live sync when configured.

## Run locally
```bash
npm install
npm run dev
```

## Enable live multi-phone scoring (Supabase)
1. Create a free Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL Editor.
3. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Build and deploy `dist/` to Cloudflare Pages, Vercel, or Netlify.

## Default Organiser PIN
`1234` (changeable inside the Organiser tab).
