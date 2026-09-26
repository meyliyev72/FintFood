"""Locale-aware model field resolution.

Category, ingredient-category and ingredient names appear in navigation and
filter controls, so they must read naturally in every supported language
(§3.3). Rather than machine-translating user content, the *catalog* carries an
optional translation per language and the API resolves the right one based on
the request.

Supported languages: ``uz`` (default), ``ru``, ``en``.

Resolution order for a field such as ``name``:

1. the language-specific column (``name_ru``), when it is non-empty;
2. the English column (``name_en``);
3. the base ``name`` column.

The base column is therefore always populated and acts as the fallback, which
keeps existing rows and admin-edited records working without backfill.
"""

DEFAULT_LANGUAGE = "uz"
SUPPORTED_LANGUAGES = ("uz", "ru", "en")

#: Maps any incoming language tag onto one of SUPPORTED_LANGUAGES.
_LANGUAGE_ALIASES = {
    "uz": "uz",
    "uz-uz": "uz",
    "uz-latn": "uz",
    "ru": "ru",
    "ru-ru": "ru",
    "en": "en",
    "en-us": "en",
    "en-gb": "en",
}


def normalize_language(value: str | None) -> str:
    """Coerce an arbitrary language tag into a supported one."""
    if not value:
        return DEFAULT_LANGUAGE
    tag = value.strip().lower().replace("_", "-")
    if tag in _LANGUAGE_ALIASES:
        return _LANGUAGE_ALIASES[tag]
    # Fall back to the primary subtag, e.g. ``ru-RU`` -> ``ru``.
    primary = tag.split("-", 1)[0]
    return _LANGUAGE_ALIASES.get(primary, DEFAULT_LANGUAGE)


def get_request_language(request) -> str:
    """Resolve the language for a DRF request.

    Precedence: explicit ``?lang=`` query parameter, then the
    ``Accept-Language`` header, then the product default (``uz``). Django's own
    active translation is only consulted when LocaleMiddleware actually
    negotiated it from the request — otherwise it would fall back to
    ``settings.LANGUAGE_CODE`` and silently override the uz default.
    """
    if request is not None:
        query_params = getattr(request, "query_params", None)
        requested = query_params.get("lang") if query_params is not None else None
        if not requested:
            requested = request.META.get("HTTP_ACCEPT_LANGUAGE")
        if requested:
            return normalize_language(requested)
    return DEFAULT_LANGUAGE


def localized(instance, field: str = "name", language: str = DEFAULT_LANGUAGE) -> str:
    """Return the best available translation of ``field`` on ``instance``."""
    value = getattr(instance, f"{field}_{language}", None)
    if value:
        return value
    english = getattr(instance, f"{field}_en", None)
    if english:
        return english
    return getattr(instance, field, "") or ""


# ---------------------------------------------------------------------------
# Enum display labels
# ---------------------------------------------------------------------------
# ``get_FOO_display()`` relies on Django's active translation, but
# LocaleMiddleware is not installed and no ``locale/`` catalogs exist, so it
# would always return the hardcoded English label from the TextChoices tuple
# and ignore ``?lang=``. These tables keep enum labels (difficulty, unit,
# recipe status) in the same resolution order as catalog fields.

DIFFICULTY_LABELS = {
    "easy": {"uz": "Oson", "ru": "Лёгкая", "en": "Easy"},
    "medium": {"uz": "Oʻrta", "ru": "Средняя", "en": "Medium"},
    "hard": {"uz": "Qiyin", "ru": "Сложная", "en": "Hard"},
}

UNIT_LABELS = {
    "g": {"uz": "g", "ru": "г", "en": "g"},
    "kg": {"uz": "kg", "ru": "кг", "en": "kg"},
    "ml": {"uz": "ml", "ru": "мл", "en": "ml"},
    "l": {"uz": "l", "ru": "л", "en": "l"},
    "pcs": {"uz": "dona", "ru": "шт", "en": "pcs"},
    "tbsp": {"uz": "stol qoshiq", "ru": "ст. л.", "en": "tbsp"},
    "tsp": {"uz": "choy qoshiq", "ru": "ч. л.", "en": "tsp"},
}

RECIPE_STATUS_LABELS = {
    "draft": {"uz": "Qoralama", "ru": "Черновик", "en": "Draft"},
    "pending": {"uz": "Tekshiruvda", "ru": "На проверке", "en": "Pending review"},
    "published": {"uz": "Nashr etilgan", "ru": "Опубликовано", "en": "Published"},
    "rejected": {"uz": "Rad etilgan", "ru": "Отклонено", "en": "Rejected"},
}

_ENUM_TABLES = {
    "difficulty": DIFFICULTY_LABELS,
    "unit": UNIT_LABELS,
    "status": RECIPE_STATUS_LABELS,
}


def localized_choice(
    table: str, value: str | None, language: str = DEFAULT_LANGUAGE
) -> str:
    """Translate an enum value, falling back to the stored English label."""
    if not value:
        return ""
    labels = _ENUM_TABLES.get(table, {}).get(str(value))
    if not labels:
        return str(value)
    return labels.get(language) or labels.get("en") or str(value)
