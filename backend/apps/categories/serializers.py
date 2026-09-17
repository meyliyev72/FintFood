from rest_framework import serializers

from .models import Category


class CategorySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    recipe_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "image", "recipe_count"]

    def get_image(self, obj):
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url