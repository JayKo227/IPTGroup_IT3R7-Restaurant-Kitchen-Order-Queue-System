from rest_framework import serializers
from .models import MenuItem, Order, OrderItem


class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = [
            'id', 'name', 'description', 'price',
            'estimated_prep_time', 'is_available', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than zero.")
        return value

    def validate_estimated_prep_time(self, value):
        if value <= 0:
            raise serializers.ValidationError("Preparation time must be at least 1 minute.")
        return value


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    menu_item_price = serializers.DecimalField(
        source='menu_item.price', max_digits=8, decimal_places=2, read_only=True
    )
    subtotal = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = OrderItem
        fields = [
            'id', 'order', 'menu_item', 'menu_item_name',
            'menu_item_price', 'quantity', 'special_instructions', 'subtotal'
        ]
        read_only_fields = ['id', 'order', 'menu_item_name', 'menu_item_price', 'subtotal']

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value

    def validate_menu_item(self, value):
        if not value.is_available:
            raise serializers.ValidationError(
                f"'{value.name}' is currently not available."
            )
        return value


class OrderItemCreateSerializer(serializers.ModelSerializer):
    """Used when creating order items nested within an order."""
    class Meta:
        model = OrderItem
        fields = ['menu_item', 'quantity', 'special_instructions']

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value

    def validate_menu_item(self, value):
        if not value.is_available:
            raise serializers.ValidationError(
                f"'{value.name}' is currently not available."
            )
        return value


class OrderSerializer(serializers.ModelSerializer):
    order_items = OrderItemSerializer(many=True, read_only=True)
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    preparation_time = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'table_number', 'customer_name', 'status', 'status_display',
            'notes', 'created_at', 'updated_at', 'started_at', 'completed_at',
            'preparation_time', 'total_price', 'order_items'
        ]
        read_only_fields = [
            'id', 'status', 'created_at', 'updated_at',
            'started_at', 'completed_at', 'preparation_time', 'total_price',
            'status_display'
        ]

    def validate_table_number(self, value):
        if value <= 0:
            raise serializers.ValidationError("Table number must be positive.")
        return value


class OrderCreateSerializer(serializers.ModelSerializer):
    """Handles order creation with nested items."""
    items = OrderItemCreateSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Order
        fields = ['table_number', 'customer_name', 'notes', 'items']

    def validate_table_number(self, value):
        if value <= 0:
            raise serializers.ValidationError("Table number must be positive.")
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order


class OrderUpdateSerializer(serializers.ModelSerializer):
    """Allows updating mutable fields of an existing order."""
    class Meta:
        model = Order
        fields = ['table_number', 'customer_name', 'notes']

    def validate_table_number(self, value):
        if value <= 0:
            raise serializers.ValidationError("Table number must be positive.")
        return value
