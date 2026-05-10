from django import forms
from django.contrib import admin
from django.contrib.admin.actions import delete_selected
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.utils.html import mark_safe, format_html
from django.urls import reverse

from .models import User, MenuItem, Order, OrderItem


class UserCreationForm(forms.ModelForm):
    password1 = forms.CharField(label='Password', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Password confirmation', widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'middle_name', 'last_name', 'role', 'is_active', 'is_staff', 'is_superuser')

    def clean_password2(self):
        password1 = self.cleaned_data.get('password1')
        password2 = self.cleaned_data.get('password2')
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")
        return password2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data['password1'])
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    password = ReadOnlyPasswordHashField()

    class Meta:
        model = User
        fields = (
            'email', 'password', 'first_name', 'middle_name', 'last_name',
            'address', 'age', 'birthday', 'phone', 'role',
            'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions',
            'last_login', 'date_joined',
        )

    def clean_password(self):
        return self.initial['password']


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    actions = [delete_selected]
    actions_on_top = True
    actions_on_bottom = True
    list_display = ('email', 'first_name', 'last_name', 'role', 'is_staff', 'is_active', 'is_superuser', 'delete_user')
    list_display_links = ('email',)
    list_filter = ('role', 'is_staff', 'is_active', 'is_superuser')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    filter_horizontal = ('groups', 'user_permissions')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {
            'fields': (
                'first_name', 'middle_name', 'last_name',
                'address', 'age', 'birthday', 'phone', 'role',
            )
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    readonly_fields = ('last_login', 'date_joined')

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'first_name', 'middle_name', 'last_name',
                'role', 'password1', 'password2', 'is_active', 'is_staff', 'is_superuser',
            ),
        }),
    )

    def delete_user(self, obj):
        url = reverse('admin:kitchen_user_delete', args=[obj.pk])
        return format_html('<a class="deletelink" href="{}">Delete</a>', url)
    delete_user.short_description = 'Delete'


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
    list_display = ['id', 'order_image', 'table_number', 'customer_name', 'status', 'created_at', 'completed_at']
    list_filter = ['status']
    search_fields = ['customer_name', 'table_number']
    inlines = [OrderItemInline]
    readonly_fields = ['started_at', 'completed_at', 'preparation_time', 'total_price']

    def order_image(self, obj):
        first_item = obj.order_items.first()
        if first_item and first_item.menu_item.image:
            return mark_safe(
                f'<img src="{first_item.menu_item.image.url}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;" alt="{first_item.menu_item.name}" />'
            )
        return 'No image'
    order_image.short_description = 'Image'
    order_image.allow_tags = True


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'menu_item', 'quantity', 'subtotal']


admin.site.site_header = 'Kitchen Order Queue Administration'
admin.site.site_title = 'Kitchen Order Queue Admin'
admin.site.index_title = 'Administration'
admin.site.site_url = 'http://localhost:8000/'
