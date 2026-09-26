from rest_framework import serializers

from apps.core.i18n import get_request_language, localized

from .models import Ingredient, IngredientCategory


class IngredientCategorySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    name_en = serializers.CharField(read_only=True)

    class Meta:
        model = IngredientCategory
        fields = ["id", "name", "name_en", "slug"]

    def get_name(self, obj) -> str:
        return localized(obj, "name", get_request_language(self.context.get("request")))


class IngredientSerializer(serializers.ModelSerializer):
    category = IngredientCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category", write_only=True, queryset=IngredientCategory.objects.all(),
        required=False, allow_null=True,
    )
    name = serializers.SerializerMethodField()
    name_en = serializers.CharField(read_only=True)

    class Meta:
        model = Ingredient
        fields = ["id", "name", "name_en", "slug", "category", "category_id"]

    def get_name(self, obj) -> str:
        return localized(obj, "name", get_request_language(self.context.get("request")))

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
