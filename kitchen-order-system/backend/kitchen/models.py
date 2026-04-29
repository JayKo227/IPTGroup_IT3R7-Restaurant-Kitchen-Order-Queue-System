from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    email           = models.EmailField(unique=True)
    first_name      = models.CharField(max_length=100)
    middle_name     = models.CharField(max_length=100, blank=True, default='')
    last_name       = models.CharField(max_length=100)
    address         = models.TextField(blank=True, default='')
    age             = models.PositiveIntegerField(null=True, blank=True)
    birthday        = models.DateField(null=True, blank=True)
    phone           = models.CharField(max_length=20, blank=True, default='')
    profile_picture = models.FileField(upload_to='profile_pictures/', null=True, blank=True)
    role            = models.CharField(
        max_length=20,
        choices=[('admin', 'Admin'), ('staff', 'Staff'), ('chef', 'Chef')],
        default='staff'
    )
    is_active   = models.BooleanField(default=False)
    is_staff    = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def __str__(self):
        name_parts = [self.first_name, self.middle_name, self.last_name]
        full_name = ' '.join(part for part in name_parts if part).strip()
        return f"{full_name} <{self.email}>"

    @property
    def full_name(self):
        name_parts = [self.first_name, self.middle_name, self.last_name]
        return ' '.join(part for part in name_parts if part).strip()

    @property
    def profile_picture_url(self):
        if self.profile_picture:
            return self.profile_picture.url
        return None

    class Meta:
        ordering = ['first_name']


class MenuItem(models.Model):
    name                = models.CharField(max_length=100)
    description         = models.TextField(blank=True)
    price               = models.DecimalField(max_digits=8, decimal_places=2)
    estimated_prep_time = models.PositiveIntegerField(default=10)
    is_available        = models.BooleanField(default=True)
    image               = models.FileField(upload_to='menu_item_images/', null=True, blank=True)
    created_at          = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    @property
    def image_url(self):
        if self.image:
            return self.image.url
        return None

    class Meta:
        ordering = ['name']


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('preparing', 'Preparing'),
        ('ready',     'Ready'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    table_number  = models.PositiveIntegerField()
    customer_name = models.CharField(max_length=100, blank=True, default='')
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes         = models.TextField(blank=True, default='')
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)
    started_at    = models.DateTimeField(null=True, blank=True)
    completed_at  = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Order #{self.id} - Table {self.table_number} [{self.status}]"

    @property
    def preparation_time(self):
        if self.started_at and self.completed_at:
            return int((self.completed_at - self.started_at).total_seconds())
        return None

    @property
    def total_price(self):
        return sum(item.subtotal for item in self.order_items.all())

    def advance_status(self):
        transitions = {'pending': 'preparing', 'preparing': 'ready', 'ready': 'completed'}
        new_status = transitions.get(self.status)
        if new_status is None:
            raise ValueError(f"Cannot advance from '{self.status}'")
        now = timezone.now()
        if new_status == 'preparing':
            self.started_at = now
        elif new_status == 'completed':
            self.completed_at = now
        self.status = new_status
        self.save()
        return self

    def cancel(self):
        if self.status in ('completed', 'cancelled'):
            raise ValueError(f"Cannot cancel a '{self.status}' order")
        self.status = 'cancelled'
        self.completed_at = timezone.now()
        self.save()
        return self

    class Meta:
        ordering = ['created_at']


class OrderItem(models.Model):
    order                = models.ForeignKey(Order, related_name='order_items', on_delete=models.CASCADE)
    menu_item            = models.ForeignKey(MenuItem, related_name='order_items', on_delete=models.PROTECT)
    quantity             = models.PositiveIntegerField(default=1)
    special_instructions = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.quantity}x {self.menu_item.name} (Order #{self.order_id})"

    @property
    def subtotal(self):
        return self.menu_item.price * self.quantity

    class Meta:
        ordering = ['id']