from django.db.models import Count, Q
from rest_framework import serializers
from rest_framework.generics import ListAPIView

from .models import Ingredient, IngredientCategory
from .serializers import IngredientCategorySerializer, IngredientSerializer


class IngredientListView(ListAPIView):
    serializer_class = IngredientSerializer
    pagination_class = None
    search_fields = ["name"]
    ordering_fields = ["name", "usage_count"]

    def get_queryset(self):
        # `usage_count` is what the home page ranks by to pick the popular
        # chips, so it is annotated here rather than guessed client-side.
        queryset = Ingredient.objects.select_related("category").annotate(
            usage_count=Count(
                "recipe_usages",
                filter=Q(recipe_usages__recipe__status="published"),
                distinct=True,
            )
        )
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category__slug=category)
        return queryset


class IngredientCategoryListView(ListAPIView):
    serializer_class = IngredientCategorySerializer
    pagination_class = None
    queryset = IngredientCategory.objects.all()