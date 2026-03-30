from decimal import Decimal, ROUND_HALF_UP

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from finance.models import DivisionMovimiento, MovimientoFinanciero, Prestamo
from .models import (
    ActividadPlan,
    ActividadServicio,
    ConfirmacionServicioIntegrante,
    Grupo,
    MiembroGrupo,
    ParticipacionPlan,
    PlanGrupal,
    SolicitudCambioPlan,
    VotoCambioPlan,
)
from .serializers import (
    ActividadPlanSerializer,
    ActividadServicioSerializer,
    ConfirmacionServicioIntegranteSerializer,
    GrupoSerializer,
    GrupoMemberSerializer,
    ParticipacionPlanSerializer,
    PlanGrupalSerializer,
    SolicitudCambioPlanSerializer,
)


class GrupoViewSet(viewsets.ModelViewSet):
    serializer_class = GrupoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Grupo.objects.filter(miembros__usuario=self.request.user).distinct()

    @action(detail=True, methods=["post"])
    def invitar(self, request, pk=None):
        grupo = self.get_object()
        user_id = request.data.get("user_id")
        if not MiembroGrupo.objects.filter(grupo=grupo, usuario=request.user, rol="admin").exists():
            return Response({"error": "Solo admin puede invitar."}, status=403)
        MiembroGrupo.objects.create(grupo=grupo, usuario_id=user_id)
        return Response({"message": "Usuario invitado"})

    @action(detail=True, methods=["get"])
    def miembros(self, request, pk=None):
        grupo = self.get_object()
        miembros = grupo.miembros.filter(activo=True).select_related("usuario", "usuario__persona_profile").order_by("-rol", "id")
        serializer = GrupoMemberSerializer(miembros, many=True, context={"request": request})
        return Response(
            {
                "id": grupo.id,
                "nombre": grupo.nombre,
                "descripcion": grupo.descripcion,
                "lider_id": grupo.creado_por_id,
                "miembros": serializer.data,
            }
        )


