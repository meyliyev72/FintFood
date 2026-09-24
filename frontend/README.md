# FintFood frontend

Next.js (App Router, `output: "export"`) + Tailwind CSS v4 frontend for
FintFood. It builds to a fully static site (`out/`) that the Django backend
serves through WhiteNoise (`WHITENOISE_ROOT` = `frontend/out`). There is no
separate frontend service in production — a single URL exposes both the site
and the API.

## API base URL

The frontend calls the API through `NEXT_PUBLIC_API_URL`. When it is not set
it defaults to `/api/v1` (same-origin, since Django serves both the site and
the API). Data is fetched client-side, so this is a build-time constant.

For local development point it at the local backend:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1 npm run dev
```

## Development

```bash
npm ci
npm run dev
```

The dev server runs on http://localhost:3000 (development only).

## Production build

```bash
npm run build
```

This produces `out/` (static HTML/CSS/JS). The Django backend serves it from
the site root. `next start` is **not** used because the app is exported as a
static site; serve `out/` with any static host (WhiteNoise here) instead.

Supported scripts: `dev`, `build`, `lint`.