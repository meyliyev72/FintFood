from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.test import APITestCase

from apps.ingredients.models import Ingredient, IngredientCategory
from apps.shopping_list.models import ShoppingListItem
from apps.shopping_list.services import merge_item

User = get_user_model()


def category(slug):
    return IngredientCategory.objects.get_or_create(slug=slug, defaults={"name": slug.title()})[0]


class ShoppingListMergeTests(APITestCase):
    """The dedup/merge rule: same ingredient name (case-insensitive) + same unit
    + open line -> quantities summed; otherwise a fresh line."""

    def setUp(self):
        self.user = User.objects.create_user(email="shop@example.com", password="StrongPass123!")
        self.carrot = Ingredient.objects.create(name="Carrot", category=category("vegetables"))

    def test_merge_same_name_case_insensitive(self):
        merge_item(self.user, name="Carrot", quantity="1", unit="kg")
        self.assertEqual(len(ShoppingListItem.objects.filter(user=self.user)), 1)
        lines2 = merge_item(self.user, name="carrot", quantity="2", unit="kg")
        self.assertEqual(len(ShoppingListItem.objects.filter(user=self.user)), 1)
        self.assertEqual(float(lines2[0].quantity), 3.0)

    def test_match_by_ingredient_fk_overrides_name(self):
        lines = merge_item(self.user, ingredient=self.carrot, quantity="1", unit="kg")
        self.assertEqual(float(lines[0].quantity), 1.0)
        lines = merge_item(self.user, name="Carrot", quantity="1", unit="kg")
        self.assertEqual(float(lines[0].quantity), 2.0)
        self.assertEqual(ShoppingListItem.objects.filter(user=self.user).count(), 1)

    def test_different_units_do_not_merge(self):
        merge_item(self.user, ingredient=self.carrot, quantity="1", unit="kg")
        merge_item(self.user, ingredient=self.carrot, quantity="2", unit="pcs")
        items = list(ShoppingListItem.objects.filter(user=self.user).order_by("id"))
        self.assertEqual(len(items), 2)

    def test_completed_line_is_not_merged_into(self):
        first = merge_item(self.user, ingredient=self.carrot, quantity="1", unit="kg")[0]
        first.is_completed = True
        first.save(update_fields=["is_completed"])
        second = merge_item(self.user, ingredient=self.carrot, quantity="3", unit="kg")[0]
        self.assertNotEqual(first.id, second.id)
        self.assertEqual(float(second.quantity), 3.0)

    def test_respects_user_scoping(self):
        other = User.objects.create_user(email="other@example.com", password="StrongPass123!")
        merge_item(other, ingredient=self.carrot, quantity="5", unit="kg")
        merge_item(self.user, ingredient=self.carrot, quantity="1", unit="kg")
        self.assertEqual(float(ShoppingListItem.objects.get(user=self.user).quantity), 1.0)


class ShoppingListApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="api@example.com", password="StrongPass123!")
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "api@example.com", "password": "StrongPass123!"},
            format="json",
        )
        if login.status_code != status.HTTP_200_OK:
            raise AssertionError("test login failed")
        self.client.cookies.update(login.cookies)

    def test_guest_denied(self):
        self.client.cookies.clear()
        resp = self.client.get("/api/v1/shopping-list/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_crud_flow(self):
        created = self.client.post(
            "/api/v1/shopping-list/",
            {"name": "Apple", "quantity": "1", "unit": "kg"},
            format="json",
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED)
        item_id = created.data["id"]

        listed = self.client.get("/api/v1/shopping-list/")
        self.assertEqual(listed.status_code, status.HTTP_200_OK)
        self.assertEqual(listed.data["count"], 1)

        patched = self.client.patch(
            f"/api/v1/shopping-list/{item_id}/", {"is_completed": True}, format="json"
        )
        self.assertEqual(patched.status_code, status.HTTP_200_OK)
        self.assertTrue(patched.data["is_completed"])

        cleared = self.client.post("/api/v1/shopping-list/clear-completed/")
        self.assertEqual(cleared.status_code, status.HTTP_200_OK)
        self.assertEqual(ShoppingListItem.objects.filter(user=self.user).count(), 0)

    def test_api_merge_accumulates_quantity(self):
        self.client.post("/api/v1/shopping-list/", {"name": "Milk", "quantity": "1", "unit": "l"}, format="json")
        resp = self.client.post("/api/v1/shopping-list/", {"name": "milk", "quantity": "2", "unit": "l"}, format="json")
        self.assertEqual(float(resp.data["quantity"]), 3.0)
        self.assertEqual(ShoppingListItem.objects.filter(user=self.user).count(), 1)