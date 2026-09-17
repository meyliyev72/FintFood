from django.shortcuts import get_object_or_404

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.recipes.models import Recipe

from .models import ShoppingListItem
from .serializers import AddFromRecipeSerializer, ShoppingListItemSerializer
from .services import merge_item


class ShoppingListItemViewSet(viewsets.ModelViewSet):
    serializer_class = ShoppingListItemSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return (
            ShoppingListItem.objects.filter(user=self.request.user)
            .select_related("ingredient__category")
            .order_by("is_completed", "name")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        item = self.get_object()
        item.delete()
        return Response({"detail": "Item removed."}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="add-from-recipe")
    def add_from_recipe(self, request):
        serializer = AddFromRecipeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        recipe = get_object_or_404(Recipe, pk=data["recipe_id"])

        recipe_ingredients = recipe.recipe_ingredients.select_related("ingredient").all()
        if data.get("ingredient_ids"):
            recipe_ingredients = recipe_ingredients.filter(
                ingredient_id__in=data["ingredient_ids"]
            )

        added = 0
        merged = 0
        for ri in recipe_ingredients:
            items = merge_item(
                request.user,
                ingredient=ri.ingredient,
                name=ri.ingredient.name,
                quantity=ri.quantity,
                unit=ri.unit,
            )
            for item in items:
                if getattr(item, "merge_created", False):
                    added += 1
                else:
                    merged += 1

        return Response(
            {"detail": f"Added {added} item(s) to your shopping list ({merged} merged)."},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["post"], url_path="clear-completed")
    def clear_completed(self, request):
        deleted, _ = self.get_queryset().filter(is_completed=True).delete()
        return Response(
            {"detail": f"Cleared {deleted} completed item(s)."},
            status=status.HTTP_200_OK,
        )