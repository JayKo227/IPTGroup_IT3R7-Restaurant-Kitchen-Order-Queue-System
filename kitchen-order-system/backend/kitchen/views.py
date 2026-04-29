from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db.models.deletion import ProtectedError

from .models import User, MenuItem, Order, OrderItem
from .serializers import (
    LoginSerializer, UserProfileSerializer, RegisterSerializer,
    AccountActivationSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    MenuItemSerializer, OrderSerializer, OrderCreateSerializer,
    OrderUpdateSerializer, OrderItemSerializer, OrderItemCreateSerializer,
)


# ─── AUTH VIEWS ────────────────────────────────────────────────────────────────

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user     = serializer.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user':  UserProfileSerializer(user).data,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({'message': 'Logged out successfully.'})


class RegisterView(APIView):
    permission_classes = [AllowAny]
    parser_classes     = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    'detail': 'Account created! Please check your email and click the activation link.',
                    'email':  user.email,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ActivateAccountView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AccountActivationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'detail': 'Account activated successfully! You can now sign in.'},
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    parser_classes     = [JSONParser]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response({'detail': 'Password reset email sent.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    parser_classes     = [JSONParser]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'detail': 'Password has been reset successfully.'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── MENU ITEM VIEWS ───────────────────────────────────────────────────────────

class MenuItemListView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        items = MenuItem.objects.all()
        return Response(MenuItemSerializer(items, many=True, context={'request': request}).data)

    def post(self, request):
        serializer = MenuItemSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MenuItemDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_object(self, pk):
        return get_object_or_404(MenuItem, pk=pk)

    def get(self, request, pk):
        return Response(MenuItemSerializer(self.get_object(pk), context={'request': request}).data)

    def put(self, request, pk):
        serializer = MenuItemSerializer(self.get_object(pk), data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        serializer = MenuItemSerializer(self.get_object(pk), data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        item = self.get_object(pk)
        name = item.name
        try:
            item.delete()
        except ProtectedError:
            return Response(
                {'error': 'Cannot delete this menu item because it is referenced by existing orders.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({'message': f"'{name}' deleted."})


# ─── ORDER VIEWS ───────────────────────────────────────────────────────────────

class OrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders       = Order.objects.prefetch_related('order_items__menu_item').all()
        order_status = request.query_params.get('status')
        if order_status:
            orders = orders.filter(status=order_status)
        return Response(OrderSerializer(orders, many=True, context={'request': request}).data)

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            order = serializer.save()
            return Response(OrderSerializer(order, context={'request': request}).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Order.objects.prefetch_related('order_items__menu_item'), pk=pk)

    def get(self, request, pk):
        return Response(OrderSerializer(self.get_object(pk), context={'request': request}).data)

    def patch(self, request, pk):
        order = self.get_object(pk)
        if order.status in ('completed', 'cancelled'):
            return Response({'error': f"Cannot edit a '{order.status}' order."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = OrderUpdateSerializer(order, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(OrderSerializer(order, context={'request': request}).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        order    = self.get_object(pk)
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
                return Response(OrderSerializer(order, context={'request': request}).data)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        elif action == 'cancel':
            try:
                order.cancel()
                return Response(OrderSerializer(order, context={'request': request}).data)
            except ValueError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'error': "Use 'advance' or 'cancel'."}, status=status.HTTP_400_BAD_REQUEST)


# ─── ORDER ITEM VIEWS ──────────────────────────────────────────────────────────

class OrderItemListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_pk):
        order = get_object_or_404(Order, pk=order_pk)
        return Response(OrderItemSerializer(order.order_items.select_related('menu_item').all(), many=True, context={'request': request}).data)

    def post(self, request, order_pk):
        order = get_object_or_404(Order, pk=order_pk)
        if order.status in ('completed', 'cancelled'):
            return Response({'error': f"Cannot add items to a '{order.status}' order."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = OrderItemCreateSerializer(data=request.data)
        if serializer.is_valid():
            item = serializer.save(order=order)
            return Response(OrderItemSerializer(item, context={'request': request}).data, status=status.HTTP_201_CREATED)
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
            return Response(OrderItemSerializer(item, context={'request': request}).data)
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