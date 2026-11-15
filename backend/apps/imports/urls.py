from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ImportJobViewSet, download_excel_template, download_zip_template

router = DefaultRouter()
router.register(r'jobs', ImportJobViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('template/excel/', download_excel_template, name='template-excel'),
    path('template/zip/', download_zip_template, name='template-zip'),
]