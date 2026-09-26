"""Tests for locale-aware catalog naming (§3.3).

Category, ingredient-category and ingredient labels appear in navigation and
filter controls, so the API must resolve them per request language.
"""

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.categories.models import Category
from apps.core.i18n import localized, localized_choice, normalize_language
from apps.ingredients.models import Ingredient, IngredientCategory
from apps.recipes.models import Difficulty, Recipe, RecipeIngredient, RecipeStatus

User = get_user_model()


class NormalizeLanguageTests(TestCase):
    def test_defaults_to_uz_for_unknown_tags(self):
        self.assertEqual(normalize_language("fr"), "uz")
        self.assertEqual(normalize_language(""), "uz")
        self.assertEqual(normalize_language(None), "uz")

    def test_maps_regional_tags_to_primary_language(self):
        self.assertEqual(normalize_language("ru-RU"), "ru")
        self.assertEqual(normalize_language("en-GB"), "en")
        self.assertEqual(normalize_language("uz_UZ"), "uz")


class LocalizedFieldTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name="Breakfast",
            slug="breakfast",
            description="Morning meals.",
            description_uz="Ertalabki taomlar.",
            description_ru="Утренние блюда.",
            description_en="Morning meals.",
            name_uz="Nonushta",
            name_ru="Завтрак",
            name_en="Breakfast",
        )

    def test_uses_language_column_when_present(self):
        self.assertEqual(localized(self.category, "name", "ru"), "Завтрак")
        self.assertEqual(localized(self.category, "name", "uz"), "Nonushta")

    def test_falls_back_to_english_then_base(self):
        self.category.name_ru = ""
        self.assertEqual(localized(self.category, "name", "ru"), "Breakfast")

        self.category.name_en = ""
        self.assertEqual(localized(self.category, "name", "ru"), "Breakfast")

    def test_localizes_descriptions(self):
        self.assertEqual(
            localized(self.category, "description", "uz"), "Ertalabki taomlar."
        )


class CatalogLanguageAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(
            name="Breakfast",
            slug="breakfast",
            name_uz="Nonushta",
            name_ru="Завтрак",
            name_en="Breakfast",
        )
        self.ingredient_category = IngredientCategory.objects.create(
            name="Vegetables",
            slug="vegetables",
            name_uz="Sabzavotlar",
            name_ru="Овощи",
            name_en="Vegetables",
        )
        self.ingredient = Ingredient.objects.create(
            name="Potato",
            slug="potato",
            category=self.ingredient_category,
            name_uz="Kartoshka",
            name_ru="Картофель",
            name_en="Potato",
        )

    def test_query_param_selects_language(self):
        for lang, expected in (("uz", "Nonushta"), ("ru", "Завтрак"), ("en", "Breakfast")):
            response = self.client.get(f"/api/v1/categories/?lang={lang}")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data[0]["name"], expected)
            # The canonical English name always ships alongside for reference.
            self.assertEqual(response.data[0]["name_en"], "Breakfast")

    def test_defaults_to_uz_without_lang(self):
        response = self.client.get("/api/v1/categories/")
        self.assertEqual(response.data[0]["name"], "Nonushta")

    def test_accept_language_header_is_used(self):
        response = self.client.get("/api/v1/categories/", HTTP_ACCEPT_LANGUAGE="ru-RU,ru;q=0.9")
        self.assertEqual(response.data[0]["name"], "Завтрак")

    def test_ingredient_names_are_localized(self):
        for lang, expected in (("uz", "Kartoshka"), ("ru", "Картофель"), ("en", "Potato")):
            response = self.client.get(f"/api/v1/ingredients/?lang={lang}")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data[0]["name"], expected)

    def test_ingredient_categories_are_localized(self):
        response = self.client.get("/api/v1/ingredients/categories/?lang=ru")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["name"], "Овощи")


class LocalizedChoiceTests(TestCase):
    """Enum labels must honour ?lang= too.

    get_difficulty_display() / get_unit_display() rely on Django's own active
    translation, but LocaleMiddleware is not installed, so they would always
    return the hardcoded English label and ignore the requested language.
    """

    def test_difficulty_labels(self):
        self.assertEqual(localized_choice("difficulty", "easy", "uz"), "Oson")
        self.assertEqual(localized_choice("difficulty", "easy", "ru"), "Лёгкая")
        self.assertEqual(localized_choice("difficulty", "easy", "en"), "Easy")
        self.assertEqual(localized_choice("difficulty", "hard", "ru"), "Сложная")
        self.assertEqual(localized_choice("difficulty", "medium", "uz"), "Oʻrta")

    def test_unit_labels(self):
        self.assertEqual(localized_choice("unit", "pcs", "uz"), "dona")
        self.assertEqual(localized_choice("unit", "pcs", "ru"), "шт")
        self.assertEqual(localized_choice("unit", "tbsp", "ru"), "ст. л.")

    def test_recipe_status_labels(self):
        self.assertEqual(localized_choice("status", "published", "uz"), "Nashr etilgan")
        self.assertEqual(localized_choice("status", "pending", "ru"), "На проверке")

    def test_unknown_values_fall_back_to_the_raw_value(self):
        self.assertEqual(localized_choice("difficulty", "nope", "ru"), "nope")
        self.assertEqual(localized_choice("difficulty", None, "ru"), "")
        self.assertEqual(localized_choice("no_such_table", "x", "ru"), "x")


class EnumLabelApiTests(TestCase):
    """The API must return localized enum labels in list and detail payloads."""

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(
            email="enums@example.com",
            password="Str0ngPassw0rd!",
            name="Enum Tester",
        )
        cls.category = Category.objects.create(
            name="Breakfast",
            slug="breakfast",
            name_uz="Nonushta",
            name_ru="Завтрак",
            name_en="Breakfast",
        )
        cls.recipe = Recipe.objects.create(
            title="Test dish",
            description="A dish used for enum label tests.",
            author=cls.user,
            category=cls.category,
            difficulty=Difficulty.EASY,
            status=RecipeStatus.PUBLISHED,
            prep_time=5,
            cooking_time=10,
            servings=2,
        )
        ingredient = Ingredient.objects.first()
        if ingredient is None:
            ingredient_category = IngredientCategory.objects.create(
                slug="test", name="Test", name_uz="Test", name_ru="Тест", name_en="Test"
            )
            ingredient = Ingredient.objects.create(
                name="Salt",
                slug="salt",
                category=ingredient_category,
                name_uz="Tuz",
                name_ru="Соль",
                name_en="Salt",
            )
        RecipeIngredient.objects.create(
            recipe=cls.recipe, ingredient=ingredient, quantity=1, unit="pcs"
        )

    def test_recipe_list_difficulty_is_localized(self):
        expected = {"uz": "Oson", "ru": "Лёгкая", "en": "Easy"}
        for lang, label in expected.items():
            response = self.client.get(f"/api/v1/recipes/?lang={lang}")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data["results"][0]["difficulty"], label)

    def test_recipe_detail_unit_is_localized(self):
        response = self.client.get(f"/api/v1/recipes/{self.recipe.slug}/?lang=ru")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["ingredients"][0]["unit"], "шт")

    def test_recipe_list_defaults_to_uz(self):
        response = self.client.get("/api/v1/recipes/")
        self.assertEqual(response.data["results"][0]["difficulty"], "Oson")
