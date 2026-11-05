from django.apps import apps
from django.contrib import admin
for m in apps.get_app_config("api").get_models():
    admin.site.register(m)
