from decimal import Decimal, ROUND_HALF_UP

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from django.db.models import Q

from .models import MovimientoFinanciero, Prestamo
from .serializers import MovimientoSerializer, PrestamoSerializer
from groups.models import ActividadServicio, PlanGrupal

class MovimientoViewSet(viewsets.ModelViewSet):
    serializer_class = MovimientoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return MovimientoFinanciero.objects.filter(
            usuario=self.request.user
        )

    def _round_money(self, value):
        return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def _build_payment_options(self, asignacion):
        servicio = asignacion.servicio
        precio_total = self._round_money(servicio.precio_actual())
        porcentaje_reserva = Decimal(str(servicio.porcentaje_reserva or 0))
        adelanto = self._round_money(precio_total * porcentaje_reserva / Decimal("100")) if porcentaje_reserva else Decimal("0.00")
        restante = self._round_money(precio_total - adelanto)

        base = f"{servicio.nombre} - {asignacion.actividad.titulo}"
        modalidad = servicio.modalidad_pago

        if modalidad in {
            servicio.MODALIDAD_PAGO_RESERVA,
            servicio.MODALIDAD_PAGO_RESERVA_PREVIO_SALDO,
            servicio.MODALIDAD_PAGO_RESERVA_TOTAL_PREVIO,
        } and adelanto > 0:
            options = [
                {
                    "tipo": "adelanto",
                    "label": "Adelanto",
                    "monto": adelanto,
                    "descripcion_sugerida": f"Adelanto de {base}",
                }
            ]
            if restante > 0:
                options.append(
                    {
                        "tipo": "restante",
                        "label": "Restante",
                        "monto": restante,
                        "descripcion_sugerida": f"Pago restante de {base}",
                    }
                )
            return options

        if modalidad == servicio.MODALIDAD_PAGO_CONTRAENTREGA:
            return [
                {
                    "tipo": "restante",
                    "label": "Restante",
                    "monto": precio_total,
                    "descripcion_sugerida": f"Pago contraentrega de {base}",
                }
            ]

        return [
            {
                "tipo": "pago_completo",
                "label": "Pago completo",
                "monto": precio_total,
                "descripcion_sugerida": f"Pago completo de {base}",
            }
        ]

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

    @action(detail=False, methods=["get"])
    def servicios_pendientes(self, request):
        user = request.user
        plan_id = request.query_params.get("plan_id")

        queryset = ActividadServicio.objects.filter(
            Q(actividad__plan__creado_por=user) | Q(actividad__plan__grupo__miembros__usuario=user),
            estado__in=["interes", "pendiente_confirmacion"],
        ).select_related(
            "servicio",
            "actividad",
            "actividad__plan",
        ).distinct()

        if plan_id:
            queryset = queryset.filter(actividad__plan_id=plan_id)

        data = []
        for asignacion in queryset.order_by("actividad__fecha_inicio", "id"):
            servicio = asignacion.servicio
            data.append(
                {
                    "asignacion_id": asignacion.id,
                    "actividad_id": asignacion.actividad_id,
                    "actividad_titulo": asignacion.actividad.titulo,
                    "estado": asignacion.estado,
                    "servicio_id": servicio.id,
                    "servicio_nombre": servicio.nombre,
                    "modalidad_pago": servicio.modalidad_pago,
                    "modalidad_pago_label": servicio.get_modalidad_pago_display(),
                    "precio_total": self._round_money(servicio.precio_actual()),
                    "payment_options": self._build_payment_options(asignacion),
                }
            )

        return Response(data)

    @action(detail=False, methods=["get"])
    def prestamo_contexto(self, request):
        user = request.user
        planes = (
            PlanGrupal.objects.filter(
                Q(creado_por=user) | Q(grupo__miembros__usuario=user),
                grupo__isnull=False,
            )
            .select_related("grupo")
            .prefetch_related("grupo__miembros__usuario")
            .distinct()
            .order_by("fecha_inicio", "id")
        )

        data = []
        for plan in planes:
            deudores = [
                {
                    "id": miembro.usuario_id,
                    "username": miembro.usuario.username,
                }
                for miembro in plan.grupo.miembros.filter(activo=True).select_related("usuario")
                if miembro.usuario_id != user.id
            ]
            data.append(
                {
                    "id": plan.id,
                    "nombre": plan.nombre,
                    "grupo_id": plan.grupo_id,
                    "grupo_nombre": plan.grupo.nombre,
                    "deudores": deudores,
                }
            )

        return Response(data)


class PrestamoViewSet(viewsets.ModelViewSet):
    serializer_class = PrestamoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Prestamo.objects.filter(
            prestamista=self.request.user
        )

    @action(detail=False, methods=["get"])
    def deudas(self, request):
        prestamos = Prestamo.objects.filter(
            deudor=request.user,
            saldo_pendiente__gt=0,
        ).select_related("prestamista", "grupo").order_by("-created_at")
        data = [
            {
                "id": prestamo.id,
                "grupo_id": prestamo.grupo_id,
                "grupo_nombre": prestamo.grupo.nombre,
                "prestamista_id": prestamo.prestamista_id,
                "prestamista_username": prestamo.prestamista.username,
                "monto": prestamo.monto,
                "saldo_pendiente": prestamo.saldo_pendiente,
            }
            for prestamo in prestamos
        ]
        return Response(data)

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

