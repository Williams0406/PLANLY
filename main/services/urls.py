from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import (
    EntidadViewSet,
    ServicioViewSet,
    ServicioPublicoViewSet,
    ServicioPublicoDetalleView,
    ServicioPublicoListadoView,
)

router = DefaultRouter()
router.register("entidades", EntidadViewSet, basename="entidades")
router.register("mis-servicios", ServicioViewSet, basename="mis-servicios")
router.register("catalogo", ServicioPublicoViewSet, basename="catalogo")

urlpatterns = router.urls + [
    path("web/servicios/", ServicioPublicoListadoView.as_view(), name="web-servicios"),
    path("web/servicios/<int:pk>/", ServicioPublicoDetalleView.as_view(), name="web-servicio-detalle"),
]