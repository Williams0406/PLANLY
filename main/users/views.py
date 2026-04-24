# users/views.py
import logging

from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import User, PersonaProfile, PersonaPhoto, FriendRequest
from .serializers import (
    UserRegisterSerializer,
    UserPublicSerializer,
    UserPublicProfileSerializer,
    FriendRequestSerializer,
    PersonaProfileSerializer,
    PersonaPhotoSerializer,
)
from .permissions import IsPersona


logger = logging.getLogger(__name__)


class RegisterViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]


class UserPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return UserPublicProfileSerializer
        return UserPublicSerializer

    def get_queryset(self):
        queryset = User.objects.filter(is_active=True).exclude(id=self.request.user.id).select_related(
            "persona_profile", "entidad"
        ).order_by("id")
        tipo_usuario = self.request.query_params.get("tipo_usuario")
        if tipo_usuario in {"persona", "entidad"}:
            queryset = queryset.filter(tipo_usuario=tipo_usuario)
        return queryset


class FriendRequestViewSet(viewsets.ModelViewSet):
    serializer_class = FriendRequestSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        return FriendRequest.objects.filter(Q(sender=user) | Q(receiver=user)).select_related(
            "sender", "sender__persona_profile", "sender__entidad", "receiver", "receiver__persona_profile", "receiver__entidad"
        ).order_by("-id")

    def partial_update(self, request, *args, **kwargs):
        return Response({"detail": "Usa las acciones aceptar o rechazar."}, status=400)

    @action(detail=True, methods=["post"])
    def aceptar(self, request, pk=None):
        fr = self.get_object()
        if fr.receiver_id != request.user.id:
            return Response({"detail": "Solo el receptor puede aceptar."}, status=403)
        if fr.estado != "pendiente":
            return Response({"detail": "La solicitud ya fue gestionada."}, status=400)

        fr.estado = "aceptada"
        fr.responded_at = timezone.now()
        fr.save(update_fields=["estado", "responded_at"])
        return Response(FriendRequestSerializer(fr, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def rechazar(self, request, pk=None):
        fr = self.get_object()
        if fr.receiver_id != request.user.id:
            return Response({"detail": "Solo el receptor puede rechazar."}, status=403)
        if fr.estado != "pendiente":
            return Response({"detail": "La solicitud ya fue gestionada."}, status=400)

        fr.estado = "rechazada"
        fr.responded_at = timezone.now()
        fr.save(update_fields=["estado", "responded_at"])
        return Response(FriendRequestSerializer(fr, context={"request": request}).data)

    @action(detail=True, methods=["post"])
    def cancelar(self, request, pk=None):
        fr = self.get_object()
        if fr.sender_id != request.user.id:
            return Response({"detail": "Solo quien envio la solicitud puede cancelarla."}, status=403)
        if fr.estado != "pendiente":
            return Response({"detail": "Solo se pueden cancelar solicitudes pendientes."}, status=400)
        fr.delete()
        return Response({"detail": "Solicitud cancelada."})


class PersonaProfileViewSet(viewsets.ModelViewSet):
    serializer_class = PersonaProfileSerializer
    permission_classes = [IsAuthenticated, IsPersona]

    def get_queryset(self):
        return PersonaProfile.objects.filter(user=self.request.user)


class PersonaPhotoViewSet(viewsets.ModelViewSet):
    serializer_class = PersonaPhotoSerializer
    permission_classes = [IsAuthenticated, IsPersona]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        return PersonaPhoto.objects.filter(persona__user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            instance = serializer.save()
            response_data = self.get_serializer(instance).data
        except Exception:
            logger.exception("Error al crear foto de perfil para user_id=%s", request.user.id)
            return Response(
                {"detail": "No se pudo guardar la imagen. Intenta con otra foto o formato."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        headers = self.get_success_headers(response_data)
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    def partial_update(self, request, *args, **kwargs):
        return self._safe_update(request, partial=True, **kwargs)

    def update(self, request, *args, **kwargs):
        return self._safe_update(request, partial=False, **kwargs)

    def _safe_update(self, request, partial, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        try:
            updated_instance = serializer.save()
            response_data = self.get_serializer(updated_instance).data
        except Exception:
            logger.exception("Error al actualizar foto de perfil id=%s para user_id=%s", instance.id, request.user.id)
            return Response(
                {"detail": "No se pudo actualizar la imagen. Intenta nuevamente."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(response_data, status=status.HTTP_200_OK)
