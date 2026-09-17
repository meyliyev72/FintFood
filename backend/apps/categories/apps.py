from django.apps import AppConfig


class CategoriesConfig(AppConfig):
    name = "apps.categories"
    verbose_name = "Categories"

    def ready(self):
        from . import signals  # noqa: F401