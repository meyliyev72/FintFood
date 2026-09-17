from django.conf import settings
from django.db import models


class Review(models.Model):
    recipe = models.ForeignKey(
        "recipes.Recipe", on_delete=models.CASCADE, related_name="reviews"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews"
    )
    rating = models.PositiveSmallIntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["recipe", "user"], name="unique_recipe_user_review")
        ]
        indexes = [models.Index(fields=["recipe", "-created_at"])]

    def __str__(self):
        return f"{self.rating}★ by {self.user} on {self.recipe}"