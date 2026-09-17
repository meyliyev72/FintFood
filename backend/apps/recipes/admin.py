from django.contrib import admin
from django.contrib.contenttypes.admin import GenericTabularInline

from .models import (
    InstructionStep,
    Recipe,
    RecipeImage,
    RecipeIngredient,
    RecipeView,
    Report,
)


class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 1
    autocomplete_fields = ["ingredient"]


class InstructionStepInline(admin.TabularInline):
    model = InstructionStep
    extra = 1


class RecipeImageInline(admin.TabularInline):
    model = RecipeImage
    extra = 0


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "author",
        "category",
        "difficulty",
        "status",
        "cooking_time",
        "created_at",
    ]
    list_filter = ["status", "difficulty", "category", "created_at"]
    search_fields = ["title", "description", "author__email"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ["slug", "created_at", "updated_at"]
    inlines = [
        RecipeIngredientInline,
        InstructionStepInline,
        RecipeImageInline,
    ]
    list_select_related = ["author", "category"]
    actions = ["publish_recipes", "reject_recipes"]

    @admin.action(description="Publish selected recipes")
    def publish_recipes(self, request, queryset):
        updated = queryset.update(status="published")
        self.message_user(request, f"{updated} recipe(s) published.")

    @admin.action(description="Reject selected recipes")
    def reject_recipes(self, request, queryset):
        updated = queryset.update(status="rejected")
        self.message_user(request, f"{updated} recipe(s) rejected.")


@admin.register(RecipeView)
class RecipeViewAdmin(admin.ModelAdmin):
    list_display = ["user", "recipe", "viewed_at"]
    search_fields = ["user__email", "recipe__title"]


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ["id", "reason", "status", "reported_by", "created_at"]
    list_filter = ["status", "reason"]
    search_fields = ["reason", "detail", "reported_by__email"]
    readonly_fields = ["content_type", "object_id", "reported_by", "created_at"]
    actions = ["mark_reviewing", "mark_resolved", "mark_dismissed"]

    @admin.action(description="Mark as reviewing")
    def mark_reviewing(self, request, queryset):
        queryset.update(status="reviewing")

    @admin.action(description="Mark as resolved")
    def mark_resolved(self, request, queryset):
        queryset.update(status="resolved")

    @admin.action(description="Dismiss reports")
    def mark_dismissed(self, request, queryset):
        queryset.update(status="dismissed")