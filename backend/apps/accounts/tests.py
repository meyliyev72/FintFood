from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


def register(client, name="Test User", email="test@example.com", password="StrongPass123!"):
    resp = client.post(
        "/api/v1/auth/register/",
        {"name": name, "email": email, "password": password, "password2": password},
        format="json",
    )
    client.cookies.update(resp.cookies)
    return resp


class AccountAuthenticationTests(APITestCase):
    def test_register_creates_user_and_sets_cookies(self):
        resp = register(self.client)
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="test@example.com").exists())
        self.assertIn("access_token", self.client.cookies)
        self.assertIn("refresh_token", self.client.cookies)
        self.assertEqual(resp.data["user"]["email"], "test@example.com")

    def test_register_rejects_duplicate_email(self):
        register(self.client)
        self.client.cookies.clear()
        resp = register(self.client)
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_requires_matching_passwords(self):
        resp = self.client.post(
            "/api/v1/auth/register/",
            {"name": "X", "email": "x@example.com", "password": "OnePass123!", "password2": "Different1!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_success_and_failure(self):
        register(self.client)
        self.client.cookies.clear()
        resp = self.client.post(
            "/api/v1/auth/login/",
            {"email": "test@example.com", "password": "StrongPass123!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access_token", resp.cookies)

        bad = self.client.post(
            "/api/v1/auth/login/",
            {"email": "test@example.com", "password": "wrong-password"},
            format="json",
        )
        # DRF returns 401 when a WWW-Authenticate header is available; the
        # cookie-based login view has no authenticator, so it coerces to 403.
        self.assertIn(bad.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))
        self.assertIn("Unable to log in", str(bad.data["detail"]))
        self.assertNotIn("access_token", bad.cookies)

    def test_me_requires_auth_and_returns_profile(self):
        resp = self.client.get("/api/v1/auth/me/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)
        register(self.client)
        resp = self.client.get("/api/v1/auth/me/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["email"], "test@example.com")

    def test_profile_update(self):
        register(self.client)
        resp = self.client.patch(
            "/api/v1/auth/me/", {"name": "Renamed", "bio": "Hello!"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["name"], "Renamed")
        self.assertEqual(resp.data["bio"], "Hello!")

    def test_logout_blacklists_refresh_and_clears_cookies(self):
        register(self.client)
        resp = self.client.post("/api/v1/auth/logout/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.cookies.get("access_token").value, "")
        self.assertEqual(resp.cookies.get("refresh_token").value, "")

    def test_password_change(self):
        register(self.client)
        resp = self.client.post(
            "/api/v1/auth/password/change/",
            {"old_password": "StrongPass123!", "new_password": "NewPass456!", "password2": "NewPass456!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.client.cookies.clear()
        resp = self.client.post(
            "/api/v1/auth/login/",
            {"email": "test@example.com", "password": "NewPass456!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_password_reset_request_always_200(self):
        resp = self.client.post(
            "/api/v1/auth/password/reset/", {"email": "nobody@example.com"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("If that email exists", resp.data["detail"])

    def test_password_reset_confirm_flow(self):
        user = User.objects.create_user(email="reset@example.com", password="OldPass123!")
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.encoding import force_bytes
        from django.utils.http import urlsafe_base64_encode

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        resp = self.client.post(
            "/api/v1/auth/password/reset/confirm/",
            {"uid": uid, "token": token, "new_password": "FreshPass456!"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertTrue(user.check_password("FreshPass456!"))

    def test_guest_cannot_access_authenticated_views(self):
        for url in ("/api/v1/favorites/", "/api/v1/shopping-list/", "/api/v1/admin-stats/"):
            resp = self.client.get(url)
            self.assertIn(resp.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))