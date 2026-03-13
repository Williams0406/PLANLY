from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import (
    ActividadPlan,
    ActividadServicio,
    Grupo,
    MiembroGrupo,
    ParticipacionPlan,
    PlanGrupal,
    SolicitudCambioPlan,
    VotoCambioPlan,
)
from .permissions import EsAdminDelGrupo
from .serializers import (
    ActividadPlanSerializer,
    ActividadServicioSerializer,
    GrupoSerializer,
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
                return Response({"error": "No hay cambios válidos para solicitar."}, status=400)

            solicitud = SolicitudCambioPlan.objects.create(
                plan=instance,
                solicitado_por=request.user,
                cambios=cambios,
            )
            miembros = MiembroGrupo.objects.filter(grupo=instance.grupo, activo=True)
            for miembro in miembros:
                VotoCambioPlan.objects.create(
                    solicitud=solicitud,
                    usuario=miembro.usuario,
                    aprobado=(miembro.usuario_id == request.user.id),
                    fecha_voto=timezone.now() if miembro.usuario_id == request.user.id else None,
                )

            return Response(
                {
                    "message": "Cambio propuesto. Se requiere aprobación de todos los miembros.",
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
            servicios = actividad.servicios_asignados.all()
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
        return ActividadServicio.objects.filter(Q(actividad__plan__creado_por=user) | Q(actividad__plan__grupo__miembros__usuario=user)).distinct()

    @action(detail=True, methods=["post"])
    def confirmar_pago(self, request, pk=None):
        asignacion = self.get_object()
        movimiento_id = request.data.get("movimiento_id")
        if not movimiento_id:
            return Response({"error": "movimiento_id es requerido."}, status=400)

        from finance.models import MovimientoFinanciero

        movimiento = MovimientoFinanciero.objects.filter(
            id=movimiento_id,
            usuario=request.user,
            tipo_movimiento="gasto",
        ).first()

        if not movimiento:
            return Response({"error": "No se encontró un pago válido para confirmar."}, status=400)

        asignacion.movimiento_pago = movimiento
        asignacion.estado = "confirmado"
        asignacion.save()

        return Response({"message": "Servicio confirmado después del pago."})


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
