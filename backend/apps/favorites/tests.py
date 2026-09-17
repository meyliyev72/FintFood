from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.test import APITestCase

from apps.categories.models import Category
from apps.ingredients.models import Ingredient, IngredientCategory
from apps.favorites.models import Favorite
from apps.recipes.models import Difficulty, InstructionStep, Recipe, RecipeIngredient, RecipeStatus, Unit

User = get_user_model()


def make_recipe(author, title="Savory Pie"):
    category, _ = Category.objects.get_or_create(slug="dinner", defaults={"name": "Dinner"})
    recipe = Recipe.objects.create(
        author=author, title=title, description="d", category=category,
        prep_time=5, cooking_time=10, servings=2, difficulty=Difficulty.EASY, status=RecipeStatus.PUBLISHED,
    )
    veg, _ = IngredientCategory.objects.get_or_create(slug="vegetables", defaults={"name": "Vegetables"})
    onion, _ = Ingredient.objects.get_or_create(slug="onion", defaults={"name": "Onion", "category": veg})
    RecipeIngredient.objects.create(recipe=recipe, ingredient=onion, quantity=1, unit=Unit.PIECE)
    InstructionStep.objects.create(recipe=recipe, step_number=1, instruction="cook")
    return recipe


def auth(client, user):
    resp = client.post("/api/v1/auth/login/", {"email": user.email, "password": "StrongPass123!"}, format="json")
    client.cookies.update(resp.cookies)
    return client


class FavoriteTests(APITestCase):
    def setUp(self):
        self.author = User.objects.create_user(email="author@example.com", password="StrongPass123!")
        self.user = User.objects.create_user(email="fanner@example.com", password="StrongPass123!")
        self.recipe = make_recipe(self.author)
        self.client = auth(self.client, self.user)

    def test_guest_denied(self):
        self.client.cookies.clear()
        resp = self.client.get("/api/v1/favorites/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_toggle_on_and_off(self):
        on = self.client.post("/api/v1/favorites/toggle/", {"recipe_id": self.recipe.pk}, format="json")
        self.assertEqual(on.status_code, status.HTTP_200_OK)
        self.assertTrue(on.data["is_favorite"])
        self.assertTrue(Favorite.objects.filter(user=self.user, recipe=self.recipe).exists())

        off = self.client.post("/api/v1/favorites/toggle/", {"recipe_id": self.recipe.pk}, format="json")
        self.assertFalse(off.data["is_favorite"])
        self.assertFalse(Favorite.objects.filter(user=self.user, recipe=self.recipe).exists())

    def test_favorites_list_contains_full_recipe_payload(self):
        self.client.post("/api/v1/favorites/toggle/", {"recipe_id": self.recipe.pk}, format="json")
        resp = self.client.get("/api/v1/favorites/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 1)
        payload = resp.data["results"][0]
        nested = payload["recipe"]
        # recipe payload must be fully annotated/usable by UI cards
        for field in ("id", "slug", "title", "image", "average_rating", "review_count",
                      "total_time", "ingredients_count", "is_favorite", "category", "author"):
            self.assertIn(field, nested)
        self.assertTrue(nested["is_favorite"])

    def test_favorite_ids_endpoint(self):
        self.client.post("/api/v1/favorites/toggle/", {"recipe_id": self.recipe.pk}, format="json")
        resp = self.client.get("/api/v1/favorites/ids/")
        self.assertEqual(resp.data["recipe_ids"], [self.recipe.pk])

    def test_is_favorite_flag_within_recipe_list(self):
        self.client.post("/api/v1/favorites/toggle/", {"recipe_id": self.recipe.pk}, format="json")
        resp = self.client.get(f"/api/v1/recipes/?search={self.recipe.title}")
        recipe = resp.data["results"][0]
        self.assertTrue(recipe["is_favorite"])

    def test_toggle_unknown_recipe_rejected(self):
        resp = self.client.post("/api/v1/favorites/toggle/", {"recipe_id": 999999}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)