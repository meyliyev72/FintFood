from django.db import models


class Unit(models.TextChoices):
    GRAM = "g", "g"
    KILOGRAM = "kg", "kg"
    MILLILITER = "ml", "ml"
    LITER = "l", "l"
    PIECE = "pcs", "pcs"
    TABLESPOON = "tbsp", "tbsp"
    TEASPOON = "tsp", "tsp"
    CUP = "cup", "cup"
    CLOVE = "clove", "clove"
    BUNCH = "bunch", "bunch"
    PINCH = "pinch", "pinch"
    SLICE = "slice", "slice"
    PACK = "pack", "pack"
    CAN = "can", "can"


class TimeStampedModel(models.Model):
    """Abstract model adding created_at / updated_at timestamps."""

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SluggedModel(models.Model):
    """Abstract model adding a unique slug field."""

    slug = models.SlugField(max_length=100, unique=True, db_index=True)

    class Meta:
        abstract = True