# Khelo IPL — web application (`ipl2026`)

Full-stack **Next.js 16** app: **Tailwind CSS**, **Shadcn UI**, **MongoDB**, **Auth.js** (email + optional Google). The legacy **Flask** (`../server`) and **Vite** (`../scorecard`) apps have been superseded by this project.

## Docs

| Document | Contents |
|----------|----------|
| [docs/LOGIN_AND_ROLES.md](./docs/LOGIN_AND_ROLES.md) | User vs admin login, promoting admins |
| [docs/GOOGLE_CLOUD_OAUTH.md](./docs/GOOGLE_CLOUD_OAUTH.md) | Google Cloud OAuth setup |
| [docs/API_REFERENCE.md](./docs/API_REFERENCE.md) | HTTP API list and sample JSON |

## Quick start

1. **MongoDB** running locally or Atlas URI ready.
2. Copy `.env.example` → `.env.local` and set at least `MONGODB_URI`, `AUTH_SECRET` (`npx auth secret`), `AUTH_URL`.
3. Optional Google: `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `NEXT_PUBLIC_GOOGLE_SIGNIN_ENABLED=true`.
4. `npm install` && `npm run dev` → [http://localhost:3000](http://localhost:3000)

## Security model

- **No JWT in `localStorage`.** Sessions use **HTTP-only cookies** (Auth.js JWT strategy).
- **Same-origin `/api/*`** routes avoid browser CORS issues with a separate backend port.
- Configure **session lifetime** via `SESSION_MAX_AGE_SEC`.

## Branding

- Logo: `public/kheloipl-logo.png`
- Credit: **Developed by Priyanshu Chaniyara** (see `SiteFooter`)

## Old project folders

The former `scorecard/` and `server/` directories were removed as redundant. Use MongoDB backups and this repo’s history if you need the old stack.
