from rest_framework import serializers

from .models import Ingredient, IngredientCategory


class IngredientCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = IngredientCategory
        fields = ["id", "name", "slug"]


class IngredientSerializer(serializers.ModelSerializer):
    category = IngredientCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category", write_only=True, queryset=IngredientCategory.objects.all(),
        required=False, allow_null=True,
    )

    class Meta:
        model = Ingredient
        fields = ["id", "name", "slug", "category", "category_id"]

    def create(self, validated_data):
        """Get-or-create free-text ingredients by name at write time."""
        name = validated_data.get("name", "").strip()
        if not name:
            raise serializers.ValidationError({"name": "This field is required."})
        existing = Ingredient.objects.filter(name__iexact=name).first()
        if existing:
            return existing
        category = validated_data.get("category")
        if category is None:
            category, _ = IngredientCategory.objects.get_or_create(
                slug="other", defaults={"name": "Other"}
            )
        validated_data["category"] = category
        return super().create(validated_data)