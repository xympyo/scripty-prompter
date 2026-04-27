# Scripty

Scripty is a Vite React PWA for presentation rehearsal: write scripts in slide groups, forecast speaking time, rehearse against min/max timing, and run a touch-friendly teleprompter from Android Chrome's Add to Home Screen flow.

## Features

- Guest mode with local browser persistence and offline app-shell caching.
- Optional cloud account with username/password auth through Vercel API routes.
- Upstash Redis storage isolated to `scripty:*` keys only.
- 45-day inactive cleanup using Redis TTL refresh on login, load, and save.
- IP rate limiting for auth and script sync endpoints.
- Slide-grouped script blocks, including ranges such as slides 2-5.
- Duration forecasting with WPM, punctuation pauses, min/max range, and 20% safe allowance.
- Rehearsal samples to calculate a personal timing mean and standard deviation.
- Full-screen teleprompter controls for font size, scroll speed, play/pause, reset, and mirror mode.

## Local Development

Install dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example` and add real values:

```bash
UPSTASH_REDIS_REST_URL="https://your-upstash-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="replace-with-rotated-token"
JWT_SECRET="replace-with-a-long-random-secret"
```

Run the Vite app:

```bash
npm run dev
```

For API routes locally, run through Vercel so `/api/*` functions are available:

```bash
npx vercel dev
```

## Vercel Deployment

Add these environment variables in Vercel Project Settings:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `JWT_SECRET`

Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```

## Upstash Safety

Scripty never scans or deletes unrelated Redis keys. All application data is written under the `scripty:` namespace:

- `scripty:users:{usernameHash}`
- `scripty:scripts:{userId}`
- `scripty:sessions:{sessionId}`
- `scripty:ratelimit:{bucket}:{ipHash}:{window}`

Rotate any Redis token that has been shared outside your password manager or deployment environment before production use.

## Android Add to Home Screen

1. Deploy to Vercel or open the local dev server from Android Chrome.
2. Open Chrome menu.
3. Choose **Add to Home screen** or **Install app**.
4. Launch Scripty from the home screen and use guest mode offline after the first load.

## Validation

```bash
npm run typecheck
npm run build
```

Manual checks before presenting:

1. Create slide groups and refresh the browser to confirm guest persistence.
2. Use Timing to enter 2-3 rehearsal samples and confirm the range changes.
3. Open Prompt mode, adjust scroll speed and font size, then rehearse once end to end.
4. Sign in on the deployed app, sync, reload, and confirm the cloud copy returns.
5. Inspect Upstash and confirm only `scripty:*` keys changed.
