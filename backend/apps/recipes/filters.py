import django_filters
from django.db.models import F, Q

from .models import Difficulty, Recipe

NON_VEGETARIAN_CATEGORIES = ("meat", "chicken", "fish")


class RecipeFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(
        field_name="category__slug", lookup_expr="iexact", label="Category slug"
    )
    difficulty = django_filters.CharFilter(
        field_name="difficulty", lookup_expr="iexact"
    )
    query = django_filters.CharFilter(method="filter_query", label="Full-text search")
    max_time = django_filters.NumberFilter(method="filter_max_time", label="Max total minutes")
    time_range = django_filters.ChoiceFilter(
        method="filter_time_range",
        choices=[
            ("under-15", "Under 15 min"),
            ("15-30", "15-30 min"),
            ("30-60", "30-60 min"),
            ("60+", "60+ min"),
        ],
    )
    diet = django_filters.CharFilter(method="filter_diet")

    class Meta:
        model = Recipe
        fields = ["category", "difficulty", "query", "max_time", "time_range", "diet"]

    def filter_query(self, queryset, name, value):
        """Case-insensitive match across title, description, category, ingredients."""
        return queryset.filter(
            Q(title__icontains=value)
            | Q(description__icontains=value)
            | Q(category__name__icontains=value)
            | Q(recipe_ingredients__ingredient__name__icontains=value)
        ).distinct()

    def filter_max_time(self, queryset, name, value):
        return self._by_total_time(queryset, max_time=value)

    def filter_time_range(self, queryset, name, value):
        ranges = {
            "under-15": (0, 15),
            "15-30": (15, 30),
            "30-60": (30, 60),
            "60+": (60, None),
        }
        low, high = ranges[value]
        return self._by_total_time(queryset, low=low, high=high)

    def _by_total_time(self, queryset, low=None, high=None, max_time=None):
        annotated = queryset.annotate(_total=F("prep_time") + F("cooking_time"))
        if max_time is not None:
            return annotated.filter(_total__lte=max_time)
        if low is not None:
            annotated = annotated.filter(_total__gt=low)
        if high is not None:
            annotated = annotated.filter(_total__lte=high)
        return annotated

    def filter_diet(self, queryset, name, value):
        if value == "vegetarian":
            return queryset.exclude(
                recipe_ingredients__ingredient__category__slug__in=NON_VEGETARIAN_CATEGORIES
            ).distinct()
        if value == "healthy":
            return queryset.filter(
                calories__isnull=False
            ).filter(calories__lte=500).distinct()
        if value == "high-protein":
            return queryset.filter(protein__isnull=False).filter(protein__gte=20).distinct()
        return queryset