from django.db import models

from apps.core.models import SluggedModel, TimeStampedModel


class TranslatedNameMixin(models.Model):
    """Adds optional per-language translations for a ``name`` column.

    Catalog labels (categories, ingredient categories, ingredients) are shown in
    navigation and filter controls, so they ship with uz/ru/en translations.
    ``name`` stays the fallback for untranslated or admin-edited rows.
    """

    name_uz = models.CharField(max_length=120, blank=True, default="")
    name_ru = models.CharField(max_length=120, blank=True, default="")
    name_en = models.CharField(max_length=120, blank=True, default="")

    class Meta:
        abstract = True


class Category(TimeStampedModel, SluggedModel, TranslatedNameMixin):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    description_uz = models.TextField(blank=True, default="")
    description_ru = models.TextField(blank=True, default="")
    description_en = models.TextField(blank=True, default="")
    image = models.ImageField(upload_to="categories/", blank=True, null=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["name"]

    def __str__(self):
        return self.name