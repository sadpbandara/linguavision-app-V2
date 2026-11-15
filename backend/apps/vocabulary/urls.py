from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VocabularyViewSet, VocabularyCategoryViewSet

router = DefaultRouter()
router.register(r'vocabulary', VocabularyViewSet)
router.register(r'categories', VocabularyCategoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
]