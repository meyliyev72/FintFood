# FintFood frontend

Next.js (App Router) + Tailwind CSS v4 frontend for FintFood. Reads the recipe
catalog from the Django API and renders a responsive, mobile-first homepage.

## Environment

The frontend talks to the backend through the `NEXT_PUBLIC_API_URL` variable.
When it is not set, it falls back to `https://fintfood-backend.onrender.com`.

## Development

```bash
npm ci
npm run dev
```

The dev server runs on http://localhost:3000 (development only).

## Production build

```bash
npm run build
npm run start
```

Supported scripts: `dev`, `build`, `start`, `lint`.