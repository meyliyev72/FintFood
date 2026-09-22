# FintFood

Smart recipe search by the ingredients you already have at home. Enter what's in your
fridge, and FintFood tells you exactly which recipes you can cook right now and which
single ingredients would unlock the rest.

## Status

Backend API is complete and tested (54 tests passing). The frontend is under active
development — this is a work in progress and is pushed early so work is never lost.

## Features (backend)

- **Ingredient matching** — mark ingredients you have, get recipes sorted into
  "Ready" and "Almost there" (missing 1–2 ingredients with suggestions).
- **Recipes** — catalog with full-text-ish search, filters (category, cuisine, tags,
  prep time, calories, dietary), pagination.
- **Reviews & favorites** — authenticated users can rate/review recipes and bookmark
  them.
- **Shopping list** — add missing recipe ingredients straight to a shared shopping
  list; merge identical items by name.
- **Auth** — JWT (simplejwt) with refresh + blacklist, registration, password reset.
- **OpenAPI schema** (drf-spectacular) and Django admin.

## Project structure

| Path | Purpose |
| --- | --- |
| `backend/manage.py` | Django management entry point |
| `backend/config/` | Project configuration |
| `backend/config/settings/base.py` | Shared settings (DB, DRF, auth, CORS, apps) |
| `backend/config/settings/production.py` | Production overrides (secured default) |
| `backend/config/settings/test.py` | Isolated SQLite test settings (no Postgres needed) |
| `backend/config/urls.py` | Root URLconf (admin, API v1, schema) |
| `backend/config/asgi.py` / `wsgi.py` | ASGI/WSGI entry points |
| `backend/apps/api_router.py` | `/api/v1` router aggregating all apps |
| `backend/apps/core/` | Shared app: pagination, exceptions, common views |
| `backend/apps/accounts/` | Custom email-based User, JWT auth, register, password reset |
| `backend/apps/categories/` | Recipe categories + slug cache signals |
| `backend/apps/ingredients/` | Ingredient catalog used by match/search |
| `backend/apps/recipes/` | Recipes, match engine, filters, search, seed data |
| `backend/apps/reviews/` | Ratings & reviews (nested reviewer info) |
| `backend/apps/favorites/` | Favorites/bookmarks per user |
| `backend/apps/shopping_list/` | Shopping list + dedupe service |
| `backend/requirements.txt` | Core Python dependencies |
| `backend/requirements-extra.txt` | Optional dev tooling |
| `backend/.env.example` | Env template (copy to `.env`, never commit `.env`) |
| `backend/scripts/` | Helper scripts: `dev_api.cmd`, `stop_api.cmd`, `ensure_pg.ps1`, `smoke_test.py` |

## API overview

All endpoints live under `http://localhost:8000/api/v1/`. Interactive docs:
`/api/schema/swagger-ui/` and ReDoc at `/api/schema/redoc/`.

| App | Main endpoints |
| --- | --- |
| accounts | `auth/register/`, `auth/token/`, `auth/token/refresh/`, `auth/logout/`, `auth/password/reset/`, `me/` |
| categories | `categories/` |
| ingredients | `ingredients/?search=` |
| recipes | `recipes/`, `recipes/<id>/`, `recipes/match/`, `recipes/<id>/reviews/`, `recipes/<id>/favorite/` |
| shopping_list | `shopping-list/`, `shopping-list/<id>/` |
| reviews | `reviews/` |
| favorites | `favorites/` |

## Setup (Windows / dev)

1. Create a virtualenv and install requirements:

   ```powershell
   cd backend
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Copy `.env.example` to `.env` and adjust values (Postgres DSN, secret key).

3. Apply migrations and load demo data:

   ```powershell
   python manage.py migrate
   python manage.py seed_data    # 68 recipes with cover images
   ```

4. Run the dev server:

   ```powershell
   python manage.py runserver 0.0.0.0:8000
   ```

5. (Windows helper) `backend\scripts\dev_api.cmd` starts Django and keeps it
   hot-reloading; `backend\scripts\stop_api.cmd` stops it.

## Tests

```powershell
python manage.py test apps.accounts.tests apps.recipes.tests `
  apps.shopping_list.tests apps.reviews.tests apps.favorites.tests `
  --settings=config.settings.test
```

Tests run against an isolated SQLite database in the OS temp dir — fast and
hermetic, no PostgreSQL required.

## Deploy (Render)

Repo'da `render.yaml` blueprint bor — backend (Django API), frontend (Next.js) va
PostgreSQL'ni birga deploy qiladi.

1. Reponi Git hosting (GitHub) ga push qiling.
2. [render.com](https://render.com) → **New → Blueprint** → reponi tanlang.
3. Render `fintfood-db`, `fintfood-backend` va `fintfood-frontend` ni
   yaratadi (barcha env sozlamalari blueprint'da; `DJANGO_SECRET_KEY` avtomatik
   generatsiya qilinadi).
4. Deploy tugagach: backend `https://fintfood-backend.onrender.com`, frontend
   `https://fintfood-frontend.onrender.com` da ishlaydi.

Eslatmalar:

- Demo ma'lumot yuklash uchun Render dashboard → backend service → **Shell**
  da `python manage.py seed_data` ni ishga tushiring.
- Uploag qilingan media fayllar Render'da diskka yoziladi va har deploy'da
  tozalanadi. Uzluksiz saqlash uchun `DJANGO_S3_MEDIA=true` va S3 env vars
  qo'shing (qarang: `backend/config/settings/production.py`).
- Free PostgreSQL 30 kundan keyin tozalanadi — real ish uchun paid plan tanlang.

## Notes on the local PostgreSQL

The dev PostgreSQL lives on port 5434. Two environment quirks worth knowing:

- The sandbox kills background processes between commands, so PostgreSQL must be
  started and used within a single command (see `backend/scripts/ensure_pg.ps1`).
- `pg_ctl` has no `-p` flag — the port is passed with `-o "-p 5434"`.
- Hard-killing the server mid-test leaves WAL that fails crash recovery; a fresh
  `initdb` cluster fixes it.