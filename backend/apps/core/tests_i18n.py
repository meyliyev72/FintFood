"""Tests for locale-aware catalog naming (§3.3).

Category, ingredient-category and ingredient labels appear in navigation and
filter controls, so the API must resolve them per request language.
"""

from django.test import TestCase
from rest_framework.test import APIClient

from apps.categories.models import Category
from apps.core.i18n import localized, normalize_language
from apps.ingredients.models import Ingredient, IngredientCategory


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
