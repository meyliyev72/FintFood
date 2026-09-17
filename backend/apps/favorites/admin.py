from django.contrib import admin

from .models import Favorite


@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ["user", "recipe", "created_at"]
    search_fields = ["user__email", "recipe__title"]
    list_filter = ["created_at"]