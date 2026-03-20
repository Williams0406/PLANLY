# services/views.py
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, generics
from django_filters.rest_framework import DjangoFilterBackend

from .models import Entidad, Servicio
from .serializers import (
    EntidadSerializer,
    ServicioSerializer,
    ServicioPublicoSerializer,
    ServicioDetalleSerializer
)
from .permissions import IsEntidad, IsEntidadOwner

class EntidadViewSet(viewsets.ModelViewSet):
    serializer_class = EntidadSerializer
    permission_classes = [IsAuthenticated, IsEntidad]

    def get_queryset(self):
        return Entidad.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=["post"], permission_classes=[IsAdminUser])
    def aprobar(self, request, pk=None):
        entidad = self.get_object()
        entidad.aprobado = True
        entidad.save()

        return Response({"message": "Entidad aprobada."})

class ServicioViewSet(viewsets.ModelViewSet):
    serializer_class = ServicioSerializer
    permission_classes = [IsAuthenticated, IsEntidad, IsEntidadOwner]

    def get_queryset(self):
        return Servicio.objects.filter(entidad__user=self.request.user)

    def perform_destroy(self, instance):
        instance.activo = False
        instance.save()
    
    @action(detail=True, methods=["post"])
    def activar_promocion(self, request, pk=None):
        servicio = self.get_object()

        if not servicio.costo_promocional:
            return Response(
                {"error": "Debe definir costo promocional."},
                status=400
            )

        servicio.tiene_promocion = True
        servicio.save()

        return Response({"message": "Promoción activada."})


    @action(detail=True, methods=["post"])
    def desactivar_promocion(self, request, pk=None):
        servicio = self.get_object()
        servicio.tiene_promocion = False
        servicio.save()

        return Response({"message": "Promoción desactivada."})


class ServicioPublicoViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ServicioPublicoSerializer
    permission_classes = [AllowAny]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ServicioDetalleSerializer
        return ServicioPublicoSerializer

    queryset = Servicio.objects.filter(
        activo=True,
        entidad__aprobado=True
    )

    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["lugar"]
    search_fields = ["nombre", "descripcion", "lugar"]

class ServicioPublicoDetalleView(generics.RetrieveAPIView):
    serializer_class = ServicioDetalleSerializer
    permission_classes = [AllowAny]
    queryset = Servicio.objects.filter(activo=True, entidad__aprobado=True)


class ServicioPublicoListadoView(generics.ListAPIView):
    serializer_class = ServicioDetalleSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["lugar"]
    search_fields = ["nombre", "descripcion", "lugar", "entidad__nombre_comercial"]
    ordering_fields = ["costo_regular", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Servicio.objects.filter(activo=True, entidad__aprobado=True)
        tiene_promocion = self.request.query_params.get("promocion")
        if tiene_promocion == "true":
            qs = qs.filter(tiene_promocion=True)
        return qs

