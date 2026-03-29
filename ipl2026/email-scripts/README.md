# Email Scripts

This folder contains broadcast email scripts for Khelo IPL.

## Files

- `templates/broadcast.html`: edit this HTML to format your mail.
- `send-broadcast.cjs`: sends the mail to all active user emails in MongoDB.
- `watch-and-send.cjs`: watches the HTML template and auto-sends on each save.

## Environment Required

Use existing app env values:

- `MONGODB_URI`
- `MONGODB_DB_NAME` (optional, default: `khelo_ipl`)
- `SMTP_HOST` / `EMAIL_HOST`
- `SMTP_PORT` / `EMAIL_PORT`
- `SMTP_USER` / `EMAIL_USER`
- `SMTP_PASS` / `SMTP_PASSWORD` / `EMAIL_PASSWORD`
- `SMTP_FROM` / `EMAIL_FROM` (optional; defaults to SMTP user)

## Commands

Dry run (safe check, no email sent):

```bash
npm run email:send
```

Live send to all active users:

```bash
npm run email:send:live -- --subject "Your subject here"
```

If custom flags are not forwarded by your npm version, run directly:

```bash
node email-scripts/send-broadcast.cjs --yes --subject "Your subject here"
```

Auto-send when template changes:

```bash
npm run email:watch
```

## Useful Options

Pass after `--`:

- `--template email-scripts/templates/broadcast.html`
- `--subject "Khelo IPL update"`
- `--batch-size 50`
- `--pause-ms 1200`
- `--limit 100` (test with first 100 users)
- `--dry-run`
- `--yes` (required for actual sending)

Direct-node command is the most reliable for custom options on Windows npm:

```bash
node email-scripts/send-broadcast.cjs --yes --template email-scripts/templates/broadcast.html --subject "Khelo IPL update" --batch-size 50 --pause-ms 1200
```

## Notes

- Recipients are taken from `users` collection with `isActive: true` and valid `email`.
- Duplicate emails are removed automatically.
- If any sends fail, process exits with non-zero status.
