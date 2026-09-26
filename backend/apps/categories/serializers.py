from rest_framework import serializers

from apps.core.i18n import get_request_language, localized

from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    recipe_count = serializers.IntegerField(read_only=True, required=False)
    # Resolved per request language (?lang= / Accept-Language) so filter labels
    # and navigation read naturally in uz, ru and en.
    name = serializers.SerializerMethodField()
    name_en = serializers.CharField(read_only=True)
    description = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "name_en", "slug", "description", "image", "recipe_count"]

    def get_name(self, obj) -> str:
        return localized(obj, "name", self._language())

    def get_description(self, obj) -> str:
        return localized(obj, "description", self._language())

    def _language(self) -> str:
        return get_request_language(self.context.get("request"))

    def get_image(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url
