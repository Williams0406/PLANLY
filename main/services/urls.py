# services/urls.py
from rest_framework.routers import DefaultRouter
from .views import (
    EntidadViewSet,
    ServicioViewSet,
    ServicioPublicoViewSet
)

router = DefaultRouter()
router.register("entidades", EntidadViewSet, basename="entidades")
router.register("mis-servicios", ServicioViewSet, basename="mis-servicios")
router.register("catalogo", ServicioPublicoViewSet, basename="catalogo")

urlpatterns = router.urls
