from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import MenuItem, Order, OrderItem
from .serializers import (
    MenuItemSerializer,
    OrderSerializer,
    OrderCreateSerializer,
    OrderUpdateSerializer,
    OrderItemSerializer,
    OrderItemCreateSerializer,
)


# ─── MENU ITEM VIEWS ───────────────────────────────────────────────────────────

class MenuItemListView(APIView):
    """GET all menu items / POST create a new menu item."""

    def get(self, request):
        items = MenuItem.objects.all()
        serializer = MenuItemSerializer(items, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = MenuItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MenuItemDetailView(APIView):
    """GET / PUT / DELETE a single menu item."""

    def get_object(self, pk):
        return get_object_or_404(MenuItem, pk=pk)

    def get(self, request, pk):
        item = self.get_object(pk)
        serializer = MenuItemSerializer(item)
        return Response(serializer.data)

    def put(self, request, pk):
        item = self.get_object(pk)
        serializer = MenuItemSerializer(item, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        item = self.get_object(pk)
        serializer = MenuItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        item = self.get_object(pk)
        item.delete()
        return Response(
            {'message': f"Menu item '{item.name}' deleted successfully."},
            status=status.HTTP_200_OK
        )


# ─── ORDER VIEWS ───────────────────────────────────────────────────────────────

class OrderListView(APIView):
    """GET all orders (filterable) / POST create a new order."""

    def get(self, request):
        orders = Order.objects.prefetch_related('order_items__menu_item').all()

        # Optional filter by status
        order_status = request.query_params.get('status')
        if order_status:
            valid_statuses = [s[0] for s in Order.STATUS_CHOICES]
            if order_status not in valid_statuses:
                return Response(
                    {'error': f"Invalid status. Choose from: {valid_statuses}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            orders = orders.filter(status=order_status)

        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            order = serializer.save()
            # Return full representation
            return Response(
                OrderSerializer(order).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailView(APIView):
    """GET / PUT / DELETE a single order."""

    def get_object(self, pk):
        return get_object_or_404(
            Order.objects.prefetch_related('order_items__menu_item'), pk=pk
        )

    def get(self, request, pk):
        order = self.get_object(pk)
        serializer = OrderSerializer(order)
        return Response(serializer.data)

    def put(self, request, pk):
        order = self.get_object(pk)
        if order.status in ('completed', 'cancelled'):
            return Response(
                {'error': f"Cannot edit an order with status '{order.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = OrderUpdateSerializer(order, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(OrderSerializer(order).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        order = self.get_object(pk)
        if order.status in ('completed', 'cancelled'):
            return Response(
                {'error': f"Cannot edit an order with status '{order.status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = OrderUpdateSerializer(order, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(OrderSerializer(order).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        order = self.get_object(pk)
        order_id = order.id
        order.delete()
        return Response(
            {'message': f"Order #{order_id} deleted successfully."},
            status=status.HTTP_200_OK
        )


class OrderStatusView(APIView):
    """POST to advance status or cancel an order."""

    def post(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        action = request.data.get('action')

        if action == 'advance':
            try:
                order.advance_status()
                return Response(OrderSerializer(order).data)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        elif action == 'cancel':
            try:
                order.cancel()
                return Response(OrderSerializer(order).data)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        else:
            return Response(
                {'error': "Invalid action. Use 'advance' or 'cancel'."},
                status=status.HTTP_400_BAD_REQUEST
            )


# ─── ORDER ITEM VIEWS ──────────────────────────────────────────────────────────

class OrderItemListView(APIView):
    """GET all items for an order / POST add an item to an order."""

    def get(self, request, order_pk):
        order = get_object_or_404(Order, pk=order_pk)
        items = order.order_items.select_related('menu_item').all()
        serializer = OrderItemSerializer(items, many=True)
        return Response(serializer.data)

    def post(self, request, order_pk):
        order = get_object_or_404(Order, pk=order_pk)
        if order.status in ('completed', 'cancelled'):
            return Response(
                {'error': f"Cannot add items to a '{order.status}' order."},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = OrderItemCreateSerializer(data=request.data)
        if serializer.is_valid():
            item = serializer.save(order=order)
            return Response(
                OrderItemSerializer(item).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderItemDetailView(APIView):
    """GET / PUT / DELETE a single order item."""

    def get_object(self, order_pk, pk):
        order = get_object_or_404(Order, pk=order_pk)
        return get_object_or_404(OrderItem, pk=pk, order=order)

    def get(self, request, order_pk, pk):
        item = self.get_object(order_pk, pk)
        serializer = OrderItemSerializer(item)
        return Response(serializer.data)

    def put(self, request, order_pk, pk):
        item = self.get_object(order_pk, pk)
        if item.order.status in ('completed', 'cancelled'):
            return Response(
                {'error': "Cannot modify items of a completed or cancelled order."},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = OrderItemCreateSerializer(item, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(OrderItemSerializer(item).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, order_pk, pk):
        item = self.get_object(order_pk, pk)
        if item.order.status in ('completed', 'cancelled'):
            return Response(
                {'error': "Cannot modify items of a completed or cancelled order."},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer = OrderItemCreateSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(OrderItemSerializer(item).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, order_pk, pk):
        item = self.get_object(order_pk, pk)
        if item.order.status in ('completed', 'cancelled'):
            return Response(
                {'error': "Cannot remove items from a completed or cancelled order."},
                status=status.HTTP_400_BAD_REQUEST
            )
        item.delete()
        return Response(
            {'message': "Order item removed successfully."},
            status=status.HTTP_200_OK
        )


# ─── DASHBOARD STATS ───────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    """Returns summary statistics for the kitchen dashboard."""

    def get(self, request):
        stats = {
            'total_orders': Order.objects.count(),
            'pending': Order.objects.filter(status='pending').count(),
            'preparing': Order.objects.filter(status='preparing').count(),
            'ready': Order.objects.filter(status='ready').count(),
            'completed': Order.objects.filter(status='completed').count(),
            'cancelled': Order.objects.filter(status='cancelled').count(),
        }
        return Response(stats)
