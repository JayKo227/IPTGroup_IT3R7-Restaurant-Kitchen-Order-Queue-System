from django.urls import path
from . import views

urlpatterns = [
    # ── Auth ──────────────────────────────────────────────────────────────────
    path('auth/login/',    views.LoginView.as_view(),    name='login'),
    path('auth/logout/',   views.LogoutView.as_view(),   name='logout'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/profile/',  views.ProfileView.as_view(),  name='profile'),

    # ── Dashboard ─────────────────────────────────────────────────────────────
    path('dashboard/', views.DashboardStatsView.as_view(), name='dashboard-stats'),

    # ── Menu Items ────────────────────────────────────────────────────────────
    path('menu-items/',      views.MenuItemListView.as_view(),   name='menu-item-list'),
    path('menu-items/<int:pk>/', views.MenuItemDetailView.as_view(), name='menu-item-detail'),

    # ── Orders ────────────────────────────────────────────────────────────────
    path('orders/',              views.OrderListView.as_view(),   name='order-list'),
    path('orders/<int:pk>/',     views.OrderDetailView.as_view(), name='order-detail'),
    path('orders/<int:pk>/status/', views.OrderStatusView.as_view(), name='order-status'),

    # ── Order Items ───────────────────────────────────────────────────────────
    path('orders/<int:order_pk>/items/',          views.OrderItemListView.as_view(),   name='order-item-list'),
    path('orders/<int:order_pk>/items/<int:pk>/', views.OrderItemDetailView.as_view(), name='order-item-detail'),
]