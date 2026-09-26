from django.contrib.auth import get_user_model
from django.utils.text import slugify

from rest_framework import status
from rest_framework.test import APITestCase

from apps.categories.models import Category
from apps.ingredients.models import Ingredient, IngredientCategory
from apps.recipes.models import Difficulty, InstructionStep, Recipe, RecipeIngredient, RecipeStatus, Unit

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


def make_recipe(author, title="Test Recipe", ingredients=("Potato",), category=None,
                status=RecipeStatus.PUBLISHED, prep_time=10, cooking_time=20, **extra):
    if category is None:
        category, _ = Category.objects.get_or_create(
            slug="test-category", defaults={"name": "Test Category"}
        )
    recipe = Recipe.objects.create(
        author=author,
        title=title,
        description="A recipe used by the automated tests.",
        category=category,
        prep_time=prep_time,
        cooking_time=cooking_time,
        servings=2,
        difficulty=Difficulty.EASY,
        status=status,
        **extra,
    )
    for item in ingredients:
        ing = make_ingredient(item)
        RecipeIngredient.objects.create(recipe=recipe, ingredient=ing, quantity=1, unit=Unit.PIECE)
    InstructionStep.objects.create(recipe=recipe, step_number=1, instruction="Mix ingredients.")
    return recipe


def auth_client(client, email="owner@example.com", password="StrongPass123!"):
    if not User.objects.filter(email=email).exists():
        User.objects.create_user(email=email, password=password, name="Owner")
    resp = client.post(
        "/api/v1/auth/login/", {"email": email, "password": password}, format="json"
    )
    client.cookies.update(resp.cookies)
    return client


class RecipeCrudTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Dinner", slug="dinner")
        self.author = User.objects.create_user(email="owner@example.com", password="StrongPass123!")
        self.other = User.objects.create_user(email="other@example.com", password="StrongPass123!")
        self.recipe = make_recipe(self.author, category=self.category, ingredients=("Rice",))

    def test_guest_can_read_published_recipe(self):
        resp = self.client.get(f"/api/v1/recipes/{self.recipe.slug}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        body = resp.data
        self.assertEqual(body["title"], "Test Recipe")
        self.assertIn("ingredients", body)
        self.assertIn("steps", body)
        self.assertEqual(len(body["ingredients"]), 1)
        self.assertEqual(len(body["steps"]), 1)

    def test_guest_cannot_create_recipe(self):
        resp = self.client.post("/api/v1/recipes/", {"title": "X", "cooking_time": 5}, format="json")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_owner_can_create_recipe_with_nested_ingredients_and_steps(self):
        client = auth_client(self.client)
        ing = make_ingredient("Carrot")
        resp = client.post(
            "/api/v1/recipes/",
            {
                "title": "My Stew",
                "description": "Home cooking.",
                "category_id": self.category.pk,
                "cooking_time": 40,
                "prep_time": 10,
                "servings": 4,
                "difficulty": "medium",
                "ingredients": [{"ingredient_id": ing.pk, "quantity": "2", "unit": "pcs"}],
                "steps": [
                    {"step_number": 1, "instruction": "Chop the carrot."},
                    {"step_number": 2, "instruction": "Simmer slowly."},
                ],
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED, resp.data)
        recipe = Recipe.objects.get(slug=resp.data["slug"])
        self.assertEqual(recipe.author, self.author)
        self.assertEqual(recipe.recipe_ingredients.count(), 1)
        self.assertEqual(recipe.steps.count(), 2)
        # slug surfaced in the write response so clients can redirect
        self.assertIn("slug", resp.data)
        self.assertIn("id", resp.data)

    def test_create_requires_ingredient_and_step(self):
        client = auth_client(self.client)
        resp = client.post(
            "/api/v1/recipes/",
            {"title": "NoSteps", "cooking_time": 10, "prep_time": 5, "servings": 2,
             "ingredients": [{"ingredient_id": make_ingredient("Onion").pk, "quantity": "1", "unit": "pcs"}],
             "steps": []},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("steps", resp.data.get("errors", {}))

    def test_non_owner_cannot_edit(self):
        client = auth_client(self.client, email="other@example.com")
        resp = client.put(
            f"/api/v1/recipes/{self.recipe.slug}/",
            {
                "title": "Hacked",
                "description": "x",
                "cooking_time": 5,
                "prep_time": 5,
                "servings": 1,
                "difficulty": "easy",
                "ingredients": [{"ingredient_id": make_ingredient("Onion").pk, "quantity": "1", "unit": "pcs"}],
                "steps": [{"step_number": 1, "instruction": "y"}],
            },
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.recipe.refresh_from_db()
        self.assertEqual(self.recipe.title, "Test Recipe")

    def test_non_owner_cannot_delete(self):
        client = auth_client(self.client, email="other@example.com")
        resp = client.delete(f"/api/v1/recipes/{self.recipe.slug}/")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Recipe.objects.filter(pk=self.recipe.pk).exists())

    def test_owner_can_update_and_delete(self):
        client = auth_client(self.client)
        resp = client.delete(f"/api/v1/recipes/{self.recipe.slug}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertFalse(Recipe.objects.filter(pk=self.recipe.pk).exists())

    def test_draft_not_listed_for_guests_but_visible_to_owner(self):
        make_recipe(self.author, title="Secret Recipe", status=RecipeStatus.DRAFT)
        resp = self.client.get("/api/v1/recipes/?search=Secret")
        self.assertEqual(resp.data["count"], 0)
        client = auth_client(self.client)
        resp = client.get("/api/v1/recipes/my/")
        titles = [r["title"] for r in resp.data["results"]]
        self.assertIn("Secret Recipe", titles)

    def test_recipe_404_for_missing_slug(self):
        resp = self.client.get("/api/v1/recipes/does-not-exist/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)


class RecipeSearchAndFilterTests(APITestCase):
    def setUp(self):
        self.author = User.objects.create_user(email="owner@example.com", password="StrongPass123!")
        self.dinner = Category.objects.create(name="Dinner", slug="dinner")
        self.breakfast = Category.objects.create(name="Breakfast", slug="breakfast")
        self.duck = make_ingredient("Duck", "chicken")
        self.parsley = make_ingredient("Parsley", "other")

        self.plov = make_recipe(self.author, title="Tasty Plov", ingredients=("Rice", "Carrot", "Lamb"),
                                category=self.dinner, cooking_time=90, prep_time=15,
                                calories=520, protein=25, status=RecipeStatus.PUBLISHED)
        self.omlette = make_recipe(self.author, title="Fluffy Omelette", ingredients=("Egg", "Milk"),
                                   category=self.breakfast, cooking_time=10, prep_time=3,
                                   status=RecipeStatus.PUBLISHED)

    def test_search_matches_title(self):
        resp = self.client.get("/api/v1/recipes/?search=plov")
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["slug"], self.plov.slug)

    def test_search_matches_ingredient(self):
        resp = self.client.get("/api/v1/recipes/?search=egg")
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["slug"], self.omlette.slug)

    def test_search_matches_category_name(self):
        resp = self.client.get("/api/v1/recipes/?search=breakfast")
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["slug"], self.omlette.slug)

    def test_search_matches_localized_category_name(self):
        """§19 + §3.3: filters and search must read naturally in all three languages."""
        self.breakfast.name_uz = "Nonushta"
        self.breakfast.name_ru = "Zavtrak"
        self.breakfast.save(update_fields=["name_uz", "name_ru"])

        for term in ("nonushta", "zavtrak", "breakfast"):
            with self.subTest(term=term):
                resp = self.client.get(f"/api/v1/recipes/?query={term}")
                self.assertEqual(resp.data["count"], 1)
                self.assertEqual(resp.data["results"][0]["slug"], self.omlette.slug)

    def test_search_matches_localized_ingredient_name(self):
        self.parsley.name_uz = "Petrushka"
        self.parsley.save(update_fields=["name_uz"])
        recipe = make_recipe(
            self.author,
            title="Fresh herb salad",
            ingredients=("Parsley",),
            category=self.dinner,
            status=RecipeStatus.PUBLISHED,
        )

        resp = self.client.get("/api/v1/recipes/?query=petrushka")
        self.assertEqual([row["slug"] for row in resp.data["results"]], [recipe.slug])

    def test_query_filter_combines_fields(self):
        resp = self.client.get("/api/v1/recipes/?query=plov")
        self.assertEqual(resp.data["count"], 1)

    def test_category_filter(self):
        resp = self.client.get("/api/v1/recipes/?category=dinner")
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["slug"], self.plov.slug)

    def test_time_range_filter(self):
        resp = self.client.get("/api/v1/recipes/?time_range=under-15")
        slugs = {r["slug"] for r in resp.data["results"]}
        self.assertEqual(slugs, {self.omlette.slug})
        resp = self.client.get("/api/v1/recipes/?time_range=60%2B")
        slugs = {r["slug"] for r in resp.data["results"]}
        self.assertEqual(slugs, {self.plov.slug})

    def test_max_time_filter(self):
        resp = self.client.get("/api/v1/recipes/?max_time=30")
        slugs = {r["slug"] for r in resp.data["results"]}
        self.assertNotIn(self.plov.slug, slugs)
        self.assertIn(self.omlette.slug, slugs)

    def test_diet_filters_combine_with_AND(self):
        resp = self.client.get("/api/v1/recipes/?diet=high-protein")
        slugs = {r["slug"] for r in resp.data["results"]}
        self.assertIn(self.plov.slug, slugs)
        resp = self.client.get("/api/v1/recipes/?diet=high-protein&difficulty=easy")
        self.assertEqual(resp.data["count"], 1)
        self.assertEqual(resp.data["results"][0]["slug"], self.plov.slug)

    def test_total_time_exposed_in_list(self):
        resp = self.client.get("/api/v1/recipes/?search=plov")
        self.assertEqual(resp.data["results"][0]["total_time"], 105)


class IngredientMatchTests(APITestCase):
    def setUp(self):
        self.author = User.objects.create_user(email="owner@example.com", password="StrongPass123!")
        self.cat = Category.objects.create(name="Dinner", slug="dinner")
        rice = make_ingredient("Rice", "grains")
        carrot = make_ingredient("Carrot", "vegetables")
        beef = make_ingredient("Beef", "meat")
        milk = make_ingredient("Milk", "dairy")
        # selecting only Rice -> 1/3 ingredients -> 33%
        self.plov = make_recipe(self.author, title="Plov", ingredients=("Rice", "Carrot", "Beef"),
                                category=self.cat)
        # 1/2 ingredients -> 50%
        self.porridge = make_recipe(self.author, title="Rice Porridge", ingredients=("Rice", "Milk"),
                                    category=self.cat)
        # 100% match
        self.simple = make_recipe(self.author, title="Simply Rice", ingredients=("Rice",), category=self.cat)

    def _match(self, ingredient_ids):
        return self.client.post(
            "/api/v1/recipes/match-by-ingredients/",
            {"ingredient_ids": ingredient_ids},
            format="json",
        )

    def test_match_percentage_and_sorting(self):
        rice_id = Ingredient.objects.get(slug="rice").pk
        resp = self._match([rice_id])
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        results = resp.data["results"]
        slugs = [r["slug"] for r in results]
        self.assertEqual(resp.data["count"], 3)
        # strictly sorted by match percentage, 100% pinned first
        percentages = [r["match_percentage"] for r in results]
        self.assertEqual(percentages, sorted(percentages, reverse=True))
        self.assertEqual(slugs[0], self.simple.slug)
        self.assertEqual(percentages[0], 100)
        by_slug = {r["slug"]: r for r in results}
        self.assertEqual(by_slug[self.plov.slug]["match_percentage"], 33)
        self.assertEqual(by_slug[self.porridge.slug]["match_percentage"], 50)

    def test_match_returns_available_and_missing_lists(self):
        rice_id = Ingredient.objects.get(slug="rice").pk
        resp = self._match([rice_id])
        plov = next(r for r in resp.data["results"] if r["slug"] == self.plov.slug)
        self.assertEqual(plov["available_count"], 1)
        self.assertEqual(plov["total_count"], 3)
        self.assertEqual({m["name"] for m in plov["matched_ingredients"]}, {"Rice"})
        self.assertEqual({m["name"] for m in plov["missing_ingredients"]}, {"Carrot", "Beef"})
        self.assertIn("quantity", plov["missing_ingredients"][0])
        self.assertIn("unit", plov["missing_ingredients"][0])

    def test_guest_can_use_matching(self):
        resp = self._match([Ingredient.objects.get(slug="rice").pk])
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_empty_selection_returns_nothing(self):
        resp = self._match([])
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 0)

    def test_non_selected_ingredient_yields_zero_results(self):
        resp = self._match([make_ingredient("Truffle", "other").pk])
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 0)