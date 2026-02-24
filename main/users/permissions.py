# users/permissions.py
from rest_framework.permissions import BasePermission


class IsPersona(BasePermission):
    def has_permission(self, request, view):
        return request.user.tipo_usuario == "persona"


class IsEntidad(BasePermission):
    def has_permission(self, request, view):
        return request.user.tipo_usuario == "entidad"
