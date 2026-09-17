from decimal import Decimal

from rest_framework import serializers

from .models import ShoppingListItem
from .services import merge_item


class ShoppingListItemSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source="category_name", read_only=True)
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

    def validate_name(self, value):
        if not (value or "").strip():
            raise serializers.ValidationError("Item name is required.")
        return value

    def create(self, validated_data):
        """Uses the merge logic instead of a plain insert."""
        user = self.context["request"].user
        ingredient = validated_data.pop("ingredient_id", None)
        items = merge_item(
            user,
            ingredient=ingredient,
            name=validated_data.pop("name", ""),
            quantity=validated_data.pop("quantity"),
            unit=validated_data.pop("unit", "pcs"),
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