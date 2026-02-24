# finance/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum

from .models import MovimientoFinanciero, Prestamo
from .serializers import MovimientoSerializer, PrestamoSerializer

class MovimientoViewSet(viewsets.ModelViewSet):
    serializer_class = MovimientoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MovimientoFinanciero.objects.filter(
            usuario=self.request.user
        )
    @action(detail=False, methods=["get"])
    def balance(self, request):
        ingresos = MovimientoFinanciero.objects.filter(
            usuario=request.user,
            tipo_movimiento="pago_prestamo"
        ).aggregate(total=Sum("monto"))["total"] or 0

        gastos = MovimientoFinanciero.objects.filter(
            usuario=request.user
        ).exclude(
            tipo_movimiento="pago_prestamo"
        ).aggregate(total=Sum("monto"))["total"] or 0

        return Response({
            "ingresos": ingresos,
            "gastos": gastos,
            "balance": ingresos - gastos
        })


class PrestamoViewSet(viewsets.ModelViewSet):
    serializer_class = PrestamoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Prestamo.objects.filter(
            prestamista=self.request.user
        )

    @action(detail=True, methods=["post"])
    def pagar(self, request, pk=None):
        prestamo = self.get_object()
        monto_pago = float(request.data.get("monto"))

        if monto_pago <= 0:
            return Response({"error": "Monto inválido"}, status=400)

        if monto_pago > float(prestamo.saldo_pendiente):
            return Response({"error": "Excede saldo pendiente"}, status=400)

        prestamo.saldo_pendiente -= monto_pago
        prestamo.save()

        return Response({"message": "Pago registrado"})

