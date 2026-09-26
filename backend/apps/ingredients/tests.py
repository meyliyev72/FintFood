from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils.text import slugify

from apps.categories.models import Category
from apps.ingredients.models import Ingredient, IngredientCategory
from apps.recipes.models import Recipe, RecipeIngredient, RecipeStatus

User = get_user_model()


def make_ingredient(name, cat_slug="vegetables"):
    cat, _ = IngredientCategory.objects.get_or_create(
        slug=cat_slug, defaults={"name": cat_slug.title()}
    )
    ing, _ = Ingredient.objects.get_or_create(
        slug=slugify(name) or "ingredient",
        defaults={"name": name, "category": cat},
    )
    return ing


class IngredientUsageCountTests(TestCase):
    """`usage_count` powers the home page's popular-ingredient chips (§5.2)."""

    def setUp(self):
        self.author = User.objects.create_user(
            email="chef@example.com", password="StrongPass123!"
        )
        self.category = Category.objects.create(name="Dinner", slug="dinner")
        self.onion = make_ingredient("Onion")
        self.salt = make_ingredient("Salt", "spices")

        for title in ("Soup", "Stew"):
            recipe = Recipe.objects.create(
                title=title,
                slug=slugify(title),
                description="Tasty.",
                author=self.author,
                category=self.category,
                cooking_time=20,
                prep_time=5,
                servings=2,
                status=RecipeStatus.PUBLISHED,
            )
            RecipeIngredient.objects.create(recipe=recipe, ingredient=self.onion, quantity=1)

    def test_usage_count_counts_published_recipes_only(self):
        draft = Recipe.objects.create(
            title="Draft",
            slug="draft",
            description="Hidden.",
            author=self.author,
            category=self.category,
            cooking_time=5,
            prep_time=5,
            servings=1,
            status=RecipeStatus.DRAFT,
        )
        RecipeIngredient.objects.create(recipe=draft, ingredient=self.onion, quantity=1)

        response = self.client.get("/api/v1/ingredients/")
        self.assertEqual(response.status_code, 200)

        by_slug = {row["slug"]: row for row in response.json()}
        self.assertEqual(by_slug["onion"]["usage_count"], 2)
        self.assertEqual(by_slug["salt"]["usage_count"], 0)

    def test_localized_name_and_usage_count_travel_together(self):
        self.onion.name_uz = "Piyoz"
        self.onion.save(update_fields=["name_uz"])

        response = self.client.get("/api/v1/ingredients/?lang=uz")
        by_slug = {row["slug"]: row for row in response.json()}

        self.assertEqual(by_slug["onion"]["name"], "Piyoz")
        self.assertEqual(by_slug["onion"]["usage_count"], 2)

    def test_category_filter_still_applies(self):
        response = self.client.get("/api/v1/ingredients/?category=spices")
        self.assertEqual([row["slug"] for row in response.json()], ["salt"])


class IngredientCategoryEndpointTests(TestCase):
    def test_list_is_localized(self):
        cat = IngredientCategory.objects.create(
            name="Vegetables", slug="vegetables", name_ru="Овощи"
        )

        response = self.client.get("/api/v1/ingredients/categories/?lang=ru")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["name"], "Овощи")
        self.assertEqual(Ingredient.objects.count(), 0)
        self.assertEqual(cat.slug, "vegetables")
