from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.text import slugify

from .managers import UserManager


class User(AbstractUser):
    """Custom user authenticated by email (no username login)."""

    username = None
    email = models.EmailField(unique=True, db_index=True)
    name = models.CharField(max_length=150, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    bio = models.TextField(blank=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        ordering = ["-date_joined"]

    def __str__(self):
        return self.name or self.email

    @property
    def display_name(self) -> str:
        return self.name or self.email.split("@")[0]

    def save(self, *args, **kwargs):
        if not self.name:
            self.name = self.email.split("@")[0]
        super().save(*args, **kwargs)