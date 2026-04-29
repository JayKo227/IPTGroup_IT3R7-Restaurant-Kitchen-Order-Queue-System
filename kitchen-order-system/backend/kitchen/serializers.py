from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.mail import EmailMultiAlternatives, get_connection
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.auth.tokens import default_token_generator
from smtplib import SMTPAuthenticationError
from .models import User, MenuItem, Order, OrderItem


def get_frontend_url_from_context(context):
    frontend_url = getattr(settings, 'FRONTEND_URL', None)
    request = context.get('request') if context else None
    if not frontend_url and request is not None:
        frontend_url = request.headers.get('Origin') or request.META.get('HTTP_ORIGIN')
    if not frontend_url and request is not None:
        frontend_url = request.META.get('HTTP_REFERER')
    if not frontend_url and request is not None:
        scheme = 'https' if request.is_secure() else 'http'
        frontend_url = f"{scheme}://{request.get_host()}"
    if not frontend_url:
        frontend_url = 'http://localhost:5173'
    return frontend_url.rstrip('/')


# ─── AUTH SERIALIZERS ──────────────────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email    = data['email']
        password = data['password']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError('Invalid email or password.')

        if not user.is_active:
            raise serializers.ValidationError('Please activate your account via the email we sent you.')

        user = authenticate(request=self.context.get('request'), username=email, password=password)
        if not user:
            raise serializers.ValidationError('Invalid email or password.')

        data['user'] = user
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    full_name           = serializers.CharField(read_only=True)
    profile_picture     = serializers.FileField(required=False, allow_null=True)
    profile_picture_remove = serializers.BooleanField(write_only=True, required=False, default=False)
    profile_picture_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'first_name', 'middle_name', 'last_name', 'full_name',
            'address', 'age', 'birthday', 'phone', 'role',
            'profile_picture', 'profile_picture_remove', 'profile_picture_url', 'date_joined'
        ]
        read_only_fields = ['id', 'email', 'full_name', 'date_joined']

    def get_profile_picture_url(self, obj):
        if not obj.profile_picture:
            return None
        request = self.context.get('request') if hasattr(self, 'context') else None
        if request is not None:
            return request.build_absolute_uri(obj.profile_picture.url)
        return obj.profile_picture.url

    def update(self, instance, validated_data):
        remove_picture = validated_data.pop('profile_picture_remove', False)
        instance = super().update(instance, validated_data)
        if remove_picture:
            if instance.profile_picture:
                instance.profile_picture.delete(save=False)
            instance.profile_picture = None
            instance.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password        = serializers.CharField(write_only=True, min_length=6, validators=[validate_password])
    password2       = serializers.CharField(write_only=True, label='Confirm password')
    profile_picture = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model  = User
        fields = [
            'email', 'password', 'password2',
            'first_name', 'middle_name', 'last_name', 'address',
            'age', 'birthday', 'phone', 'role',
            'profile_picture',
        ]

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password        = validated_data.pop('password')
        profile_picture = validated_data.pop('profile_picture', None)

        user = User(**validated_data)
        user.set_password(password)
        user.is_active = False
        if profile_picture:
            user.profile_picture = profile_picture
        user.save()

        try:
            self._send_activation_email(user)
        except Exception:
            pass
        return user

    def _send_activation_email(self, user):
        uid             = urlsafe_base64_encode(force_bytes(user.pk))
        token           = default_token_generator.make_token(user)
        frontend_url    = get_frontend_url_from_context(self.context)
        activation_link = f"{frontend_url}/activate/{uid}/{token}/"

        context      = {'user': user, 'activation_link': activation_link}
        html_content = render_to_string('emails/activation_email.html', context)
        text_content = strip_tags(html_content)

        msg = EmailMultiAlternatives(
            subject    = 'Activate your KitchenOQ account',
            body       = text_content,
            from_email = settings.DEFAULT_FROM_EMAIL,
            to         = [user.email],
        )
        msg.attach_alternative(html_content, 'text/html')
        try:
            msg.send(fail_silently=False)
        except SMTPAuthenticationError:
            if settings.DEBUG:
                console_connection = get_connection('django.core.mail.backends.console.EmailBackend')
                msg.connection = console_connection
                msg.send()
            else:
                raise serializers.ValidationError({
                    'email': 'Gmail authentication failed. Use a valid Gmail address and Google App Password.'
                })
        except Exception as exc:
            raise serializers.ValidationError({'email': f'Unable to send activation email: {exc}'})


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError('No account found with that email address.')
        return value

    def save(self):
        user         = User.objects.get(email=self.validated_data['email'])
        uid          = urlsafe_base64_encode(force_bytes(user.pk))
        token        = default_token_generator.make_token(user)
        frontend_url = get_frontend_url_from_context(self.context)
        reset_link   = f"{frontend_url}/reset/{uid}/{token}/"

        context      = {'user': user, 'reset_link': reset_link}
        html_content = render_to_string('emails/password_reset_email.html', context)
        text_content = strip_tags(html_content)

        msg = EmailMultiAlternatives(
            subject    = 'Reset your KitchenOQ password',
            body       = text_content,
            from_email = settings.DEFAULT_FROM_EMAIL,
            to         = [user.email],
        )
        msg.attach_alternative(html_content, 'text/html')
        try:
            msg.send(fail_silently=False)
        except SMTPAuthenticationError:
            if settings.DEBUG:
                console_connection = get_connection('django.core.mail.backends.console.EmailBackend')
                msg.connection = console_connection
                msg.send()
            else:
                raise serializers.ValidationError({
                    'email': 'Gmail authentication failed. Use a valid Gmail address and Google App Password.'
                })
        except Exception as exc:
            raise serializers.ValidationError({'email': f'Unable to send reset email: {exc}'})
        return user


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid           = serializers.CharField()
    token         = serializers.CharField()
    new_password  = serializers.CharField(write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError({'new_password2': 'Passwords do not match.'})
        try:
            uid  = force_str(urlsafe_base64_decode(data['uid']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({'uid': 'Invalid password reset link.'})

        if not default_token_generator.check_token(user, data['token']):
            raise serializers.ValidationError({'token': 'Token is invalid or has expired.'})

        data['user'] = user
        return data

    def save(self):
        user = self.validated_data['user']
        user.set_password(self.validated_data['new_password'])
        user.is_active = True
        user.save()
        return user


class AccountActivationSerializer(serializers.Serializer):
    uid   = serializers.CharField()
    token = serializers.CharField()

    def validate(self, attrs):
        try:
            uid  = force_str(urlsafe_base64_decode(attrs['uid']))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({'uid': 'Invalid activation link.'})

        if not default_token_generator.check_token(user, attrs['token']):
            raise serializers.ValidationError({'token': 'Token is invalid or has expired.'})

        attrs['user'] = user
        return attrs

    def save(self):
        user           = self.validated_data['user']
        user.is_active = True
        user.save()
        return user


# ─── EXISTING SERIALIZERS ──────────────────────────────────────────────────────

class MenuItemSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model  = MenuItem
        fields = ['id', 'name', 'description', 'price', 'estimated_prep_time', 'is_available', 'image', 'image_url', 'created_at']
        read_only_fields = ['id', 'image_url', 'created_at']

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request') if hasattr(self, 'context') else None
        if request is not None:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url

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
    menu_item_image = serializers.SerializerMethodField()
    subtotal        = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model  = OrderItem
        fields = ['id', 'order', 'menu_item', 'menu_item_name', 'menu_item_price', 'menu_item_image', 'quantity', 'special_instructions', 'subtotal']
        read_only_fields = ['id', 'order', 'menu_item_name', 'menu_item_price', 'menu_item_image', 'subtotal']

    def get_menu_item_image(self, obj):
        if not obj.menu_item.image:
            return None
        request = self.context.get('request') if hasattr(self, 'context') else None
        if request is not None:
            return request.build_absolute_uri(obj.menu_item.image.url)
        return obj.menu_item.image.url

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