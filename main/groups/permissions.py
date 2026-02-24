# groups/permissions.py
from rest_framework.permissions import BasePermission
from .models import MiembroGrupo


class EsMiembroDelGrupo(BasePermission):
    def has_object_permission(self, request, view, obj):
        return MiembroGrupo.objects.filter(
            grupo=obj.grupo if hasattr(obj, "grupo") else obj,
            usuario=request.user,
            activo=True
        ).exists()


class EsAdminDelGrupo(BasePermission):
    def has_object_permission(self, request, view, obj):
        grupo = obj.grupo if hasattr(obj, "grupo") else obj

        return MiembroGrupo.objects.filter(
            grupo=grupo,
            usuario=request.user,
            rol="admin",
            activo=True
        ).exists()
