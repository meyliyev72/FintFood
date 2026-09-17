from django.urls import include, path

from rest_framework.routers import DefaultRouter

from .views import ShoppingListItemViewSet

router = DefaultRouter()
router.register("shopping-list", ShoppingListItemViewSet, basename="shopping-list")

urlpatterns = router.urls