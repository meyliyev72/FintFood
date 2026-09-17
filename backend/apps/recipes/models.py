from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.text import slugify

from apps.core.models import SluggedModel, TimeStampedModel, Unit
from .managers import RecipeManager


class Difficulty(models.TextChoices):
    EASY = "easy", "Easy"
    MEDIUM = "medium", "Medium"
    HARD = "hard", "Hard"


class RecipeStatus(models.TextChoices):
    DRAFT = "draft", "Draft"
    PENDING = "pending", "Pending review"
    PUBLISHED = "published", "Published"
    REJECTED = "rejected", "Rejected"


class Recipe(TimeStampedModel, SluggedModel):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to="recipes/covers/", blank=True, null=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recipes",
    )
    category = models.ForeignKey(
        "categories.Category",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="recipes",
    )
    cooking_time = models.PositiveIntegerField(help_text="Cooking time in minutes")
    prep_time = models.PositiveIntegerField(default=0, help_text="Prep time in minutes")
    servings = models.PositiveIntegerField(default=1)
    difficulty = models.CharField(
        max_length=10, choices=Difficulty.choices, default=Difficulty.MEDIUM
    )
    status = models.CharField(
        max_length=10, choices=RecipeStatus.choices, default=RecipeStatus.PUBLISHED
    )
    # Nutrition — all optional; never fabricated in the UI.
    calories = models.PositiveIntegerField(blank=True, null=True)
    protein = models.DecimalField(
        max_digits=6, decimal_places=1, blank=True, null=True, help_text="grams"
    )
    carbs = models.DecimalField(
        max_digits=6, decimal_places=1, blank=True, null=True, help_text="grams"
    )
    fat = models.DecimalField(
        max_digits=6, decimal_places=1, blank=True, null=True, help_text="grams"
    )

    ingredients = models.ManyToManyField(
        "ingredients.Ingredient", through="RecipeIngredient", related_name="recipes"
    )

    objects = RecipeManager()

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["category", "status"]),
            models.Index(fields=["status", "-created_at"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        base = slugify(self.title) or "recipe"
        candidate = base
        suffix = 2
        while Recipe.objects.filter(slug=candidate).exclude(pk=self.pk).exists():
            candidate = f"{base}-{suffix}"
            suffix += 1
        self.slug = candidate
        super().save(*args, **kwargs)


class RecipeImage(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="recipes/gallery/")
    alt = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return f"{self.recipe.title} image #{self.pk}"


class RecipeIngredient(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name="recipe_ingredients")
    ingredient = models.ForeignKey(
        "ingredients.Ingredient", on_delete=models.CASCADE, related_name="recipe_usages"
    )
    quantity = models.DecimalField(max_digits=8, decimal_places=2, default=1)
    unit = models.CharField(max_length=10, choices=Unit.choices, default=Unit.PIECE)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(
                fields=["recipe", "ingredient"], name="unique_recipe_ingredient"
            )
        ]

    def __str__(self):
        return f"{self.recipe.title} — {self.ingredient.name}"

    @property
    def display_quantity(self) -> str:
        qty = self.quantity
        if qty == qty.to_integral_value():
            return str(int(qty))
        return f"{qty.normalize():f}"


class InstructionStep(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name="steps")
    step_number = models.PositiveIntegerField()
    instruction = models.TextField()
    image = models.ImageField(upload_to="recipes/steps/", blank=True, null=True)

    class Meta:
        ordering = ["step_number"]
        constraints = [
            models.UniqueConstraint(
                fields=["recipe", "step_number"], name="unique_recipe_step"
            )
        ]

    def __str__(self):
        return f"{self.recipe.title} step {self.step_number}"


class RecipeView(TimeStampedModel):
    """Lightweight recently-viewed tracking for authenticated users."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recipe_views"
    )
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name="views")

    class Meta:
        ordering = ["-viewed_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "recipe"], name="unique_user_recipe_view")
        ]

    viewed_at = models.DateTimeField(auto_now=True)


class Report(TimeStampedModel):
    """Moderation report flagging a recipe or a review."""

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        REVIEWING = "reviewing", "Reviewing"
        RESOLVED = "resolved", "Resolved"
        DISMISSED = "dismissed", "Dismissed"

    reason = models.CharField(max_length=200)
    detail = models.TextField(blank=True)
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.OPEN
    )
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="reports",
    )
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveBigIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report #{self.pk} ({self.get_status_display()})"