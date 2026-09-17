from django.db.models import Count, Q

from rest_framework.generics import ListAPIView, RetrieveAPIView

from .models import Category
from .serializers import CategorySerializer

PUBLISHED = Q(recipes__status="published")


class CategoryListView(ListAPIView):
    serializer_class = CategorySerializer
    pagination_class = None

    def get_queryset(self):
        return (
            Category.objects.annotate(
                recipe_count=Count("recipes", filter=PUBLISHED, distinct=True)
            )
            .order_by("name")
            .distinct()
        )


class CategoryDetailView(RetrieveAPIView):
    lookup_field = "slug"
    lookup_url_kwarg = "slug"
    serializer_class = CategorySerializer
    pagination_class = None

    def get_queryset(self):
        return (
            Category.objects.annotate(
                recipe_count=Count("recipes", filter=PUBLISHED, distinct=True)
            ).distinct()
        )