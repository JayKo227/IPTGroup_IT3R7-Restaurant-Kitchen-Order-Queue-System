from django.contrib import admin
from .models import MenuItem, Order, OrderItem


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'estimated_prep_time', 'is_available', 'created_at']
    list_filter = ['is_available']
    search_fields = ['name']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['subtotal']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'table_number', 'customer_name', 'status', 'created_at', 'completed_at']
    list_filter = ['status']
    search_fields = ['customer_name', 'table_number']
    inlines = [OrderItemInline]
    readonly_fields = ['started_at', 'completed_at', 'preparation_time', 'total_price']


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'menu_item', 'quantity', 'subtotal']
