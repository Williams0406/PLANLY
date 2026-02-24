# services/permissions.py
from rest_framework.permissions import BasePermission


class IsEntidad(BasePermission):
    def has_permission(self, request, view):
        return request.user.tipo_usuario == "entidad"


class IsEntidadOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.entidad.user == request.user
