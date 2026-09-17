"""Quick end-to-end API smoke test for the FintFood backend.

Self-healing: rerunning against an already-seeded database is deterministic
(login instead of register when the smoke user exists, and prior-run leftovers
are cleaned up).
"""

import sys

import requests

BASE = "http://127.0.0.1:8000/api/v1"
s = requests.Session()
failures = []


def check(name, cond, extra=""):
    status = "PASS" if cond else "FAIL"
    print(f"[{status}] {name}" + (f" — {extra}" if extra else ""))
    if not cond:
        failures.append(name)


# 1. Health
r = s.get(f"{BASE}/health/")
check("health", r.status_code == 200 and r.json().get("status") == "ok")

# 2. Categories
r = s.get(f"{BASE}/categories/")
check("categories list", r.status_code == 200 and len(r.json()) >= 15, f"n={len(r.json())}")

# 3. Category detail
cat_slug = r.json()[0]["slug"]
r = s.get(f"{BASE}/categories/{cat_slug}/")
check("category detail", r.status_code == 200 and r.json()["slug"] == cat_slug)

# 4. Ingredients
r = s.get(f"{BASE}/ingredients/")
ingredients = r.json()
check("ingredients list", len(ingredients) >= 100, f"n={len(ingredients)}")
r = s.get(f"{BASE}/ingredients/categories/")
check("ingredient categories", len(r.json()) == 10)

# 5. Recipes list
r = s.get(f"{BASE}/recipes/?page_size=4")
data = r.json()
check("recipes list pagination", r.status_code == 200 and data["count"] >= 50, f"count={data['count']}")
check("recipe fields", all(k in data["results"][0] for k in ["total_time", "average_rating", "review_count", "is_favorite", "image", "difficulty"]))

# 6. Search across title
r = s.get(f"{BASE}/recipes/?search=plov")
check("search title plov", r.status_code == 200 and r.json()["count"] >= 1, f"count={r.json()['count']}")
r = s.get(f"{BASE}/recipes/?search=rice")
check("search ingredient rice", r.status_code == 200 and r.json()["count"] >= 1, f"count={r.json()['count']}")
r = s.get(f"{BASE}/recipes/?search=desserts")
check("search category desserts", r.status_code == 200 and r.json()["count"] >= 1)
r = s.get(f"{BASE}/recipes/?query=egg")
check("query filter", r.status_code == 200 and r.json()["count"] >= 1)

# 7. Filters
r = s.get(f"{BASE}/recipes/?category=uzbek-cuisine")
check("filter category uzbek", r.json()["count"] >= 6, f"count={r.json()['count']}")
r = s.get(f"{BASE}/recipes/?time_range=under-15")
under15 = r.json()["count"]
check("filter time under-15", r.status_code == 200 and under15 >= 1, f"count={under15}")
r = s.get(f"{BASE}/recipes/?diet=vegetarian")
veg = r.json()["count"]
check("filter diet vegetarian", veg >= 1, f"count={veg}")
r = s.get(f"{BASE}/recipes/?difficulty=easy&diet=vegetarian&category=breakfast")
check("filter combined AND", r.status_code == 200)
r = s.get(f"{BASE}/recipes/?diet=high-protein&max_time=30")
check("filter diet+max_time", r.status_code == 200)

# 8. Ordering by rating (Postgres puts NULL ratings first on DESC)
r = s.get(f"{BASE}/recipes/?ordering=-avg_rating&page_size=6")
ratings = [x["average_rating"] for x in r.json()["results"]]
non_null = [x for x in ratings if x is not None]
check("ordering by rating", len(non_null) == 0 or non_null == sorted(non_null, reverse=True), str(ratings[:3]))

# 9. Quick recipes (max_time 30)
r = s.get(f"{BASE}/recipes/?max_time=30&page_size=8")
check("quick recipes exposed", r.json()["count"] >= 5, f"count={r.json()['count']}")

# 10. Recipe detail
slug = data["results"][0]["slug"]
r = s.get(f"{BASE}/recipes/{slug}/")
detail = r.json()
check("recipe detail 200", r.status_code == 200)
check("detail ingredients", len(detail["ingredients"]) >= 1)
check("detail steps", len(detail["steps"]) >= 1)
r = s.get(f"{BASE}/recipes/does-not-exist/")
check("recipe 404", r.status_code == 404)

# 11. Match by ingredients
r = s.post(f"{BASE}/recipes/match-by-ingredients/", json={"ingredient_ids": [1, 2, 3]})
check("match endpoint", r.status_code == 200)
match_data = r.json()
check("match sorted desc", all(a["match_percentage"] >= b["match_percentage"] for a, b in zip(match_data["results"], match_data["results"][1:])), f"n={match_data['count']}")
check("match per-recipe fields", all(
    {"matched_ingredients", "missing_ingredients", "match_percentage", "available_count", "total_count"} <= set(x)
    for x in match_data["results"]
))
r = s.post(f"{BASE}/recipes/match-by-ingredients/", json={"ingredient_ids": []})
check("match empty ids", r.status_code == 200 and r.json()["count"] == 0)

