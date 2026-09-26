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
