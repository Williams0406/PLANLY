from django.contrib.auth import get_user_model
from django.db.models import Count, F, Q, Sum
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Entidad, ResenaEntidad, ResenaServicio, Servicio, ServicioCategoria
from .permissions import IsEntidad, IsEntidadOwner
from .serializers import (
    EntidadAdminSerializer,
    EntidadPublicaDetalleSerializer,
    EntidadSerializer,
    ResenaEntidadSerializer,
    ResenaServicioSerializer,
    ServicioCategoriaSerializer,
    ServicioDetalleSerializer,
    ServicioPublicoSerializer,
    ServicioSerializer,
)


User = get_user_model()


def increment_service_view(servicio):
    Servicio.objects.filter(pk=servicio.pk).update(total_visualizaciones=F("total_visualizaciones") + 1)
    servicio.refresh_from_db(fields=["total_visualizaciones"])


class ServicioCategoriaViewSet(viewsets.ModelViewSet):
    serializer_class = ServicioCategoriaSerializer
    queryset = ServicioCategoria.objects.all()

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        queryset = ServicioCategoria.objects.all().order_by("orden", "nombre", "id")
        if self.request.user.is_authenticated and self.request.user.is_staff:
            if self.request.query_params.get("scope") == "all":
                return queryset
            if self.action != "list":
                return queryset
        return queryset.filter(activo=True)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        previous_name = instance.nombre
        response = super().update(request, *args, **kwargs)
        instance.refresh_from_db()
        if previous_name != instance.nombre:
            Servicio.objects.filter(categoria=previous_name).update(categoria=instance.nombre)
        return response

    def perform_destroy(self, instance):
        if Servicio.objects.filter(categoria=instance.nombre).exists():
            raise ValidationError("No puedes eliminar una categoria que ya esta siendo usada por servicios.")
        instance.delete()


class AdminEntidadViewSet(viewsets.ModelViewSet):
    serializer_class = EntidadAdminSerializer
    permission_classes = [IsAdminUser]
    http_method_names = ["get", "patch", "post", "head", "options"]

    def get_queryset(self):
        queryset = (
            Entidad.objects.select_related("user")
            .annotate(
                servicios_activos=Count("servicios", filter=Q(servicios__activo=True), distinct=True),
                visualizaciones_totales=Sum("servicios__total_visualizaciones"),
            )
            .order_by("aprobado", "-user__date_joined")
        )

        estado = self.request.query_params.get("estado")
        if estado == "pendiente":
            return queryset.filter(aprobado=False)
        if estado == "aprobado":
            return queryset.filter(aprobado=True)
        return queryset

    @action(detail=True, methods=["post"])
    def aprobar(self, request, pk=None):
        entidad = self.get_object()
        entidad.aprobado = True
        entidad.save(update_fields=["aprobado"])
        return Response(self.get_serializer(entidad).data)

    @action(detail=True, methods=["post"])
    def revocar(self, request, pk=None):
        entidad = self.get_object()
        entidad.aprobado = False
        entidad.save(update_fields=["aprobado"])
        return Response(self.get_serializer(entidad).data)


class AdminDashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        persona_count = User.objects.filter(tipo_usuario="persona").count()
        entidad_user_count = User.objects.filter(tipo_usuario="entidad").count()
        approved_entities = Entidad.objects.filter(aprobado=True).count()
        pending_entities = Entidad.objects.filter(aprobado=False).count()

        category_stats_rows = (
            Servicio.objects.values("categoria")
            .annotate(
                servicios_count=Count("id"),
                visualizaciones_count=Sum("total_visualizaciones"),
                activos_count=Count("id", filter=Q(activo=True)),
            )
            .order_by("-visualizaciones_count", "-servicios_count", "categoria")
        )
        category_stats_map = {row["categoria"]: row for row in category_stats_rows}

        categories = []
        for category in ServicioCategoria.objects.all().order_by("orden", "nombre", "id"):
            row = category_stats_map.get(category.nombre, {})
            categories.append(
                {
                    "id": category.id,
                    "nombre": category.nombre,
                    "slug": category.slug,
                    "descripcion": category.descripcion,
                    "activo": category.activo,
                    "orden": category.orden,
                    "servicios_count": row.get("servicios_count", 0),
                    "activos_count": row.get("activos_count", 0),
                    "visualizaciones_count": row.get("visualizaciones_count", 0) or 0,
                }
            )

        pending_preview = Entidad.objects.filter(aprobado=False).select_related("user").order_by("-user__date_joined")[:5]

        return Response(
            {
                "stats": {
                    "usuarios_persona": persona_count,
                    "usuarios_entidad": entidad_user_count,
                    "entidades_aprobadas": approved_entities,
                    "entidades_pendientes": pending_entities,
                    "categorias_activas": ServicioCategoria.objects.filter(activo=True).count(),
                    "visualizaciones_totales": Servicio.objects.aggregate(total=Sum("total_visualizaciones"))["total"] or 0,
                },
                "categorias": categories,
                "pendientes_preview": EntidadAdminSerializer(pending_preview, many=True).data,
            }
        )


