# Khelo IPL 2026 Web App

Fantasy cricket leaderboard and scoring platform built with Next.js.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS + shadcn/ui
- MongoDB
- Auth.js (NextAuth)

## Features

- Email/password login and signup
- Optional Google login
- Profile management (display name, picture, password)
- Live leaderboard with player match history
- Admin panel for games, rankings, and scoring profiles
- App-wide light and dark mode
- Responsive UI for mobile and desktop

## Project Structure

```text
src/
	app/                 # Routes, layouts, API handlers
	components/          # Reusable UI and feature components
	lib/                 # API clients, DB helpers, auth/session utilities
	hooks/               # Custom React hooks
	types/               # Shared TypeScript types
docs/                  # API/auth documentation
```

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env.local
```

3. Fill required env values in `.env.local`:

- `MONGODB_URI`
- `AUTH_SECRET`
- `AUTH_URL`
- Optional: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`

4. Start development server:

```bash
npm run dev
```

5. Open:

- http://localhost:3000

## Build for Production

```bash
npm run build
npm run start
```

## Admin Setup

- Visit `/admin`.
- If no admin exists, the app shows first-time admin credential setup.
- After setup, only admin users can access admin routes and APIs.

## Documentation

- `docs/API_REFERENCE.md`
- `docs/GOOGLE_CLOUD_OAUTH.md`
- `docs/LOGIN_AND_ROLES.md`
