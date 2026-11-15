from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API Routes
    path('api/v1/learning/', include('apps.learning.urls')),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.languages.urls')),
    path('api/v1/', include('apps.vocabulary.urls')),
    path('api/v1/imports/', include('apps.imports.urls')),

]

# Media files URL configuration for development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
