from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.shortcuts import get_object_or_404

from .models import User, MenuItem, Order, OrderItem
from .serializers import (
    LoginSerializer, UserProfileSerializer, RegisterSerializer,
    MenuItemSerializer, OrderSerializer, OrderCreateSerializer,
    OrderUpdateSerializer, OrderItemSerializer, OrderItemCreateSerializer,
)


# ─── AUTH VIEWS ────────────────────────────────────────────────────────────────

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user  = serializer.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserProfileSerializer(user).data,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({'message': 'Logged out successfully.'})


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user  = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserProfileSerializer(user).data,
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── MENU ITEM VIEWS ───────────────────────────────────────────────────────────

class MenuItemListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = MenuItem.objects.all()
        return Response(MenuItemSerializer(items, many=True).data)

    def post(self, request):
        serializer = MenuItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MenuItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(MenuItem, pk=pk)

    def get(self, request, pk):
        return Response(MenuItemSerializer(self.get_object(pk)).data)

    def put(self, request, pk):
        serializer = MenuItemSerializer(self.get_object(pk), data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        serializer = MenuItemSerializer(self.get_object(pk), data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        item = self.get_object(pk)
        name = item.name
        item.delete()
        return Response({'message': f"'{name}' deleted."})


# ─── ORDER VIEWS ───────────────────────────────────────────────────────────────

class OrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.prefetch_related('order_items__menu_item').all()
        order_status = request.query_params.get('status')
        if order_status:
            orders = orders.filter(status=order_status)
        return Response(OrderSerializer(orders, many=True).data)

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            order = serializer.save()
            return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Order.objects.prefetch_related('order_items__menu_item'), pk=pk)

    def get(self, request, pk):
        return Response(OrderSerializer(self.get_object(pk)).data)

    def patch(self, request, pk):
        order = self.get_object(pk)
        if order.status in ('completed', 'cancelled'):
            return Response({'error': f"Cannot edit a '{order.status}' order."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = OrderUpdateSerializer(order, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(OrderSerializer(order).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        order = self.get_object(pk)
        order_id = order.id
        order.delete()
        return Response({'message': f"Order #{order_id} deleted."})


class OrderStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        order  = get_object_or_404(Order, pk=pk)
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
        return Response({'error': "Use 'advance' or 'cancel'."}, status=status.HTTP_400_BAD_REQUEST)


# ─── ORDER ITEM VIEWS ──────────────────────────────────────────────────────────

class OrderItemListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_pk):
        order = get_object_or_404(Order, pk=order_pk)
        return Response(OrderItemSerializer(order.order_items.select_related('menu_item').all(), many=True).data)

    def post(self, request, order_pk):
        order = get_object_or_404(Order, pk=order_pk)
        if order.status in ('completed', 'cancelled'):
            return Response({'error': f"Cannot add items to a '{order.status}' order."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = OrderItemCreateSerializer(data=request.data)
        if serializer.is_valid():
            item = serializer.save(order=order)
            return Response(OrderItemSerializer(item).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, order_pk, pk):
        return get_object_or_404(OrderItem, pk=pk, order_id=order_pk)

    def delete(self, request, order_pk, pk):
        item = self.get_object(order_pk, pk)
        if item.order.status in ('completed', 'cancelled'):
            return Response({'error': 'Cannot remove items from a completed/cancelled order.'}, status=status.HTTP_400_BAD_REQUEST)
        item.delete()
        return Response({'message': 'Item removed.'})

    def patch(self, request, order_pk, pk):
        item = self.get_object(order_pk, pk)
        if item.order.status in ('completed', 'cancelled'):
            return Response({'error': 'Cannot modify items of a completed/cancelled order.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = OrderItemCreateSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(OrderItemSerializer(item).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── DASHBOARD ─────────────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'total_orders': Order.objects.count(),
            'pending':      Order.objects.filter(status='pending').count(),
            'preparing':    Order.objects.filter(status='preparing').count(),
            'ready':        Order.objects.filter(status='ready').count(),
            'completed':    Order.objects.filter(status='completed').count(),
            'cancelled':    Order.objects.filter(status='cancelled').count(),
        })