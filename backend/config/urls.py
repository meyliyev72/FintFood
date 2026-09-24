"""FintFood root URL configuration."""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path

from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

from apps.core.views import frontend_index

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/", include("apps.api_router")),
    path("api/v1/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/v1/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="schema-ui",
    ),
    # SPA catch-all: anything that is not an API/admin/static/media/next-asset
    # path gets the built frontend index.html (deep links work via
    # client-side routing). Missing _next assets return Django's 404 instead.
    re_path(
        r"^(?!admin/|api/|static/|media/|_next/).*",
        frontend_index,
        name="frontend-index",
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)