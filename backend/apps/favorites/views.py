from django.db.models import Prefetch

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.recipes.models import Recipe

from .models import Favorite
from .serializers import FavoriteSerializer, FavoriteToggleSerializer


class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        annotated = Recipe.objects.with_stats(user).select_related("category", "author")
        return (
            Favorite.objects.filter(user=user)
            .prefetch_related(Prefetch("recipe", queryset=annotated))
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=["post"])
    def toggle(self, request):
        serializer = FavoriteToggleSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return Response(result, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"])
    def ids(self, request):
        """Return the list of favorited recipe ids for the current user."""
        ids = list(
            Favorite.objects.filter(user=request.user).values_list("recipe_id", flat=True)
        )
        return Response({"recipe_ids": ids})