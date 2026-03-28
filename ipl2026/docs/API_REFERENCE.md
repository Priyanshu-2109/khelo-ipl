# Khelo IPL — API reference (Next.js `/api/*`)

All routes are served by the **same origin** as the web app. Authenticated routes use the **session cookie** from Auth.js (`credentials: "include"` from the browser).

Base URL examples:

- Local: `http://localhost:3000`

---

## Auth (Auth.js)

| Method | Path | Notes |
|--------|------|--------|
| GET/POST | `/api/auth/*` | Sign in, sign out, OAuth callbacks (handled by Auth.js) |

---

## Public / semi-public

### GET `/api/auth/password-requirements`

**Response 200**

```json
{
  "minLength": 8,
  "requireUppercase": true,
  "requireLowercase": true,
  "requireDigit": true,
  "requireSpecial": true
}
```

### POST `/api/register`

**Body**

```json
{
  "displayName": "Player One",
  "email": "player@example.com",
  "password": "Str0ng!Pass"
}
```

**Response 201**

```json
{
  "message": "User registered successfully",
  "email": "player@example.com"
}
```

Then the client calls **signIn("credentials")** to set the session cookie.

### POST `/api/auth/forgot-password`

**Body:** `{ "email": "player@example.com" }`  
**Response:** `{ "message": "If the email exists..." }`  
In development, may include `"debug_token"` for testing.

### POST `/api/auth/validate-reset-token`

**Body:** `{ "token": "..." }`  
**Response:** `{ "valid": true }`

### POST `/api/auth/reset-password`

**Body**

```json
{
  "token": "…",
  "password": "NewStr0ng!Pass"
}
```

### GET `/api/leaderboard`

**Response 200**

```json
{
  "leaderboard": [
    {
      "user_id": "507f1f77bcf86cd799439011",
      "display_name": "Player One",
      "profilePicture": null,
      "total_points": 120,
      "matches_played": 3,
      "average_points": 40.0,
      "best_rank": 1
    }
  ]
}
```

### GET `/api/players/:userId/games`

**Response 200**

```json
{
  "matches": [
    {
      "id": "…",
      "match_name": "MI vs CSK",
      "match_date": "2026-03-20",
      "user_rank": 2,
      "points": 18
    }
  ]
}
```

### GET `/api/health`

**Response 200:** `{ "status": "healthy", "database": "connected" }`

---

## Session required

### GET `/api/auth/me`

**Headers:** Cookie session  
**Response 200**

```json
{
  "user": {
    "id": "…",
    "displayName": "Player One",
    "email": "player@example.com",
    "isAdmin": false,
    "createdAt": "2026-03-28T…",
    "lastLogin": "2026-03-28T…",
    "profilePicture": null
  }
}
```

### PUT `/api/profile/display-name`

**Body:** `{ "displayName": "New Name" }`

### PUT `/api/profile/password`

**Body**

```json
{
  "currentPassword": "OldStr0ng!",
  "newPassword": "NewStr0ng!"
}
```

### PUT `/api/profile/picture`

**Body:** `{ "profilePicture": "data:image/png;base64,..." }`  
Max ~2MB (enforced server-side).

### DELETE `/api/profile/picture`

Removes stored picture.

---

## Admin (session + `isAdmin`)

### GET `/api/admin/scoring-profiles`

### POST `/api/admin/scoring-profiles`

**Body example**

```json
{
  "name": "Top 10",
  "description": "Standard",
  "point_distribution": { "1": 25, "2": 18, "3": 15, "4": 12, "5": 10, "6": 8, "7": 6, "8": 4, "9": 2, "10": 1 },
  "is_multiplier": false,
  "multiplier": 1,
  "max_ranks": 10
}
```

### PUT `/api/admin/scoring-profiles/:profileId`

### DELETE `/api/admin/scoring-profiles/:profileId`

Cannot delete the **default** profile.

### GET `/api/admin/games`

### POST `/api/admin/games`

**Body example**

```json
{
  "match_name": "MI vs CSK",
  "match_date": "2026-04-01",
  "match_time": "19:30",
  "venue": "Wankhede",
  "scoring_profile_id": "<ObjectId string>"
}
```

### DELETE `/api/admin/games/:gameId`

### GET `/api/admin/games/:gameId/rankings`

Returns `users`, `rankings`, and `game` metadata for the points form.

### POST `/api/admin/points`

**Body example**

```json
{
  "game_id": "<game ObjectId>",
  "points": [
    { "user_id": "<user ObjectId>", "fantasy_points": 320 },
    { "user_id": "<user ObjectId>", "fantasy_points": 280 }
  ]
}
```

Ranks and `pointsEarned` are computed from the scoring profile (same rules as the previous Flask app).

---

## Error shape

Many routes return:

```json
{ "detail": "Human-readable message" }
```

or `{ "error": "..." }` with appropriate HTTP status (401, 403, 404, 500).
