from django.conf import settings
from django.db import models

from apps.core.models import Unit


class ShoppingListItem(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shopping_items"
    )
    ingredient = models.ForeignKey(
        "ingredients.Ingredient",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="shopping_items",
    )
    name = models.CharField(max_length=150)
    quantity = models.DecimalField(max_digits=8, decimal_places=2, default=1)
    unit = models.CharField(max_length=10, choices=Unit.choices, default=Unit.PIECE)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_completed", "name"]
        indexes = [models.Index(fields=["user", "is_completed"])]

    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit})"

    @property
    def display_quantity(self) -> str:
        qty = self.quantity
        if qty == qty.to_integral_value():
            return str(int(qty))
        return f"{qty.normalize():f}"

    @property
    def category_name(self) -> str:
        if self.ingredient_id and self.ingredient.category_id:
            return self.ingredient.category.name
        return "Other"

    @property
    def unit_display(self) -> str:
        return self.get_unit_display()