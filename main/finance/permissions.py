# finance/permissions.py
from rest_framework.permissions import BasePermission
from groups.models import MiembroGrupo


class EsMiembroGrupo(BasePermission):
    def has_permission(self, request, view):
        grupo_id = request.data.get("grupo")
        if not grupo_id:
            return True

        return MiembroGrupo.objects.filter(
            grupo_id=grupo_id,
            usuario=request.user,
            activo=True
        ).exists()
