from django.contrib import admin

from .models import ShoppingListItem


@admin.register(ShoppingListItem)
class ShoppingListItemAdmin(admin.ModelAdmin):
    list_display = ["name", "user", "quantity", "unit", "is_completed", "created_at"]
    list_filter = ["is_completed", "unit"]
    search_fields = ["name", "user__email"]
    list_select_related = ["user", "ingredient"]