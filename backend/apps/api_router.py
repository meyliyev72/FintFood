"""Aggregated /api/v1/ router for all domain apps."""

from django.urls import include, path

from .core.views import AdminStatsView, HealthView

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("admin-stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("auth/", include("apps.accounts.urls")),
    path("categories/", include("apps.categories.urls")),
    path("", include("apps.ingredients.urls")),
    path("", include("apps.recipes.urls")),
    path("", include("apps.favorites.urls")),
    path("", include("apps.shopping_list.urls")),
    path("", include("apps.reviews.urls")),
]