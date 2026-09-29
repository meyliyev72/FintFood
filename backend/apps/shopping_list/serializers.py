from decimal import Decimal

from rest_framework import serializers

from apps.core.i18n import get_request_language, localized_choice
from apps.core.models import Unit

from .models import ShoppingListItem
from .services import merge_item


class ShoppingListItemSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()
    quantity = serializers.DecimalField(
        max_digits=8, decimal_places=2, min_value=Decimal("0.01")
    )
    # Writable on the way in (a raw `Unit` value) and localized on the way out.
    # A SerializerMethodField would be read-only, which silently dropped the
    # submitted unit and made every merge look for `pcs`.
    unit = serializers.ChoiceField(choices=Unit.choices, required=False)
    #: Raw key, so a client can round-trip an edit without a label->code map.
    unit_code = serializers.CharField(read_only=True)

    class Meta:
        model = ShoppingListItem
        fields = [
            "id",
            "name",
            "ingredient_id",
            "quantity",
            "unit",
            "unit_code",
            "category",
            "is_completed",
            "created_at",
        ]
        read_only_fields = ["id", "category", "created_at"]

    def _language(self) -> str:
        return get_request_language(self.context.get("request"))

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Reads always get a label the user can read ("g", "dona", "г"), never
        # the raw enum key, while writes keep accepting the raw key.
        data["unit"] = localized_choice("unit", instance.unit, self._language())
        data["unit_code"] = str(instance.unit)
        return data

    def get_category(self, obj) -> str:
        return obj.category_name_for(self._language())

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
            unit=validated_data.pop("unit", Unit.PIECE),
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