# 12. Register (self-healing on rerun: existing smoke user -> login instead)
base_payload = {
    "name": "Smoke Tester", "email": "smoke@test.com", "password": "StrongPass123!", "password2": "StrongPass123!"
}
r = s.post(f"{BASE}/auth/register/", json=base_payload)
if r.status_code == 400:
    r = s.post(f"{BASE}/auth/login/", json={"email": "smoke@test.com", "password": "StrongPass123!"})
    check("rerun login", r.status_code == 200, str(r.json()))
else:
    check("register", r.status_code == 201, str(r.json()))
cookies = s.cookies.get_dict()
check("auth sets access cookie", "access_token" in cookies)
check("auth sets refresh cookie", "refresh_token" in cookies)
# Self-healing: clean prior-run leftovers so reruns stay deterministic.
for stale in s.get(f"{BASE}/recipes/my/").json()["results"]:
    if stale["title"].startswith("Smoke Test"):
        s.delete(f"{BASE}/recipes/{stale['slug']}/")
for fid in s.get(f"{BASE}/favorites/ids/").json()["recipe_ids"]:
    s.post(f"{BASE}/favorites/toggle/", json={"recipe_id": fid})

# 13. Duplicate email rejected
r = s.post(f"{BASE}/auth/register/", json={
    "name": "X", "email": "smoke@test.com", "password": "StrongPass123!", "password2": "StrongPass123!"
})
check("register dup email", r.status_code == 400)

# 14. Me
r = s.get(f"{BASE}/auth/me/")
check("me endpoint", r.status_code == 200 and r.json()["email"] == "smoke@test.com", str(r.json()))

# 15. Update profile
r = s.patch(f"{BASE}/auth/me/", json={"name": "Smoke Renamed", "bio": "Testing the profile update."})
check("profile update", r.status_code == 200 and r.json()["name"] == "Smoke Renamed")

# 16. Favorites toggle (use a fixed seeded recipe so reruns are deterministic)
all_recipes = s.get(f"{BASE}/recipes/?search=plov&page_size=1").json()["results"][0]
r = s.post(f"{BASE}/favorites/toggle/", json={"recipe_id": all_recipes["id"]})
check("favorite toggle on", r.status_code == 200 and r.json()["is_favorite"] is True, str(r.json()))
r = s.post(f"{BASE}/favorites/toggle/", json={"recipe_id": all_recipes["id"]})
check("favorite toggle off", r.json()["is_favorite"] is False)
r = s.post(f"{BASE}/favorites/toggle/", json={"recipe_id": all_recipes["id"]})
r = s.get(f"{BASE}/favorites/")
check("favorites list", r.status_code == 200 and r.json()["count"] == 1)
r = s.get(f"{BASE}/favorites/ids/")
check("favorite ids", r.json()["recipe_ids"] == [all_recipes["id"]])

# 17. Recipe appears as favorite in list
recs = s.get(f"{BASE}/recipes/?search=plov&page_size=50").json()["results"]
check("is_favorite reflects state", recs[0]["is_favorite"] is True)

# 18. Shopping list add + merge
r = s.get(f"{BASE}/recipes/{slug}/")
detail = r.json()
ing1 = detail["ingredients"][0]
r = s.post(f"{BASE}/shopping-list/", json={"name": ing1["name"], "quantity": "1", "unit": ing1["unit"]})
check("shopping add", r.status_code == 201)
r = s.post(f"{BASE}/shopping-list/", json={"name": ing1["name"], "quantity": "2", "unit": ing1["unit"]})
merged = r.json()
check("shopping merge same unit", float(merged["quantity"]) == 3.0, f"qty={merged['quantity']}")
# different unit => new line
r = s.post(f"{BASE}/shopping-list/", json={"name": ing1["name"], "quantity": "1", "unit": "kg"})
check("shopping different unit new line", r.status_code == 201 and r.json()["id"] != merged["id"])
# complete then further add => new line
item_id = merged["id"]
r = s.patch(f"{BASE}/shopping-list/{item_id}/", json={"is_completed": True})
check("shopping complete", r.status_code == 200 and r.json()["is_completed"] is True)
r2 = s.post(f"{BASE}/shopping-list/", json={"name": ing1["name"].lower(), "quantity": "1", "unit": ing1["unit"]})
check("shopping completed line not merged", r2.json()["id"] != item_id)

# 19. add-from-recipe
r = s.post(f"{BASE}/shopping-list/add-from-recipe/", json={"recipe_id": all_recipes["id"]})
check("add-from-recipe", r.status_code == 200, str(r.json()))

# 20. clear completed
r = s.post(f"{BASE}/shopping-list/clear-completed/")
check("clear completed", r.status_code == 200)

