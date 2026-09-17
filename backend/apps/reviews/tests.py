from django.contrib.auth import get_user_model

from django.db import models
from rest_framework import status
from rest_framework.test import APITestCase

from apps.categories.models import Category
from apps.ingredients.models import Ingredient, IngredientCategory
from apps.recipes.models import Difficulty, InstructionStep, Recipe, RecipeIngredient, RecipeStatus, Unit
from apps.reviews.models import Review

User = get_user_model()


def make_recipe(author, title="Rated Recipe", status=RecipeStatus.PUBLISHED):
    category, _ = Category.objects.get_or_create(slug="dinner", defaults={"name": "Dinner"})
    recipe = Recipe.objects.create(
        author=author, title=title, description="d", category=category,
        prep_time=5, cooking_time=10, servings=2, difficulty=Difficulty.EASY, status=status,
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


class ReviewTests(APITestCase):
    def setUp(self):
        self.author = User.objects.create_user(email="author@example.com", password="StrongPass123!")
        self.user = User.objects.create_user(email="reviewer@example.com", password="StrongPass123!")
        self.recipe = make_recipe(self.author)

    def test_guest_cannot_review(self):
        resp = self.client.post(
            "/api/v1/reviews/", {"recipe_id": self.recipe.pk, "rating": 5, "comment": "hi"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_one_review_per_user_is_upserted(self):
        client = auth(self.client, self.user)
        first = client.post(
            "/api/v1/reviews/", {"recipe_id": self.recipe.pk, "rating": 3, "comment": "ok"}, format="json"
        )
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        second = client.post(
            "/api/v1/reviews/", {"recipe_id": self.recipe.pk, "rating": 5, "comment": "better"}, format="json"
        )
        self.assertEqual(second.status_code, status.HTTP_201_CREATED)
        self.assertEqual(first.data["id"], second.data["id"])
        self.assertEqual(Review.objects.filter(recipe=self.recipe, user=self.user).count(), 1)
        self.assertEqual(second.data["rating"], 5)

    def test_average_rating_recalculates_on_create_and_delete(self):
        client = auth(self.client, self.user)
        client.post("/api/v1/reviews/", {"recipe_id": self.recipe.pk, "rating": 2, "comment": "x"}, format="json")
        detail = client.get(f"/api/v1/recipes/{self.recipe.slug}/")
        self.assertEqual(float(detail.data["average_rating"]), 2.0)
        self.assertEqual(detail.data["review_count"], 1)

        other = User.objects.create_user(email="second@example.com", password="StrongPass123!")
        auth(self.client, other)
        self.client.post("/api/v1/reviews/", {"recipe_id": self.recipe.pk, "rating": 4, "comment": "y"}, format="json")
        detail = client.get(f"/api/v1/recipes/{self.recipe.slug}/")
        self.assertEqual(float(detail.data["average_rating"]), 3.0)
        self.assertEqual(detail.data["review_count"], 2)

        # delete one review -> average drops back to the other's rating
        review = Review.objects.get(recipe=self.recipe, user=other)
        resp = self.client.delete(f"/api/v1/reviews/{review.pk}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        detail = client.get(f"/api/v1/recipes/{self.recipe.slug}/")
        self.assertEqual(float(detail.data["average_rating"]), 2.0)
        self.assertEqual(detail.data["review_count"], 1)

    def test_rating_validation_boundaries(self):
        client = auth(self.client, self.user)
        bad = client.post(
            "/api/v1/reviews/", {"recipe_id": self.recipe.pk, "rating": 6, "comment": "x"}, format="json"
        )
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)
        bad = client.post(
            "/api/v1/reviews/", {"recipe_id": self.recipe.pk, "rating": 0, "comment": "x"}, format="json"
        )
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unknown_recipe_rejected(self):
        client = auth(self.client, self.user)
        resp = client.post(
            "/api/v1/reviews/", {"recipe_id": 999999, "rating": 5, "comment": "x"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_review_listing_returns_nested_reviewer(self):
        client = auth(self.client, self.user)
        client.post("/api/v1/reviews/", {"recipe_id": self.recipe.pk, "rating": 4, "comment": "nice"}, format="json")
        resp = self.client.get(f"/api/v1/recipes/{self.recipe.slug}/")
        reviews = resp.data["reviews"]
        self.assertEqual(len(reviews), 1)
        self.assertEqual(reviews[0]["rating"], 4)
        self.assertEqual(reviews[0]["user"]["name"], "reviewer")