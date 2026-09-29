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

    def test_api_persists_the_submitted_unit(self):
        """Regression: `unit` used to be a read-only SerializerMethodField, so the
        submitted value was dropped and every row silently became `pcs`."""
        resp = self.client.post(
            "/api/v1/shopping-list/", {"name": "Flour", "quantity": "500", "unit": "g"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        item = ShoppingListItem.objects.get(id=resp.data["id"])
        self.assertEqual(item.unit, "g")

    def test_api_merge_uses_submitted_unit_not_pcs_fallback(self):
        """The same bug also broke merging: two `kg` rows failed to merge because
        both were being stored as `pcs` alongside unrelated `pcs` lines."""
        self.client.post(
            "/api/v1/shopping-list/", {"name": "Sugar", "quantity": "1", "unit": "kg"}, format="json"
        )
        resp = self.client.post(
            "/api/v1/shopping-list/", {"name": "Sugar", "quantity": "2", "unit": "kg"}, format="json"
        )
        self.assertEqual(float(resp.data["quantity"]), 3.0)
        self.assertEqual(ShoppingListItem.objects.filter(user=self.user).count(), 1)

    def test_api_does_not_merge_across_different_submitted_units(self):
        self.client.post(
            "/api/v1/shopping-list/", {"name": "Rice", "quantity": "1", "unit": "kg"}, format="json"
        )
        self.client.post(
            "/api/v1/shopping-list/", {"name": "Rice", "quantity": "2", "unit": "g"}, format="json"
        )
        self.assertEqual(ShoppingListItem.objects.filter(user=self.user).count(), 2)

    def test_read_returns_localized_unit_and_raw_code(self):
        """Reads give a label, `unit_code` gives the key a client needs to
        round-trip an edit without a label -> code lookup table."""
        created = self.client.post(
            "/api/v1/shopping-list/", {"name": "Salt", "quantity": "1", "unit": "pcs"}, format="json"
        )
        self.assertEqual(created.data["unit_code"], "pcs")

        uz = self.client.get("/api/v1/shopping-list/?lang=uz")
        ru = self.client.get("/api/v1/shopping-list/?lang=ru")
        en = self.client.get("/api/v1/shopping-list/?lang=en")

        # Same stored row, three readable labels, one stable key.
        self.assertEqual(uz.data["results"][0]["unit"], "dona")
        self.assertEqual(ru.data["results"][0]["unit"], "шт")
        self.assertEqual(en.data["results"][0]["unit"], "pcs")
        for page in (uz, ru, en):
            self.assertEqual(page.data["results"][0]["unit_code"], "pcs")

    def test_edit_round_trips_the_unit_code(self):
        created = self.client.post(
            "/api/v1/shopping-list/", {"name": "Oil", "quantity": "1", "unit": "ml"}, format="json"
        )
        item_id = created.data["id"]
        patched = self.client.patch(
            f"/api/v1/shopping-list/{item_id}/", {"quantity": "250", "unit": "ml"}, format="json"
        )
        self.assertEqual(patched.status_code, status.HTTP_200_OK)
        self.assertEqual(float(patched.data["quantity"]), 250.0)
        self.assertEqual(ShoppingListItem.objects.get(id=item_id).unit, "ml")

    def test_rejects_an_unknown_unit(self):
        resp = self.client.post(
            "/api/v1/shopping-list/", {"name": "X", "quantity": "1", "unit": "parsec"}, format="json"
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)


class NotFoundErrorShapeTests(APITestCase):
    """Regression: DRF's own handler rebinds its *local* `exc` when it turns a
    `Http404` into `NotFound`, so ours saw an exception with no `.detail` and
    every 404 read "An unexpected error occurred." """

    def test_404_has_a_real_message_and_code(self):
        resp = self.client.get("/api/v1/recipes/definitely-not-a-real-slug/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(resp.data["code"], "not-found")
        self.assertNotIn("unexpected", resp.data["detail"].lower())

    def test_404_on_a_write_endpoint(self):
        user = User.objects.create_user(email="nf@example.com", password="StrongPass123!")
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "nf@example.com", "password": "StrongPass123!"},
            format="json",
        )
        self.client.cookies.update(login.cookies)

        resp = self.client.delete("/api/v1/shopping-list/999999/")
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(resp.data["code"], "not-found")
        self.assertNotIn("unexpected", resp.data["detail"].lower())

    def test_401_and_400_keep_their_codes(self):
        guest = self.client.get("/api/v1/shopping-list/")
        self.assertEqual(guest.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(guest.data["code"], "not-authenticated")

        User.objects.create_user(email="nf2@example.com", password="StrongPass123!")
        login = self.client.post(
            "/api/v1/auth/login/",
            {"email": "nf2@example.com", "password": "StrongPass123!"},
            format="json",
        )
        self.client.cookies.update(login.cookies)

        bad = self.client.post(
            "/api/v1/shopping-list/", {"name": "", "quantity": "1", "unit": "g"}, format="json"
        )
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(bad.data["code"], "validation_error")
        self.assertIn("name", bad.data["errors"])