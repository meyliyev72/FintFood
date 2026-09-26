from django.contrib.auth import get_user_model
from django.db.models import Count, Q

from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import IsAdminUser, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.categories.models import Category
from apps.favorites.models import Favorite
from apps.ingredients.models import Ingredient
from apps.recipes.models import Recipe, Report
from apps.reviews.models import Review

User = get_user_model()

HealthSerializer = inline_serializer(
    name="Health", fields={"status": serializers.CharField(), "service": serializers.CharField()}
)


class HealthView(APIView):
    permission_classes = [IsAuthenticatedOrReadOnly]

    @extend_schema(
        responses={200: HealthSerializer},
        summary="Liveness probe",
        description="Used as the Render healthCheckPath.",
    )
    def get(self, request):
        return Response({"status": "ok", "service": "fintfood-api"})


AdminStatsSerializer = inline_serializer(
    name="AdminStats",
    fields={
        "users": serializers.IntegerField(),
        "recipes": serializers.IntegerField(),
        "published_recipes": serializers.IntegerField(),
        "pending_recipes": serializers.IntegerField(),
        "categories": serializers.IntegerField(),
        "ingredients": serializers.IntegerField(),
        "reviews": serializers.IntegerField(),
        "favorites": serializers.IntegerField(),
        "reports_open": serializers.IntegerField(),
        "top_categories": serializers.ListField(child=serializers.CharField()),
        "recent_recipes": serializers.ListField(child=serializers.DictField()),
    },
)


class AdminStatsView(APIView):
    """Dashboard statistics for the admin interface."""

    permission_classes = [IsAdminUser]

    @extend_schema(
        responses={200: AdminStatsSerializer},
        summary="Dashboard counts and recent activity",
        description="Staff-only. Powers the admin dashboard summary panel.",
    )
    def get(self, request):
        recent_recipes = list(
            Recipe.objects.order_by("-created_at")
            .select_related("author", "category")
            .values_list("title", "author__email", "status", "created_at")[:8]
        )
        return Response(
            {
                "users": User.objects.count(),
                "recipes": Recipe.objects.count(),
                "published_recipes": Recipe.objects.filter(status="published").count(),
                "pending_recipes": Recipe.objects.filter(status="pending").count(),
                "categories": Category.objects.count(),
                "ingredients": Ingredient.objects.count(),
                "reviews": Review.objects.count(),
                "favorites": Favorite.objects.count(),
                "reports_open": Report.objects.filter(status="open").count(),
                "top_categories": list(
                    Category.objects.annotate(
                        n=Count("recipes", filter=Q(recipes__status="published"), distinct=True)
                    )
                    .order_by("-n")
                    .values_list("name", "n")[:5]
                ),
                "recent_recipes": recent_recipes,
            }
        )