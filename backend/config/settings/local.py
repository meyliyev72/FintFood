"""
FintFood — local development settings (SQLite, no PostgreSQL required).

Use when you just want to run the whole app on your machine without a
running PostgreSQL server:

    DJANGO_SETTINGS_MODULE=config.settings.local python manage.py migrate
    DJANGO_SETTINGS_MODULE=config.settings.local python manage.py seed_data
    DJANGO_SETTINGS_MODULE=config.settings.local python manage.py runserver

Production still uses config.settings.production on PostgreSQL.
"""

from .base import *  # noqa: F401,F403
from .base import BASE_DIR

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "local.sqlite3",
    }
}
