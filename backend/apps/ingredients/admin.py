from django.contrib import admin

from .models import Ingredient, IngredientCategory


@admin.register(IngredientCategory)
class IngredientCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "slug"]
    list_filter = ["category"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ("name",)}