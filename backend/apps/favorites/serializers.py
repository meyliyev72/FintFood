from django.db import transaction

from rest_framework import serializers

from apps.recipes.models import Recipe
from apps.recipes.serializers import RecipeListSerializer

from .models import Favorite


class FavoriteSerializer(serializers.ModelSerializer):
    recipe = RecipeListSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ["id", "recipe", "created_at"]
        read_only_fields = ["id", "created_at"]


class FavoriteToggleSerializer(serializers.Serializer):
    """Toggles the favorite state and returns the new state."""

    recipe_id = serializers.IntegerField()

    def validate_recipe_id(self, value):
        if not Recipe.objects.filter(pk=value, status="published").exists():
            raise serializers.ValidationError("Recipe not found.")
        return value

    def save(self, **kwargs):
        user = self.context["request"].user
        recipe = Recipe.objects.get(pk=self.validated_data["recipe_id"])
        with transaction.atomic():
            favorite, created = Favorite.objects.get_or_create(
                user=user, recipe=recipe
            )
            if not created:
                favorite.delete()
        return {"is_favorite": created, "recipe_id": recipe.id}