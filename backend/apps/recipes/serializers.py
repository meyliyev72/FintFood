from decimal import Decimal

from django.core.files.images import get_image_dimensions
from django.db import models, transaction

from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.categories.serializers import CategorySerializer
from apps.ingredients.models import Ingredient
from apps.reviews.serializers import ReviewSerializer

from .models import (
    Difficulty,
    InstructionStep,
    Recipe,
    RecipeImage,
    RecipeIngredient,
    RecipeStatus,
    Report,
    Unit,
)


def round_half_up(value, places=1):
    from decimal import ROUND_HALF_UP, Decimal

    if value is None:
        return None
    return Decimal(value).quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP)


class RecipeIngredientSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source="ingredient.id", read_only=True)
    name = serializers.CharField(source="ingredient.name", read_only=True)
    slug = serializers.SlugField(source="ingredient.slug", read_only=True)
    category = serializers.StringRelatedField(
        source="ingredient.category", read_only=True
    )

    class Meta:
        model = RecipeIngredient
        fields = ["id", "name", "slug", "category", "quantity", "unit"]


class InstructionStepSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = InstructionStep
        fields = ["step_number", "instruction", "image"]

    def get_image(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url


class RecipeImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = RecipeImage
        fields = ["id", "url", "alt"]

    def get_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url


def cover_image_url(obj, request):
    if not obj.cover_image:
        return None
    url = obj.cover_image.url
    return request.build_absolute_uri(url) if request else url


class RecipeListSerializer(serializers.ModelSerializer):
    """Field set used by every card/grid view."""

    image = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    author = UserSerializer(read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.IntegerField(read_only=True)
    is_favorite = serializers.SerializerMethodField()
    ingredients_count = serializers.IntegerField(read_only=True)
    total_time = serializers.IntegerField(read_only=True)
    difficulty = serializers.CharField(source="get_difficulty_display", read_only=True)

    class Meta:
        model = Recipe
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "image",
            "category",
            "author",
            "cooking_time",
            "prep_time",
            "total_time",
            "servings",
            "difficulty",
            "average_rating",
            "review_count",
            "is_favorite",
            "ingredients_count",
            "created_at",
        ]

    def get_image(self, obj):
        return cover_image_url(obj, self.context.get("request"))

    def get_average_rating(self, obj):
        return round_half_up(obj.avg_rating)

    def get_is_favorite(self, obj):
        return bool(getattr(obj, "fav_count", 0))


class RecipeDetailSerializer(RecipeListSerializer):
    """Recipe full view: ingredients, steps, gallery, nutrition."""

    ingredients = RecipeIngredientSerializer(
        source="recipe_ingredients", many=True, read_only=True
    )
    steps = InstructionStepSerializer(many=True, read_only=True)
    images = RecipeImageSerializer(many=True, read_only=True)
    calories = serializers.IntegerField(read_only=True)
    protein = serializers.DecimalField(max_digits=6, decimal_places=1, read_only=True)
    carbs = serializers.DecimalField(max_digits=6, decimal_places=1, read_only=True)
    fat = serializers.DecimalField(max_digits=6, decimal_places=1, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)

    class Meta(RecipeListSerializer.Meta):
        fields = RecipeListSerializer.Meta.fields + [
            "ingredients",
            "steps",
            "images",
            "calories",
            "protein",
            "carbs",
            "fat",
            "reviews",
        ]


class IngredientInputSerializer(serializers.Serializer):
    ingredient_id = serializers.IntegerField(required=False, allow_null=True)
    name = serializers.CharField(required=False, allow_blank=True)
    quantity = serializers.DecimalField(
        max_digits=8, decimal_places=2, min_value=Decimal("0.01")
    )
    unit = serializers.ChoiceField(choices=Unit.choices)

    def validate(self, attrs):
        if not attrs.get("ingredient_id") and not attrs.get("name"):
            raise serializers.ValidationError(
                "Provide either an ingredient_id or a name."
            )
        return attrs


class StepInputSerializer(serializers.Serializer):
    step_number = serializers.IntegerField(min_value=1)
    instruction = serializers.CharField()
    image = serializers.ImageField(required=False, allow_null=True)


class RecipeWriteSerializer(serializers.ModelSerializer):
    """Create/update handler for recipes with dynamic nested lists.

    Accepts ingredients as [{ingredient_id|name, quantity, unit}] and
    steps as [{step_number, instruction, image}]. Images are optional
    extra gallery images and are replaced on each update.
    """

    id = serializers.IntegerField(read_only=True)
    slug = serializers.SlugField(read_only=True)
    cover_image = serializers.ImageField(read_only=True)
    ingredients = serializers.ListField(child=IngredientInputSerializer(), write_only=True)
    steps = serializers.ListField(child=StepInputSerializer(), write_only=True, required=False)
    extra_images = serializers.ListField(
        child=serializers.ImageField(), write_only=True, required=False
    )
    category_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    status = serializers.ChoiceField(
        choices=RecipeStatus.choices, default=RecipeStatus.PUBLISHED
    )

    class Meta:
        model = Recipe
        fields = [
            "id",
            "slug",
            "title",
            "description",
            "cover_image",
            "category_id",
            "cooking_time",
            "prep_time",
            "servings",
            "difficulty",
            "status",
            "calories",
            "protein",
            "carbs",
            "fat",
            "ingredients",
            "steps",
            "extra_images",
        ]

    def validate_title(self, value):
        if len(value) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters.")
        return value

    def validate(self, attrs):
        if not attrs.get("ingredients"):
            raise serializers.ValidationError(
                {"ingredients": "At least one ingredient is required."}
            )
        steps = attrs.get("steps") or []
        if not steps:
            raise serializers.ValidationError(
                {"steps": "At least one instruction step is required."}
            )
        for field in ("cooking_time", "prep_time", "servings"):
            value = attrs.get(field)
            if value is not None and value <= 0:
                raise serializers.ValidationError(
                    {field: "Must be a positive number."}
                )
        return attrs

    def validate_cover_image(self, image):
        return validate_uploaded_image(image)

    def _resolve_ingredient(self, data):
        if data.get("ingredient_id"):
            try:
                return Ingredient.objects.get(pk=data["ingredient_id"])
            except Ingredient.DoesNotExist:
                raise serializers.ValidationError(
                    {"ingredients": f"Unknown ingredient id {data['ingredient_id']}."}
                )
        name = (data.get("name") or "").strip()
        ingredient = Ingredient.objects.filter(name__iexact=name).first()
        if ingredient:
            return ingredient
        from apps.ingredients.models import IngredientCategory

        other, _ = IngredientCategory.objects.get_or_create(
            slug="other", defaults={"name": "Other"}
        )
        return Ingredient.objects.create(name=name, category=other)

    @transaction.atomic
    def create(self, validated_data):
        ingredients_data = validated_data.pop("ingredients")
        steps_data = validated_data.pop("steps", [])
        extra_images = validated_data.pop("extra_images", [])
        category_id = validated_data.pop("category_id", None)

        if category_id:
            from apps.categories.models import Category

            validated_data["category"] = (
                Category.objects.filter(pk=category_id).first()
            )
        validated_data["author"] = self.context["request"].user
        recipe = Recipe.objects.create(**validated_data)
        self._populate(recipe, ingredients_data, steps_data, extra_images)
        return recipe

    @transaction.atomic
    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop("ingredients", None)
        steps_data = validated_data.pop("steps", None)
        extra_images = validated_data.pop("extra_images", None)
        category_id = validated_data.pop("category_id", None)

        if category_id is not None:
            from apps.categories.models import Category

            validated_data["category"] = Category.objects.filter(pk=category_id).first()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if ingredients_data is not None:
            instance.recipe_ingredients.all().delete()
            self._populate_ingredients(instance, ingredients_data)
        if steps_data is not None:
            instance.steps.all().delete()
            self._populate_steps(instance, steps_data)
        if extra_images is not None and extra_images:
            for image in extra_images:
                RecipeImage.objects.create(recipe=instance, image=image)
        return instance

    def _populate(self, recipe, ingredients_data, steps_data, extra_images):
        self._populate_ingredients(recipe, ingredients_data)
        self._populate_steps(recipe, steps_data)
        for image in extra_images:
            RecipeImage.objects.create(recipe=recipe, image=image, alt="")

    def _populate_ingredients(self, recipe, ingredients_data):
        for data in ingredients_data:
            ingredient = self._resolve_ingredient(data)
            RecipeIngredient.objects.create(
                recipe=recipe,
                ingredient=ingredient,
                quantity=data["quantity"],
                unit=data["unit"],
            )

    def _populate_steps(self, recipe, steps_data):
        for data in steps_data:
            image = data.get("image")
            InstructionStep.objects.create(
                recipe=recipe,
                step_number=data["step_number"],
                instruction=data["instruction"],
                image=image,
            )


class ReportSerializer(serializers.ModelSerializer):
    """Report a recipe or a review for moderation."""

    class Content(models.TextChoices):
        RECIPE = "recipe", "recipe"
        REVIEW = "review", "review"

    content_type = serializers.ChoiceField(choices=Content.choices, write_only=True)
    object_id = serializers.IntegerField(write_only=True)
    status = serializers.CharField(source="get_status_display", read_only=True)
    reported_by = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            "id",
            "reason",
            "detail",
            "status",
            "reported_by",
            "content_type",
            "object_id",
            "created_at",
        ]
        read_only_fields = ["id", "status", "reported_by", "created_at"]

    def get_reported_by(self, obj):
        return {
            "id": obj.reported_by_id,
            "name": obj.reported_by.display_name,
        }

    def create(self, validated_data):
        content_type_name = validated_data.pop("content_type")
        object_id = validated_data.pop("object_id")
        model_map = {
            self.Content.RECIPE: Recipe,
            self.Content.REVIEW: None,  # resolved lazily to avoid import cycle
        }
        from apps.reviews.models import Review

        model_map[self.Content.REVIEW] = Review
        model = model_map[content_type_name]
        if model is None or not model.objects.filter(pk=object_id).exists():
            raise serializers.ValidationError(
                {"object_id": "The reported content does not exist."}
            )
        validated_data["reported_by"] = self.context["request"].user
        from django.contrib.contenttypes.models import ContentType

        validated_data["content_type"] = ContentType.objects.get_for_model(model)
        validated_data["object_id"] = object_id
        return super().create(validated_data)


def validate_uploaded_image(image):
    """Client- and server-side friendly image validation."""
    max_size = 5 * 1024 * 1024
    allowed = {"jpg", "jpeg", "png", "webp"}
    if image.size > max_size:
        raise serializers.ValidationError("Image must be 5 MB or smaller.")
    ext = (image.name or "").lower().rsplit(".", 1)[-1]
    if ext not in allowed:
        raise serializers.ValidationError("Image must be JPG, PNG or WEBP.")
    try:
        dims = get_image_dimensions(image)
        if dims and (dims[0] < 100 or dims[1] < 100):
            raise serializers.ValidationError(
                "Image is too small (minimum 100x100 px)."
            )
    except (ValueError, TypeError):
        raise serializers.ValidationError("Could not read image dimensions.")
    return image