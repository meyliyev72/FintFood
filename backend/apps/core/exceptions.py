from rest_framework.exceptions import ValidationError
from rest_framework.views import exception_handler


def fintfood_exception_handler(exc, context):
    """Return a consistent JSON error shape for the whole API.

    Success responses and APIView errors use:
        {"detail": "...", "errors": {...optional field errors...}, "code": "..."}
    """
    response = exception_handler(exc, context)

    if response is None:
        return None

    message = getattr(exc, "detail", "An unexpected error occurred.")

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
        payload["code"] = getattr(exc, "default_code", "error").replace("_", "-")

    response.data = payload
    return response


def _first_message(value):
    if isinstance(value, list):
        return _first_message(value[0]) if value else ""
    if isinstance(value, dict):
        return _first_message(next(iter(value.values())))
    return str(value)