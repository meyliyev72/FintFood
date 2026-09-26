from django.db import models
from django.utils.text import slugify

from apps.categories.models import TranslatedNameMixin
from apps.core.models import SluggedModel, TimeStampedModel


class IngredientCategory(TimeStampedModel, SluggedModel, TranslatedNameMixin):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "ingredient categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Ingredient(TimeStampedModel, SluggedModel, TranslatedNameMixin):
    name = models.CharField(max_length=120, db_index=True)
    category = models.ForeignKey(
        IngredientCategory,
        on_delete=models.CASCADE,
        related_name="ingredients",
    )

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name) or "ingredient"
        super().save(*args, **kwargs)