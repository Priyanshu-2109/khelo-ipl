# Google OAuth setup (Google Cloud Console)

Use this to enable **Continue with Google** on Khelo IPL.

## 1. Create a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project (or pick an existing one).

## 2. Enable Google Identity Services

1. Go to **APIs & Services → Library**.
2. Search for **Google+ API** or use **Google Identity Services** (OAuth consent screen drives the flow).
3. Enable if prompted.

## 3. OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**.
2. Choose **External** (or Internal for Workspace-only).
3. Fill **App name** (e.g. `Khelo IPL`), **User support email**, **Developer contact**.
4. Add scopes: at minimum **`openid`**, **`email`**, **`profile`** (Auth.js Google provider default).
5. Add **Test users** while the app is in *Testing* (required for non-verified apps).

## 4. Create OAuth client ID

1. Go to **APIs & Services → Credentials**.
2. **Create credentials → OAuth client ID**.
3. Application type: **Web application**.
4. **Authorized JavaScript origins**  
   - Local: `http://localhost:3000`  
   - Production: `https://your-domain.com`
5. **Authorized redirect URIs** (Auth.js v5 default callback):  
   - Local: `http://localhost:3000/api/auth/callback/google`  
   - Production: `https://your-domain.com/api/auth/callback/google`  
   Copy exactly — path is `/api/auth/callback/google`.

## 5. Env vars in Khelo IPL

In `.env.local`:

```env
AUTH_GOOGLE_ID=your-client-id.apps.googleusercontent.com
AUTH_GOOGLE_SECRET=your-client-secret
AUTH_SECRET=<run: npx auth secret>
AUTH_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_SIGNIN_ENABLED=true
```

Restart `npm run dev` after changes.

## 6. Production checklist

- Publish OAuth consent screen or complete verification if you need public sign-in.
- Use **HTTPS** and set **`AUTH_URL`** to the production URL.
- Cookie `Secure` is used when `NODE_ENV=production` — site must be HTTPS.

## 7. Common errors

| Error | Fix |
|--------|-----|
| `redirect_uri_mismatch` | Add exact callback URL under Authorized redirect URIs |
| `Access blocked: app not verified` | Add user as test user or complete verification |
| Button does nothing | Set `NEXT_PUBLIC_GOOGLE_SIGNIN_ENABLED=true` |
