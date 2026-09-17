from django.contrib import admin

from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["recipe", "user", "rating", "created_at"]
    list_filter = ["rating", "created_at"]
    search_fields = ["recipe__title", "user__email", "comment"]
    list_select_related = ["recipe", "user"]