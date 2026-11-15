from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LanguageViewSet, ScriptViewSet

router = DefaultRouter()
router.register(r'languages', LanguageViewSet)
router.register(r'scripts', ScriptViewSet)

urlpatterns = [
    path('', include(router.urls)),
]