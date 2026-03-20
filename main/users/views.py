# users/views.py
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import User, PersonaProfile, PersonaPhoto, FriendRequest
from .serializers import (
    UserRegisterSerializer,
    UserPublicSerializer,
    FriendRequestSerializer,
    PersonaProfileSerializer,
    PersonaPhotoSerializer,
)
from .permissions import IsPersona


class RegisterViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]


class UserPublicViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserPublicSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return User.objects.filter(is_active=True).exclude(id=self.request.user.id).select_related(
            "persona_profile", "entidad"
        ).order_by("id")


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


class PersonaProfileViewSet(viewsets.ModelViewSet):
    serializer_class = PersonaProfileSerializer
    permission_classes = [IsAuthenticated, IsPersona]

    def get_queryset(self):
        return PersonaProfile.objects.filter(user=self.request.user)


class PersonaPhotoViewSet(viewsets.ModelViewSet):
    serializer_class = PersonaPhotoSerializer
    permission_classes = [IsAuthenticated, IsPersona]

    def get_queryset(self):
        return PersonaPhoto.objects.filter(persona__user=self.request.user)