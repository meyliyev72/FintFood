from django.db import transaction

from rest_framework import serializers

from apps.recipes.models import Recipe

from .models import Review


class ReviewUserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(source="display_name", read_only=True)
    avatar = serializers.SerializerMethodField()

    def get_avatar(self, obj):
        if obj.avatar:
            request = self.context.get("request")
            url = obj.avatar.url
            return request.build_absolute_uri(url) if request else url
        return None


class ReviewSerializer(serializers.ModelSerializer):
    user = ReviewUserSerializer(read_only=True)
    recipe_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Review
        fields = ["id", "recipe_id", "rating", "comment", "created_at", "updated_at", "user"]
        read_only_fields = ["id", "created_at", "updated_at", "user"]

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_recipe_id(self, value):
        if not Recipe.objects.filter(pk=value, status="published").exists():
            raise serializers.ValidationError("Recipe not found.")
        return value

    def validate(self, attrs):
        if not attrs.get("comment") and self.instance is None:
            raise serializers.ValidationError(
                {"comment": "Please add a short comment to your review."}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        user = self.context["request"].user
        recipe = Recipe.objects.get(pk=validated_data.pop("recipe_id"))
        review, _ = Review.objects.update_or_create(
            recipe=recipe,
            user=user,
            defaults={
                "rating": validated_data["rating"],
                "comment": validated_data.get("comment", ""),
            },
        )
        return review

    def update(self, instance, validated_data):
        validated_data.pop("recipe_id", None)
        return super().update(instance, validated_data)