class PlanGrupalViewSet(viewsets.ModelViewSet):
    serializer_class = PlanGrupalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return PlanGrupal.objects.filter(Q(creado_por=user) | Q(grupo__miembros__usuario=user)).distinct()

    def _tiene_servicios_confirmados(self, plan):
        return ActividadServicio.objects.filter(actividad__plan=plan, estado="confirmado").exists()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        if self._tiene_servicios_confirmados(instance):
            return Response(
                {"error": "No se puede modificar un plan con servicios confirmados."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if instance.tipo_plan == "grupal":
            allowed = {"nombre", "descripcion", "fecha_inicio", "fecha_fin", "estado"}
            cambios = {k: v for k, v in request.data.items() if k in allowed}
            if not cambios:
                return Response({"error": "No hay cambios validos para solicitar."}, status=400)
            solicitud = SolicitudCambioPlan.objects.create(
                plan=instance,
                solicitado_por=request.user,
                cambios=cambios,
            )
            for miembro in MiembroGrupo.objects.filter(grupo=instance.grupo, activo=True):
                VotoCambioPlan.objects.create(
                    solicitud=solicitud,
                    usuario=miembro.usuario,
                    aprobado=(miembro.usuario_id == request.user.id),
                    fecha_voto=timezone.now() if miembro.usuario_id == request.user.id else None,
                )
            return Response(
                {
                    "message": "Cambio propuesto. Se requiere aprobacion de todos los miembros.",
                    "solicitud_id": solicitud.id,
                },
                status=status.HTTP_202_ACCEPTED,
            )
        return super().update(request, partial=partial, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def confirmar(self, request, pk=None):
        plan = self.get_object()
        if plan.tipo_plan == "grupal" and not MiembroGrupo.objects.filter(
            grupo=plan.grupo,
            usuario=request.user,
            rol="admin",
        ).exists():
            return Response({"error": "Solo admin puede confirmar."}, status=403)
        plan.estado = "confirmado"
        plan.save()
        return Response({"message": "Plan confirmado"})

    @action(detail=True, methods=["get"])
    def organigrama(self, request, pk=None):
        plan = self.get_object()
        actividades = ActividadPlan.objects.filter(plan=plan).prefetch_related("servicios_asignados__servicio")
        tree = []
        for actividad in actividades:
            servicios = actividad.servicios_asignados.filter(estado="confirmado")
            tree.append(
                {
                    "actividad_id": actividad.id,
                    "titulo": actividad.titulo,
                    "fecha_inicio": actividad.fecha_inicio,
                    "fecha_fin": actividad.fecha_fin,
                    "servicios": [
                        {
                            "id": s.id,
                            "servicio_id": s.servicio_id,
                            "servicio_nombre": s.servicio.nombre,
                            "estado": s.estado,
                            "fecha_inicio": s.fecha_inicio,
                            "fecha_fin": s.fecha_fin,
                        }
                        for s in servicios
                    ],
                }
            )
        return Response({"plan_id": plan.id, "nombre": plan.nombre, "organigrama": tree})


class ActividadPlanViewSet(viewsets.ModelViewSet):
    serializer_class = ActividadPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ActividadPlan.objects.filter(Q(plan__creado_por=user) | Q(plan__grupo__miembros__usuario=user)).distinct()

    def perform_create(self, serializer):
        plan = serializer.validated_data["plan"]
        if ActividadServicio.objects.filter(actividad__plan=plan, estado="confirmado").exists():
            from rest_framework.exceptions import ValidationError

            raise ValidationError("No se puede modificar actividades con servicios confirmados.")
        serializer.save()


class ActividadServicioViewSet(viewsets.ModelViewSet):
    serializer_class = ActividadServicioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ActividadServicio.objects.filter(
            Q(actividad__plan__creado_por=user) | Q(actividad__plan__grupo__miembros__usuario=user)
        ).distinct()

    def perform_create(self, serializer):
        asignacion = serializer.save()
        plan = asignacion.actividad.plan
        if plan.tipo_plan == "grupal" and plan.grupo_id:
            miembros = MiembroGrupo.objects.filter(grupo=plan.grupo, activo=True)
            for miembro in miembros:
                ConfirmacionServicioIntegrante.objects.create(
                    asignacion=asignacion,
                    usuario=miembro.usuario,
                    estado="aceptado" if miembro.usuario_id == self.request.user.id else "pendiente",
                    fecha_respuesta=timezone.now() if miembro.usuario_id == self.request.user.id else None,
                    mensaje=(
                        f"Confirma el servicio '{asignacion.servicio.nombre}' "
                        f"para la actividad '{asignacion.actividad.titulo}'."
                    ),
                )

    def _dividir_monto(self, monto_total, usuarios):
        cantidad = len(usuarios)
        if cantidad == 0:
            return {}

        base = (monto_total / cantidad).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        montos = [base for _ in usuarios]
        diferencia = monto_total - (base * cantidad)
        centavos_restantes = int((diferencia * 100).to_integral_value())

        for indice in range(abs(centavos_restantes)):
            montos[indice] += Decimal("0.01") if centavos_restantes > 0 else Decimal("-0.01")

        return {usuario.id: monto for usuario, monto in zip(usuarios, montos)}

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def confirmar_pago(self, request, pk=None):
        asignacion = self.get_object()
        plan = asignacion.actividad.plan
        grupo = plan.grupo

        if asignacion.movimiento_pago_id:
            return Response({"error": "Este servicio ya tiene un pago registrado."}, status=400)

        monto_servicio = asignacion.servicio.precio_actual()
        movimiento = MovimientoFinanciero.objects.create(
            usuario=request.user,
            grupo=grupo,
            plan_grupal=plan,
            tipo_movimiento="gasto_grupal" if grupo else "gasto_individual",
            descripcion=f"Pago de {asignacion.servicio.nombre} para {asignacion.actividad.titulo}",
            monto=monto_servicio,
            fecha=timezone.now().date(),
        )

        if grupo:
            miembros = list(grupo.miembros.filter(activo=True).select_related("usuario").order_by("id"))
            usuarios_grupo = [miembro.usuario for miembro in miembros]
            montos_por_usuario = self._dividir_monto(monto_servicio, usuarios_grupo)

            DivisionMovimiento.objects.bulk_create(
                [
                    DivisionMovimiento(
                        movimiento=movimiento,
                        usuario=miembro.usuario,
                        monto_asignado=montos_por_usuario[miembro.usuario_id],
                    )
                    for miembro in miembros
                ]
            )

            Prestamo.objects.bulk_create(
                [
                    Prestamo(
                        grupo=grupo,
                        prestamista=request.user,
                        deudor=miembro.usuario,
                        monto=montos_por_usuario[miembro.usuario_id],
                        saldo_pendiente=montos_por_usuario[miembro.usuario_id],
                    )
                    for miembro in miembros
                    if miembro.usuario_id != request.user.id
                ]
            )

        asignacion.movimiento_pago = movimiento
        asignacion.estado = "confirmado"
        asignacion.save(update_fields=["movimiento_pago", "estado"])
        return Response(
            {
                "message": "Servicio confirmado despues del pago.",
                "movimiento_id": movimiento.id,
                "monto": movimiento.monto,
                "tipo_movimiento": movimiento.tipo_movimiento,
            }
        )

    @action(detail=True, methods=["post"])
    def cancelar(self, request, pk=None):
        asignacion = self.get_object()
        asignacion.estado = "cancelado"
        asignacion.save(update_fields=["estado"])
        return Response({"message": "Servicio cancelado.", "estado": asignacion.estado})


class ConfirmacionServicioIntegranteViewSet(viewsets.ModelViewSet):
    serializer_class = ConfirmacionServicioIntegranteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ConfirmacionServicioIntegrante.objects.filter(usuario=self.request.user).select_related(
            "asignacion__servicio",
            "asignacion__actividad__plan",
        )

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def responder(self, request, pk=None):
        confirmacion = self.get_object()
        decision = request.data.get("decision")
        if decision not in {"aceptado", "rechazado"}:
            return Response({"error": "decision debe ser aceptado o rechazado."}, status=400)
        confirmacion.estado = decision
        confirmacion.fecha_respuesta = timezone.now()
        confirmacion.save()
        asignacion = confirmacion.asignacion
        confirmaciones = asignacion.confirmaciones.all()
        if confirmaciones.filter(estado="rechazado").exists():
            asignacion.estado = "cancelado"
        elif confirmaciones.exclude(estado="aceptado").exists():
            asignacion.estado = "pendiente_confirmacion"
        else:
            asignacion.estado = "confirmado"
        asignacion.save(update_fields=["estado"])
        return Response({"message": "Respuesta registrada.", "estado_asignacion": asignacion.estado})


class SolicitudCambioPlanViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SolicitudCambioPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return SolicitudCambioPlan.objects.filter(plan__grupo__miembros__usuario=user).distinct()

    @action(detail=True, methods=["post"])
    @transaction.atomic
    def aprobar(self, request, pk=None):
        solicitud = self.get_object()
        voto = solicitud.votos.filter(usuario=request.user).first()
        if not voto:
            return Response({"error": "No puedes votar esta solicitud."}, status=403)
        voto.aprobado = True
        voto.fecha_voto = timezone.now()
        voto.save()
        if not solicitud.votos.filter(aprobado__isnull=True).exists() and not solicitud.votos.filter(aprobado=False).exists():
            plan = solicitud.plan
            if ActividadServicio.objects.filter(actividad__plan=plan, estado="confirmado").exists():
                return Response(
                    {"error": "El plan tiene servicios confirmados y ya no puede cambiarse."},
                    status=400,
                )
            for field, value in solicitud.cambios.items():
                setattr(plan, field, value)
            plan.save()
            solicitud.estado = "aprobado"
            solicitud.save()
        return Response({"message": "Voto registrado."})


class ParticipacionPlanViewSet(viewsets.ModelViewSet):
    serializer_class = ParticipacionPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ParticipacionPlan.objects.filter(usuario=self.request.user)
