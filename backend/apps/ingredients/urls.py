from django.urls import path

from . import views

app_name = "ingredients"

urlpatterns = [
    path("ingredients/", views.IngredientListView.as_view(), name="list"),
    path("ingredients/categories/", views.IngredientCategoryListView.as_view(), name="categories"),
]