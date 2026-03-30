from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from .models import Entidad, ResenaEntidad, ResenaServicio, Servicio
from .permissions import IsEntidad, IsEntidadOwner
from .serializers import (
    EntidadPublicaDetalleSerializer,
    EntidadSerializer,
    ResenaEntidadSerializer,
    ResenaServicioSerializer,
    ServicioDetalleSerializer,
    ServicioPublicoSerializer,
    ServicioSerializer,
)


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
        return Servicio.objects.filter(entidad__user=self.request.user).prefetch_related("horarios")

    def perform_destroy(self, instance):
        instance.activo = False
        instance.save()

    @action(detail=True, methods=["post"])
    def activar_promocion(self, request, pk=None):
        servicio = self.get_object()
        if not servicio.costo_promocional:
            return Response({"error": "Debe definir costo promocional."}, status=400)
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
    permission_classes = [AllowAny]
    queryset = Servicio.objects.filter(activo=True, entidad__aprobado=True).prefetch_related("horarios")
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["lugar", "categoria"]
    search_fields = ["nombre", "descripcion", "lugar", "categoria", "entidad__nombre_comercial"]

    def get_serializer_class(self):
        return ServicioDetalleSerializer if self.action == "retrieve" else ServicioPublicoSerializer


class ServicioPublicoDetalleView(generics.RetrieveAPIView):
    serializer_class = ServicioDetalleSerializer
    permission_classes = [AllowAny]
    queryset = Servicio.objects.filter(activo=True, entidad__aprobado=True).prefetch_related("horarios")


class ServicioPublicoListadoView(generics.ListAPIView):
    serializer_class = ServicioDetalleSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["lugar", "categoria"]
    search_fields = ["nombre", "descripcion", "lugar", "categoria", "entidad__nombre_comercial"]
    ordering_fields = ["costo_regular", "created_at"]
    ordering = ["categoria", "-created_at"]

    def get_queryset(self):
        qs = Servicio.objects.filter(activo=True, entidad__aprobado=True).prefetch_related("horarios")
        if self.request.query_params.get("promocion") == "true":
            qs = qs.filter(tiene_promocion=True)
        return qs


class EntidadPublicaDetalleView(generics.RetrieveAPIView):
    serializer_class = EntidadPublicaDetalleSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return (
            Entidad.objects.filter(aprobado=True)
            .prefetch_related("resenas", "servicios", "servicios__horarios")
        )


class ResenaServicioViewSet(viewsets.ModelViewSet):
    serializer_class = ResenaServicioSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ResenaServicio.objects.all()
        servicio_id = self.request.query_params.get("servicio")
        return qs.filter(servicio_id=servicio_id) if servicio_id else qs


class ResenaEntidadViewSet(viewsets.ModelViewSet):
    serializer_class = ResenaEntidadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = ResenaEntidad.objects.all()
        entidad_id = self.request.query_params.get("entidad")
        return qs.filter(entidad_id=entidad_id) if entidad_id else qs
