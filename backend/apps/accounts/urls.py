from django.urls import path, re_path

from rest_framework_simplejwt.views import TokenVerifyView

from . import views

app_name = "accounts"

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("refresh/", views.RefreshView.as_view(), name="refresh"),
    path("verify/", TokenVerifyView.as_view(), name="token_verify"),
    path("me/", views.MeView.as_view(), name="me"),
    path("password/change/", views.PasswordChangeView.as_view(), name="password-change"),
    path("password/reset/", views.PasswordResetRequestView.as_view(), name="password-reset"),
    re_path(
        r"^password/reset/confirm/$",
        views.PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
]