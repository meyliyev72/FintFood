from django.core.exceptions import PermissionDenied
from django.http import Http404
from rest_framework import exceptions
from rest_framework.exceptions import ValidationError
from rest_framework.views import exception_handler


def _normalize(exc):
    """Rebuild the exception the way DRF does before we read its metadata.

    DRF's own ``exception_handler`` converts a bare ``Http404`` into
    ``NotFound`` and a bare ``PermissionDenied`` into its DRF counterpart, but
    only in its *local* scope. The original object reaches us unchanged, and a
    plain ``Http404`` has neither ``.detail`` nor ``.default_code`` — which is
    why every 404 used to come back as "An unexpected error occurred.".
    """
    if isinstance(exc, Http404):
        return exceptions.NotFound(*exc.args)
    if isinstance(exc, PermissionDenied) and not isinstance(
        exc, exceptions.PermissionDenied
    ):
        return exceptions.PermissionDenied(*exc.args)
    return exc


def fintfood_exception_handler(exc, context):
    """Return a consistent JSON error shape for the whole API.

    Success responses and APIView errors use:
        {"detail": "...", "errors": {...optional field errors...}, "code": "..."}
    """
    response = exception_handler(exc, context)

    if response is None:
        return None

    exc = _normalize(exc)

    message = getattr(exc, "detail", None)
    if message is None:
        # No usable detail: keep the status, say something honest.
        message = _default_detail(response.status_code)

    errors = None
    if isinstance(message, dict):
        errors = message
        flat = next(iter(message.values())) if message else None
        detail = _first_message(flat) if flat else "Invalid input."
    elif isinstance(message, list):
        detail = _first_message(message)
        if len(message) > 0 and isinstance(message[0], dict):
            detail = "Invalid input."
    else:
        detail = message

    if response.status_code >= 500:
        detail = "Something went wrong on our side. Please try again later."

    payload = {"detail": detail}
    if errors:
        payload["errors"] = errors
    if isinstance(exc, ValidationError):
        payload["code"] = "validation_error"
    else:
        payload["code"] = getattr(exc, "default_code", _default_code(response.status_code)).replace(
            "_", "-"
        )

    response.data = payload
    return response


def _default_code(status_code: int) -> str:
    return {
        400: "invalid",
        401: "not-authenticated",
        403: "permission-denied",
        404: "not-found",
        405: "method-not-allowed",
        429: "throttled",
    }.get(status_code, "error")


def _default_detail(status_code: int) -> str:
    return {
        400: "Invalid input.",
        401: "Authentication credentials were not provided.",
        403: "You do not have permission to perform this action.",
        404: "Not found.",
        405: "Method not allowed.",
        429: "Request was throttled.",
    }.get(status_code, "Request failed.")


def _first_message(value):
    if isinstance(value, list):
        return _first_message(value[0]) if value else ""
    if isinstance(value, dict):
        return _first_message(next(iter(value.values())))
    return str(value)