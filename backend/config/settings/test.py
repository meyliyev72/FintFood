"""
FintFood — isolated test settings.

Runs the automated test suite against SQLite so the tests are fast, hermetic
and do not require a running PostgreSQL server (production stays on Postgres).
Usage:
    python manage.py test apps.*.tests --settings=config.settings.test

The database is created fresh in the OS temp directory on every run.
"""

import os
import tempfile
from pathlib import Path

from .base import *  # noqa: F401,F403  (import all shared settings)

TEMP_SQLITE = Path(tempfile.gettempdir()) / "fintfood_test.sqlite3"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": str(TEMP_SQLITE),
        "TEST": {"NAME": str(TEMP_SQLITE)},
    }
}

# Faster password hashing keeps the auth tests quick.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

# Tests run against a local, non-throttled API client.
REST_FRAMEWORK.pop("DEFAULT_THROTTLE_RATES", None)

# Never emit real email during tests.
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}