# groups/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from .models import Grupo, PlanGrupal, ParticipacionPlan, MiembroGrupo
from .serializers import (
    GrupoSerializer,
    PlanGrupalSerializer,
    ParticipacionPlanSerializer
)
from .permissions import EsAdminDelGrupo

class GrupoViewSet(viewsets.ModelViewSet):
    serializer_class = GrupoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Grupo.objects.filter(
            miembros__usuario=self.request.user
        ).distinct()

    @action(detail=True, methods=["post"])
    def invitar(self, request, pk=None):
        grupo = self.get_object()
        user_id = request.data.get("user_id")

        if not MiembroGrupo.objects.filter(
            grupo=grupo,
            usuario=request.user,
            rol="admin"
        ).exists():
            return Response(
                {"error": "Solo admin puede invitar."},
                status=403
            )

        MiembroGrupo.objects.create(
            grupo=grupo,
            usuario_id=user_id
        )

        return Response({"message": "Usuario invitado"})

class PlanGrupalViewSet(viewsets.ModelViewSet):
    serializer_class = PlanGrupalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PlanGrupal.objects.filter(
            grupo__miembros__usuario=self.request.user
        ).distinct()

    @action(detail=True, methods=["post"])
    def confirmar(self, request, pk=None):
        plan = self.get_object()

        if not MiembroGrupo.objects.filter(
            grupo=plan.grupo,
            usuario=request.user,
            rol="admin"
        ).exists():
            return Response(
                {"error": "Solo admin puede confirmar."},
                status=403
            )

        plan.estado = "confirmado"
        plan.save()

        return Response({"message": "Plan confirmado"})

class ParticipacionPlanViewSet(viewsets.ModelViewSet):
    serializer_class = ParticipacionPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ParticipacionPlan.objects.filter(
            usuario=self.request.user
        )
