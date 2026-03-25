from django.db import models
from django.utils import timezone


class MenuItem(models.Model):
    """Represents a dish/item available on the menu."""
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    estimated_prep_time = models.PositiveIntegerField(
        help_text="Estimated preparation time in minutes", default=10
    )
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']


class Order(models.Model):
    """Represents a customer order with a kitchen queue status."""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('preparing', 'Preparing'),
        ('ready', 'Ready'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    table_number = models.PositiveIntegerField()
    customer_name = models.CharField(max_length=100, blank=True, default='')
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='pending'
    )
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    started_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When cooking started"
    )
    completed_at = models.DateTimeField(
        null=True, blank=True,
        help_text="When the order was completed or cancelled"
    )

    def __str__(self):
        return f"Order #{self.id} - Table {self.table_number} [{self.status}]"

    @property
    def preparation_time(self):
        """Returns total preparation time in seconds, or None if not complete."""
        if self.started_at and self.completed_at:
            delta = self.completed_at - self.started_at
            return int(delta.total_seconds())
        return None

    @property
    def total_price(self):
        return sum(item.subtotal for item in self.order_items.all())

    def advance_status(self):
        """Advance the order to the next logical status."""
        transitions = {
            'pending': 'preparing',
            'preparing': 'ready',
            'ready': 'completed',
        }
        new_status = transitions.get(self.status)
        if new_status is None:
            raise ValueError(f"Cannot advance order from status '{self.status}'")

        now = timezone.now()
        if new_status == 'preparing':
            self.started_at = now
        elif new_status in ('completed',):
            self.completed_at = now

        self.status = new_status
        self.save()
        return self

    def cancel(self):
        if self.status in ('completed', 'cancelled'):
            raise ValueError(f"Cannot cancel an order with status '{self.status}'")
        self.status = 'cancelled'
        self.completed_at = timezone.now()
        self.save()
        return self

    class Meta:
        ordering = ['created_at']


class OrderItem(models.Model):
    """A single line item within an order."""
    order = models.ForeignKey(
        Order, related_name='order_items', on_delete=models.CASCADE
    )
    menu_item = models.ForeignKey(
        MenuItem, related_name='order_items', on_delete=models.PROTECT
    )
    quantity = models.PositiveIntegerField(default=1)
    special_instructions = models.TextField(blank=True, default='')

    def __str__(self):
        return f"{self.quantity}x {self.menu_item.name} (Order #{self.order_id})"

    @property
    def subtotal(self):
        return self.menu_item.price * self.quantity

    class Meta:
        ordering = ['id']
