from django.db import models
from django.db.models import Avg, Count, F, Q, Value


class RecipeQuerySet(models.QuerySet):
    def published(self):
        return self.filter(status="published")

    def with_stats(self, user=None):
        """Annotate aggregation fields consumed by the list/detail serializers."""
        qs = self.annotate(
            avg_rating=Avg("reviews__rating"),
            review_count=Count("reviews", distinct=True),
            ingredients_count=Count("recipe_ingredients", distinct=True),
            total_time=F("prep_time") + F("cooking_time"),
        )
        if user is not None and user.is_authenticated:
            qs = qs.annotate(
                fav_count=Count(
                    "favorites", filter=Q(favorites__user=user), distinct=True
                )
            )
        else:
            qs = qs.annotate(fav_count=Value(0))
        return qs


class RecipeManager(models.Manager.from_queryset(RecipeQuerySet)):
    pass