class EntidadViewSet(viewsets.ModelViewSet):
    serializer_class = EntidadSerializer
    permission_classes = [IsAuthenticated, IsEntidad]

    def get_queryset(self):
        return Entidad.objects.filter(user=self.request.user)


class ServicioViewSet(viewsets.ModelViewSet):
    serializer_class = ServicioSerializer
    permission_classes = [IsAuthenticated, IsEntidad, IsEntidadOwner]

    def get_queryset(self):
        return Servicio.objects.filter(entidad__user=self.request.user).prefetch_related("horarios")

    def perform_destroy(self, instance):
        instance.activo = False
        instance.save(update_fields=["activo"])

    @action(detail=True, methods=["post"])
    def activar_promocion(self, request, pk=None):
        servicio = self.get_object()
        if not servicio.costo_promocional:
            return Response({"error": "Debe definir costo promocional."}, status=400)
        servicio.tiene_promocion = True
        servicio.save(update_fields=["tiene_promocion"])
        return Response({"message": "Promocion activada."})

    @action(detail=True, methods=["post"])
    def desactivar_promocion(self, request, pk=None):
        servicio = self.get_object()
        servicio.tiene_promocion = False
        servicio.save(update_fields=["tiene_promocion"])
        return Response({"message": "Promocion desactivada."})


class ServicioPublicoViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    queryset = Servicio.objects.filter(activo=True, entidad__aprobado=True).prefetch_related("horarios")
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["lugar", "categoria"]
    search_fields = ["nombre", "descripcion", "lugar", "categoria", "entidad__nombre_comercial"]

    def get_serializer_class(self):
        return ServicioDetalleSerializer if self.action == "retrieve" else ServicioPublicoSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        increment_service_view(instance)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ServicioPublicoDetalleView(generics.RetrieveAPIView):
    serializer_class = ServicioDetalleSerializer
    permission_classes = [AllowAny]
    queryset = Servicio.objects.filter(activo=True, entidad__aprobado=True).prefetch_related("horarios")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        increment_service_view(instance)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ServicioPublicoListadoView(generics.ListAPIView):
    serializer_class = ServicioDetalleSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["lugar", "categoria"]
    search_fields = ["nombre", "descripcion", "lugar", "categoria", "entidad__nombre_comercial"]
    ordering_fields = ["costo_regular", "created_at", "total_visualizaciones"]
    ordering = ["categoria", "-created_at"]

    def get_queryset(self):
        queryset = Servicio.objects.filter(activo=True, entidad__aprobado=True).prefetch_related("horarios")
        if self.request.query_params.get("promocion") == "true":
            queryset = queryset.filter(tiene_promocion=True)
        return queryset


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
        queryset = ResenaServicio.objects.all()
        servicio_id = self.request.query_params.get("servicio")
        return queryset.filter(servicio_id=servicio_id) if servicio_id else queryset


class ResenaEntidadViewSet(viewsets.ModelViewSet):
    serializer_class = ResenaEntidadSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ResenaEntidad.objects.all()
        entidad_id = self.request.query_params.get("entidad")
        return queryset.filter(entidad_id=entidad_id) if entidad_id else queryset
