from django.db import models

from apps.core.models import SluggedModel, TimeStampedModel


class Category(TimeStampedModel, SluggedModel):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="categories/", blank=True, null=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["name"]

    def __str__(self):
        return self.name