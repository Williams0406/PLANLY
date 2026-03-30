from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import EntidadPublicaDetalleView, EntidadViewSet, ResenaEntidadViewSet, ResenaServicioViewSet, ServicioPublicoDetalleView, ServicioPublicoListadoView, ServicioPublicoViewSet, ServicioViewSet

router = DefaultRouter()
router.register("entidades", EntidadViewSet, basename="entidades")
router.register("mis-servicios", ServicioViewSet, basename="mis-servicios")
router.register("catalogo", ServicioPublicoViewSet, basename="catalogo")
router.register("resenas-servicio", ResenaServicioViewSet, basename="resenas-servicio")
router.register("resenas-entidad", ResenaEntidadViewSet, basename="resenas-entidad")

urlpatterns = router.urls + [
    path("catalogo/entidades/<int:pk>/", EntidadPublicaDetalleView.as_view(), name="catalogo-entidad-detalle"),
    path("web/servicios/", ServicioPublicoListadoView.as_view(), name="web-servicios"),
    path("web/servicios/<int:pk>/", ServicioPublicoDetalleView.as_view(), name="web-servicio-detalle"),
]
