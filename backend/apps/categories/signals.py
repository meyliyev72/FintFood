from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils.text import slugify

from .models import Category


@receiver(pre_save, sender=Category)
def ensure_category_slug(sender, instance, **kwargs):
    if not instance.slug:
        instance.slug = slugify(instance.name) or "category"