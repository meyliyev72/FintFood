from rest_framework.generics import ListAPIView

from .models import Ingredient, IngredientCategory
from .serializers import IngredientCategorySerializer, IngredientSerializer


class IngredientListView(ListAPIView):
    serializer_class = IngredientSerializer
    pagination_class = None
    search_fields = ["name"]
    ordering_fields = ["name"]

    def get_queryset(self):
        queryset = Ingredient.objects.select_related("category").all()
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category__slug=category)
        return queryset


class IngredientCategoryListView(ListAPIView):
    serializer_class = IngredientCategorySerializer
    pagination_class = None
    queryset = IngredientCategory.objects.all()