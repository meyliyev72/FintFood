import os

from django.conf import settings
from django.core.wsgi import get_wsgi_application
from whitenoise import WhiteNoise

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.base")

application = WhiteNoise(
    get_wsgi_application(),
    root=str(settings.MEDIA_ROOT),
    prefix="media/",
)