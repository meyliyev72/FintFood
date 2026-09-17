"""JWT cookie-based authentication for the FintFood API.

Tokens are stored in HTTP-only cookies set by the backend. The access
token may alternatively be passed in the ``Authorization: Bearer ...``
header (useful for non-browser clients and tests). Nothing sensitive is
ever persisted in localStorage on the frontend.
"""

from django.conf import settings

from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """Read the JWT from the ``access_token`` cookie or the Authorization header."""

    def authenticate(self, request):
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
        else:
            raw_token = request.COOKIES.get(settings.SIMPLE_JWT["ACCESS_COOKIE"])

        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token


def set_auth_cookies(response, access_token: str, refresh_token: str) -> None:
    """Attach access/refresh JWT tokens to the response as HTTP-only cookies."""
    jwt_settings = settings.SIMPLE_JWT
    secure = jwt_settings["SECURE_COOKIES"]
    max_age = jwt_settings["COOKIE_MAX_AGE"]

    response.set_cookie(
        jwt_settings["ACCESS_COOKIE"],
        access_token,
        max_age=jwt_settings.get("ACCESS_COOKIE_MAX_AGE", 60 * 30),
        httponly=True,
        secure=secure,
        samesite="Lax",
        path="/",
    )
    response.set_cookie(
        jwt_settings["REFRESH_COOKIE"],
        refresh_token,
        max_age=max_age,
        httponly=True,
        secure=secure,
        samesite="Lax",
        path="/",
    )
    return response


def clear_auth_cookies(response) -> None:
    """Delete the JWT cookies from the response."""
    jwt_settings = settings.SIMPLE_JWT
    for name in (jwt_settings["ACCESS_COOKIE"], jwt_settings["REFRESH_COOKIE"]):
        response.delete_cookie(name, path="/", samesite="Lax")
    return response