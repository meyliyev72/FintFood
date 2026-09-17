from rest_framework.routers import DefaultRouter

from .views import RecipeViewSet, ReportViewSet

router = DefaultRouter()
router.register("recipes", RecipeViewSet, basename="recipes")
router.register("reports", ReportViewSet, basename="reports")

urlpatterns = router.urls