# 21. delete item
r = s.delete(f"{BASE}/shopping-list/{r2.json()['id']}/")
check("shopping delete", r.status_code == 200)

# 22. Review create/update
r = s.post(f"{BASE}/reviews/", json={"recipe_id": all_recipes["id"], "rating": 4, "comment": "Smoke test review."})
check("review create", r.status_code == 201, str(getattr(r, 'text', '')))
review_id = r.json()["id"]
r2 = s.post(f"{BASE}/reviews/", json={"recipe_id": all_recipes["id"], "rating": 5, "comment": "Updated by same user."})
check("review upsert same user", r2.status_code == 201 and r2.json()["id"] == review_id and r2.json()["rating"] == 5)

# 23. Average rating recalculates (a number in 1..5, existing seed reviews skew the exact value)
r = s.get(f"{BASE}/recipes/{all_recipes['slug']}/")
avg = r.json()["average_rating"]
check("avg rating recalc", avg is not None and 1.0 <= float(avg) <= 5.0, str(avg))
r = s.delete(f"{BASE}/reviews/{review_id}/")
check("review delete", r.status_code == 200)
r = s.get(f"{BASE}/recipes/{all_recipes['slug']}/")
check("avg rating after delete", r.json()["average_rating"] is not None and float(r.json()["average_rating"]) >= 1.0)

# 24. Create recipe with nested ingredients/steps
r = s.post(f"{BASE}/recipes/", json={
    "title": "Smoke Test Pizza",
    "description": "Created by the smoke test suite.",
    "category_id": None,
    "cooking_time": 20,
    "prep_time": 10,
    "servings": 2,
    "difficulty": "easy",
    "ingredients": [{"ingredient_id": ingredients[0]["id"], "quantity": "1", "unit": "pcs"}],
    "steps": [{"step_number": 1, "instruction": "Do the thing."}],
})
check("create recipe", r.status_code == 201, getattr(r, 'text', '')[:200])
new_slug = r.json()["slug"]

# 25. Non-owner can't edit
r = s.post(f"{BASE}/auth/logout/")
check("logout", r.status_code == 200)
r = s.post(f"{BASE}/auth/login/", json={"email": "doni@example.com", "password": "User@12345"})
check("login other user", r.status_code == 200)
rr = requests.patch(f"{BASE}/recipes/{new_slug}/", data={}, cookies=s.cookies.get_dict())
check("non-owner patch rejected", rr.status_code == 403, str(rr.status_code))
r = requests.put(f"{BASE}/recipes/{new_slug}/", json={
    "title": "Smoke Test Pizza 2", "description": "nope", "cooking_time": 10, "prep_time": 5,
    "servings": 1, "difficulty": "easy",
    "ingredients": [{"ingredient_id": ingredients[0]["id"], "quantity": "1", "unit": "pcs"}],
    "steps": [{"step_number": 1, "instruction": "Hi."}],
}, cookies=s.cookies.get_dict())
check("non-owner put rejected", r.status_code == 403, str(r.status_code))

# 26. Owner edits + deletes
r = s.post(f"{BASE}/auth/login/", json={"email": "smoke@test.com", "password": "StrongPass123!"})
check("relogin owner", r.status_code == 200)
r = s.put(f"{BASE}/recipes/{new_slug}/", json={
    "title": "Smoke Test Pizza 2", "description": "Edited by owner.", "cooking_time": 20, "prep_time": 10,
    "servings": 3, "difficulty": "medium",
    "ingredients": [{"ingredient_id": ingredients[0]["id"], "quantity": "2", "unit": "pcs"}],
    "steps": [{"step_number": 1, "instruction": "First step."}, {"step_number": 2, "instruction": "Second."}],
})
check("owner put edit", r.status_code == 200, getattr(r, 'text', '')[:200])
edited_slug = r.json()["slug"]
check("slug regenerated on edit", edited_slug != new_slug, edited_slug)
r = s.delete(f"{BASE}/recipes/{edited_slug}/")
check("owner delete", r.status_code == 200)

# 27. Guests cannot create
guest = requests.Session()
r = guest.post(f"{BASE}/recipes/", json={"title": "X", "cooking_time": 1})
check("guest create forbidden", r.status_code == 401 or r.status_code == 403, str(r.status_code))

# 28. Guest can read everything
r = guest.get(f"{BASE}/recipes/?page_size=2")
check("guest read recipes", r.status_code == 200)
r = guest.get(f"{BASE}/categories/")
check("guest read categories", r.status_code == 200)

# 29. Password reset request (console email)
r = guest.post(f"{BASE}/auth/password/reset/", json={"email": "smoke@test.com"})
check("password reset request", r.status_code == 200)

# 30. OpenAPI schema
r = s.get(f"{BASE}/schema/")
check("openapi schema", r.status_code == 200)

print()
if failures:
    print("FAILURES:", failures)
    sys.exit(1)
print("ALL SMOKE TESTS PASSED")