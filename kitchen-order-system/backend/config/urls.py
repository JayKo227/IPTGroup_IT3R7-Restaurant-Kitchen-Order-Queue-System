from django.contrib import admin
from django.urls import path, include
from rest_framework.response import Response
from rest_framework.decorators import api_view

@api_view(['GET'])
def api_root(request):
    return Response({
        'dashboard': 'http://127.0.0.1:8000/api/dashboard/',
        'menu-items': 'http://127.0.0.1:8000/api/menu-items/',
        'orders': 'http://127.0.0.1:8000/api/orders/',
    })

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/', api_root, name='api-root'),
    path('api/', include('kitchen.urls')),
    path('api-auth/', include('rest_framework.urls')),
]