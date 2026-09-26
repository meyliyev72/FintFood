from decimal import ROUND_HALF_UP, Decimal

from django.db.models import Count, Prefetch, Q

from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import (
    SAFE_METHODS,
    AllowAny,
    BasePermission,
    IsAuthenticatedOrReadOnly,
)
from rest_framework.response import Response

from apps.core.i18n import get_request_language, localized, localized_choice
from apps.ingredients.models import Ingredient
from apps.reviews.models import Review

from .filters import RecipeFilter
from .models import Recipe, RecipeStatus, RecipeView, Report
from .serializers import (
    RecipeDetailSerializer,
    RecipeListSerializer,
    RecipeWriteSerializer,
    ReportSerializer,
)


class IsOwnerOrReadOnly(BasePermission):
    """Allow read for everyone; edit/delete only for the author or staff."""

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.author_id == request.user.pk or request.user.is_staff


class ReportViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """Moderation reports. Any authenticated user may file one; admins manage them in Django admin."""

    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Report.objects.none()
        return Report.objects.filter(reported_by=user)


class RecipeViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    filterset_class = RecipeFilter
    search_fields = [
        "title",
        "description",
        "category__name",
        "recipe_ingredients__ingredient__name",
    ]
    ordering_fields = [
        "avg_rating",
        "created_at",
        "total_time",
        "title",
        "review_count",
    ]
    ordering = ["-created_at"]
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    lookup_field = "slug"

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return RecipeWriteSerializer
        if self.action == "retrieve":
            return RecipeDetailSerializer
        return RecipeListSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Recipe.objects.with_stats(user)
        if self.action == "retrieve":
            # Owners (and staff) may see their own non-published recipes.
            queryset = queryset.prefetch_related(
                Prefetch(
                    "reviews",
                    queryset=Review.objects.select_related("user").order_by("-created_at"),
                )
            )
            if user.is_authenticated:
                return queryset.filter(
                    Q(status=RecipeStatus.PUBLISHED) | Q(author=user)
                )
            return queryset.filter(status=RecipeStatus.PUBLISHED)
        return queryset.filter(status=RecipeStatus.PUBLISHED).distinct()

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.is_authenticated:
            RecipeView.objects.update_or_create(
                user=request.user, recipe=instance
            )
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticatedOrReadOnly])
    def my(self, request):
        """Recipes authored by the current user (all statuses)."""
        user = request.user
        if not user.is_authenticated:
            return Response(
                {"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED
            )
        queryset = (
            Recipe.objects.with_stats(user)
            .filter(author=user)
            .order_by("-created_at")
        )
        page = self.paginate_queryset(queryset)
        serializer = RecipeListSerializer(page, many=True, context={"request": request})
        return self.get_paginated_response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticatedOrReadOnly])
    def recently_viewed(self, request):
        """Recently viewed recipes for the current user (max 12)."""
        user = request.user
        if not user.is_authenticated:
            return Response(
                {"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED
            )
        recipes = (
            Recipe.objects.with_stats(user)
            .filter(
                views__user=user, status=RecipeStatus.PUBLISHED
            )
            .distinct()
            .order_by("-views__viewed_at")[:12]
        )
        serializer = RecipeListSerializer(recipes, many=True, context={"request": request})
        return Response({"count": len(recipes), "results": serializer.data})

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        # Structured so the client can render its own localized message.
        return Response({"deleted": True, "slug": instance.slug}, status=status.HTTP_200_OK)

    # ------------------------------------------------------------------
    # Ingredient matching — flagship "Find by Ingredients" feature
    # ------------------------------------------------------------------
    @action(
        detail=False,
        methods=["post"],
        permission_classes=[AllowAny],
        url_path="match-by-ingredients",
    )
    def match_by_ingredients(self, request):
        ingredient_ids = request.data.get("ingredient_ids", [])
        if not isinstance(ingredient_ids, list):
            return Response(
                {"detail": "ingredient_ids must be a list of ids."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            ids = [int(i) for i in ingredient_ids]
        except (TypeError, ValueError):
            return Response(
                {"detail": "ingredient_ids must contain only numbers."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user if request.user.is_authenticated else None
        base = (
            self.get_queryset()
            .annotate(
                matched_count=Count(
                    "recipe_ingredients",
                    filter=Q(recipe_ingredients__ingredient_id__in=ids),
                    distinct=True,
                ),
                total_ingredients=Count("recipe_ingredients", distinct=True),
            )
            .filter(matched_count__gt=0)
        )
        base = base.prefetch_related(
            "recipe_ingredients__ingredient__category",
            "category",
            "author",
            "reviews",
        )

        matches = list(base)
        language = get_request_language(request)
        for recipe in matches:
            recipe_ingredient_items = list(recipe.recipe_ingredients.all())
            matched_items = [
                ri for ri in recipe_ingredient_items if ri.ingredient_id in ids
            ]
            missing_items = [
                ri for ri in recipe_ingredient_items if ri.ingredient_id not in ids
            ]
            recipe.matched_ingredients = [
                {
                    "id": ri.ingredient_id,
                    "name": localized(ri.ingredient, "name", language),
                }
                for ri in matched_items
            ]
            recipe.missing_ingredients = [
                {
                    "id": ri.ingredient_id,
                    "name": localized(ri.ingredient, "name", language),
                    "quantity": ri.display_quantity,
                    "unit": localized_choice("unit", ri.unit, language),
                }
                for ri in missing_items
            ]
            recipe.total_count = len(recipe_ingredient_items)
            if recipe.total_count:
                ratio = Decimal(recipe.matched_count) / Decimal(recipe.total_count)
                recipe.match_percentage = int(
                    (ratio * 100).quantize(Decimal("0"), rounding=ROUND_HALF_UP)
                )
            else:
                recipe.match_percentage = 0
        matches.sort(
            key=lambda r: (-r.match_percentage, -(r.avg_rating or 0), r.created_at)
        )

        serializer = RecipeListSerializer(matches, many=True, context={"request": request})
        results = []
        for recipe, data in zip(matches, serializer.data):
            data["matched_ingredients"] = recipe.matched_ingredients
            data["missing_ingredients"] = recipe.missing_ingredients
            data["match_percentage"] = recipe.match_percentage
            data["available_count"] = recipe.matched_count
            data["total_count"] = recipe.total_count
            results.append(data)

        selected_ingredients = [
            localized(ingredient, "name", language)
            for ingredient in Ingredient.objects.filter(pk__in=ids)
        ]
        return Response(
            {
                "selected_ingredients": selected_ingredients,
                "count": len(results),
                "results": results,
            },
            status=status.HTTP_200_OK,
        )
