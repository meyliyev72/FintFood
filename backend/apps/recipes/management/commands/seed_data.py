"""Seed FintFood with realistic demo content.

Usage:
    python manage.py seed_data            # idempotent (skips existing)
    python manage.py seed_data --force    # recreate everything
"""

import random
from io import BytesIO

import requests
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from apps.accounts.models import User
from apps.categories.models import Category
from apps.ingredients.models import Ingredient, IngredientCategory
from apps.recipes.models import InstructionStep, Recipe, RecipeIngredient, RecipeStatus
from apps.recipes.seed_content import (
    CATEGORIES,
    INGREDIENTS,
    INGREDIENT_CATEGORIES,
    RECIPES,
    REVIEW_COMMENTS,
    SEED_USERS,
)
from apps.reviews.models import Review

IMAGE_PLACEHOLDER = "https://picsum.photos/seed/fintfood-{slug}/1200/800"


class Command(BaseCommand):
    help = "Seed the database with realistic demo data (idempotent)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force", action="store_true", help="Delete existing seeded data first."
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["force"]:
            self._wipe()

        self._seed_users()
        self._seed_ingredient_categories()
        self._seed_categories()
        self._seed_ingredients()
        self._seed_recipes()
        self.stdout.write(self.style.SUCCESS("Seed completed."))

    # ------------------------------------------------------------------
    def _wipe(self):
        Recipe.objects.all().delete()
        Review.objects.all().delete()
        Ingredient.objects.all().delete()
        IngredientCategory.objects.all().delete()
        Category.objects.all().delete()
        User.objects.exclude(is_superuser=True).delete()
        self.stdout.write("Cleared previous seed data.")

    def _seed_users(self):
        existing = set(User.objects.values_list("email", flat=True))
        for email, name, password, is_staff, is_superuser in SEED_USERS:
            if email in existing:
                continue
            User.objects.create_user(
                email=email,
                name=name,
                password=password,
                is_staff=is_staff,
                is_superuser=is_superuser,
                bio="Home cook passionate about simple, honest food.",
            )
        self.stdout.write(f"Users: {User.objects.count()}")

    def _seed_ingredient_categories(self):
        existing = set(IngredientCategory.objects.values_list("slug", flat=True))
        for name in INGREDIENT_CATEGORIES:
            slug = slugify(name)
            if slug in existing:
                continue
            IngredientCategory.objects.create(name=name, slug=slug)

    def _seed_categories(self):
        existing = set(Category.objects.values_list("slug", flat=True))
        for name, description in CATEGORIES:
            slug = slugify(name)
            if slug in existing:
                continue
            Category.objects.create(name=name, slug=slug, description=description)
        self.stdout.write(f"Categories: {Category.objects.count()}")

    def _seed_ingredients(self):
        by_name = {i.name.lower(): i for i in Ingredient.objects.all()}
        categories = {c.slug: c for c in IngredientCategory.objects.all()}
        created = 0
        for name, cat_slug in INGREDIENTS.items():
            if name.lower() in by_name:
                continue
            Ingredient.objects.create(
                name=name, category=categories[cat_slug], slug=slugify(name)
            )
            created += 1
        self.stdout.write(f"Ingredients: {Ingredient.objects.count()} ({created} new)")

    def _seed_recipes(self):
        authors = list(
            User.objects.filter(is_staff=False).exclude(email="admin@fintfood.dev")
        )
        if not authors:
            authors = list(User.objects.all())
        categories = {c.slug: c for c in Category.objects.all()}
        ingredients = {i.name.lower(): i for i in Ingredient.objects.all()}

        existing_titles = set(Recipe.objects.values_list("title", flat=True))
        created = 0
        for title, cat_slug, cook, prep, servings, difficulty, cal, protein, carbs, fat, ing_list, steps in RECIPES:
            if title in existing_titles:
                continue
            category = categories.get(cat_slug)
            author = authors[created % len(authors)]

            recipe = Recipe.objects.create(
                title=title,
                description=(
                    steps[0] + " A FintFood community favorite, tested at home "
                    "by people who love to cook."
                ),
                category=category,
                author=author,
                cooking_time=cook,
                prep_time=prep,
                servings=servings,
                difficulty=difficulty,
                status=RecipeStatus.PUBLISHED,
                calories=cal,
                protein=protein,
                carbs=carbs,
                fat=fat,
            )
            for name, qty, unit in ing_list:
                ingredient = ingredients.get(name.lower())
                if ingredient is None:
                    continue
                RecipeIngredient.objects.create(
                    recipe=recipe, ingredient=ingredient, quantity=qty, unit=unit
                )

            for idx, instruction in enumerate(steps, start=1):
                InstructionStep.objects.create(
                    recipe=recipe, step_number=idx, instruction=instruction, image=None
                )

            self._set_cover(recipe)
            self._seed_reviews(recipe)
            created += 1

        self.stdout.write(f"Recipes: {Recipe.objects.count()} ({created} new)")

    def _set_cover(self, recipe):
        """Download a seeded placeholder photo; fall back to a local image."""
        url = IMAGE_PLACEHOLDER.format(slug=recipe.slug)
        try:
            resp = requests.get(url, timeout=20)
            if resp.status_code == 200:
                recipe.cover_image.save(
                    f"{recipe.slug}.jpg",
                    ContentFile(resp.content),
                    save=True,
                )
                return
        except requests.RequestException:
            pass
        from PIL import Image

        buf = BytesIO()
        Image.new("RGB", (600, 400), color=(96, 128, 96)).save(buf, "JPEG")
        recipe.cover_image.save(f"{recipe.slug}.jpg", ContentFile(buf.getvalue()), save=True)

    def _seed_reviews(self, recipe):
        rng = random.Random(recipe.pk * 7)
        n_reviews = rng.randint(1, 7)
        users = list(User.objects.all())
        for _ in range(n_reviews):
            user = users[rng.randrange(len(users))]
            rating = rng.choices([5, 5, 5, 4, 4, 3], k=1)[0]
            comment = REVIEW_COMMENTS[rng.randrange(len(REVIEW_COMMENTS))]
            Review.objects.update_or_create(
                recipe=recipe,
                user=user,
                defaults={"rating": rating, "comment": comment},
            )