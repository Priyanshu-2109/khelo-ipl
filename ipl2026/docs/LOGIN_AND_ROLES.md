# Khelo IPL — logging in as user or admin

## Normal player (email + password)

1. Open the app (e.g. `http://localhost:3000`).
2. You are redirected to **Sign in**.
3. Enter **email** and **password**, then **Sign in**.

## New account

1. Go to **Create an account** (`/signup`).
2. Fill **display name**, **email**, and **password** (rules are shown live).
3. After submit, you are signed in automatically (session cookie only; no JWT in `localStorage`).

## Google sign-in

1. Set `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `NEXT_PUBLIC_GOOGLE_SIGNIN_ENABLED=true` (see [GOOGLE_CLOUD_OAUTH.md](./GOOGLE_CLOUD_OAUTH.md)).
2. On **Sign in** or **Sign up**, choose **Continue with Google** / **Sign up with Google**.
3. After Google redirects back, a **user** document is created or updated in MongoDB.

## Admin panel

Admins see an **Admin** tab in the bottom navigation.

Ways to grant admin:

1. **Environment seed** — set `ADMIN_SEED_EMAIL` to the exact email you will use for the **first** signup or first Google login. That account gets `isAdmin: true` when the user row is created.
2. **MongoDB** (any time):

   ```javascript
   db.users.updateOne(
     { email: "you@example.com" },
     { $set: { isAdmin: true } }
   );
   ```

3. Sign out and sign in again so the JWT session picks up `isAdmin` (or wait for the next session refresh).

## Sessions and security

- Auth uses **Auth.js** with a **JWT stored in an HTTP-only, secure (in production) cookie** — not `localStorage`.
- **Session length** is controlled by `SESSION_MAX_AGE_SEC` (default 7 days).
- Use **HTTPS** in production and set `AUTH_URL` to your real origin.

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| Redirect loop | `AUTH_SECRET`, `AUTH_URL`, MongoDB URI |
| Google button missing | `NEXT_PUBLIC_GOOGLE_SIGNIN_ENABLED=true` |
| Admin tab missing | `isAdmin` in `users` collection, then re-login |
| API errors | Mongo running; `MONGODB_URI` correct |
