# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- `pnpm dev` - Start development server with turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

## Architecture Overview

### Tech Stack
- Next.js 15 with App Router and Turbopack
- React 19 with TanStack Query for data fetching
- Tailwind CSS 4 with shadcn/ui components (Radix UI primitives)
- Directus CMS backend at cms.businessfalkenberg.se
- Google Maps integration via @react-google-maps/api

### Key Architectural Patterns

**Server Actions Pattern**: All Directus API communication flows through:
1. `app/actions.ts` - Server actions that handle authentication and call directusServer
2. `lib/directus-server.ts` - Low-level Directus API wrapper with typed requests

**Authentication Flow**:
- Directus auth with JWT tokens stored in httpOnly cookies (`access_token`, `refresh_token`)
- `lib/auth-context.tsx` - Client-side auth state management via React Context
- `components/protected-route.tsx` - Route protection wrapper with redirect-after-login support
- Auth pages: `/login`, `/auth/password-request`, `/auth/password-reset`
- No signup page (users created in Directus admin)

**Provider Hierarchy** (in `app/layout.tsx`):
```
EnvProvider → QueryProvider → AuthProvider → MapsProvider
```

### Directus Schema

**Collections:**
- `foodtrucks` - id, name, user (FK to Directus user), bookings relation
- `spaces` - id, name, location (geographic point), time_slots, bookings relation
- `foodtruck_bookings` - id, foodtruck (FK), space (FK), start, end datetimes
- `foodtruck_rules` - Booking rules (max_future_bookings, max_days_ahead, last_minute_booking_hours)

**Key Relationships:**
- Food truck owners (Directus users) have one food truck
- Food trucks and spaces have many bookings
- Each booking links one food truck to one space for a time period

### Deployment
- Hosted on **Vercel** under Frej Andreassen's account (`frejandreassen`)
- Production URL: `foodtruck-zeta.vercel.app`
- Deploys from `frejandreassen/foodtruck` repo (origin) — our fork is `cryptonicsurfer/foodtruck`
- To deploy changes: create PR from fork to origin/main, ask Frej to merge

### Environment Variables
- `DIRECTUS_URL` / `NEXT_PUBLIC_DIRECTUS_URL` - Directus backend URL
- `APP_URL` / `NEXT_PUBLIC_APP_URL` - Application URL (for password reset links)
- Google Maps API key (via EnvProvider)

## Code Conventions
- Use `@/` absolute imports
- Use `cn()` utility from `lib/utils.ts` for Tailwind class merging
- Named exports for components
- UI primitives in `/components/ui`, feature components in `/components`
- Server actions return `{ success: boolean, data?: T, error?: string }`