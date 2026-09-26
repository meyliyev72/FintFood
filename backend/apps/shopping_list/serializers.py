from decimal import Decimal

from rest_framework import serializers

from apps.core.i18n import get_request_language, localized

from .models import ShoppingListItem
from .services import merge_item


class ShoppingListItemSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()
    quantity = serializers.DecimalField(
        max_digits=8, decimal_places=2, min_value=Decimal("0.01")
    )

    class Meta:
        model = ShoppingListItem
        fields = [
            "id",
            "name",
            "ingredient_id",
            "quantity",
            "unit",
            "category",
            "is_completed",
            "created_at",
        ]
        read_only_fields = ["id", "category", "created_at"]

    def get_category(self, obj) -> str:
        language = get_request_language(self.context.get("request"))
        return obj.category_name_for(language)

    def validate_name(self, value):
        if not (value or "").strip():
            raise serializers.ValidationError("Item name is required.")
        return value

    def create(self, validated_data):
        """Uses the merge logic instead of a plain insert."""
        request = self.context["request"]
        user = request.user
        language = get_request_language(request)
        ingredient = validated_data.pop("ingredient_id", None)
        items = merge_item(
            user,
            ingredient=ingredient,
            name=validated_data.pop("name", ""),
            quantity=validated_data.pop("quantity"),
            unit=validated_data.pop("unit", "pcs"),
            language=language,
        )
        item = items[0]
        if validated_data.get("is_completed"):
            item.is_completed = validated_data["is_completed"]
            item.save(update_fields=["is_completed"])
        return item


class AddFromRecipeSerializer(serializers.Serializer):
    recipe_id = serializers.IntegerField()
    ingredient_ids = serializers.ListField(child=serializers.IntegerField(), required=False)

    def create(self, validated_data):
        return validated_data