from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, MenuItem, Order, OrderItem


# ─── AUTH SERIALIZERS ──────────────────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('This account has been disabled.')
        data['user'] = user
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'address', 'age', 'birthday', 'phone', 'role', 'date_joined'
        ]
        read_only_fields = ['id', 'email', 'full_name', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, label='Confirm password')

    class Meta:
        model  = User
        fields = [
            'email', 'password', 'password2',
            'first_name', 'last_name', 'address',
            'age', 'birthday', 'phone', 'role'
        ]

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


# ─── EXISTING SERIALIZERS ──────────────────────────────────────────────────────

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MenuItem
        fields = ['id', 'name', 'description', 'price', 'estimated_prep_time', 'is_available', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError('Price must be greater than zero.')
        return value

    def validate_estimated_prep_time(self, value):
        if value <= 0:
            raise serializers.ValidationError('Prep time must be at least 1 minute.')
        return value


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name  = serializers.CharField(source='menu_item.name', read_only=True)
    menu_item_price = serializers.DecimalField(source='menu_item.price', max_digits=8, decimal_places=2, read_only=True)
    subtotal        = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model  = OrderItem
        fields = ['id', 'order', 'menu_item', 'menu_item_name', 'menu_item_price', 'quantity', 'special_instructions', 'subtotal']
        read_only_fields = ['id', 'order', 'menu_item_name', 'menu_item_price', 'subtotal']

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError('Quantity must be at least 1.')
        return value

    def validate_menu_item(self, value):
        if not value.is_available:
            raise serializers.ValidationError(f"'{value.name}' is not available.")
        return value


class OrderItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = OrderItem
        fields = ['menu_item', 'quantity', 'special_instructions']

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError('Quantity must be at least 1.')
        return value

    def validate_menu_item(self, value):
        if not value.is_available:
            raise serializers.ValidationError(f"'{value.name}' is not available.")
        return value


class OrderSerializer(serializers.ModelSerializer):
    order_items      = OrderItemSerializer(many=True, read_only=True)
    total_price      = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    preparation_time = serializers.IntegerField(read_only=True)
    status_display   = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model  = Order
        fields = [
            'id', 'table_number', 'customer_name', 'status', 'status_display',
            'notes', 'created_at', 'updated_at', 'started_at', 'completed_at',
            'preparation_time', 'total_price', 'order_items'
        ]
        read_only_fields = [
            'id', 'status', 'created_at', 'updated_at',
            'started_at', 'completed_at', 'preparation_time', 'total_price', 'status_display'
        ]

    def validate_table_number(self, value):
        if value <= 0:
            raise serializers.ValidationError('Table number must be positive.')
        return value


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True, write_only=True, required=False)

    class Meta:
        model  = Order
        fields = ['table_number', 'customer_name', 'notes', 'items']

    def validate_table_number(self, value):
        if value <= 0:
            raise serializers.ValidationError('Table number must be positive.')
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        order = Order.objects.create(**validated_data)
        for item_data in items_data:
            OrderItem.objects.create(order=order, **item_data)
        return order


class OrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Order
        fields = ['table_number', 'customer_name', 'notes']

    def validate_table_number(self, value):
        if value <= 0:
            raise serializers.ValidationError('Table number must be positive.')
        return value