from rest_framework.routers import DefaultRouter
from .views import (
    ActividadPlanViewSet,
    ActividadServicioViewSet,
    GrupoViewSet,
    ParticipacionPlanViewSet,
    PlanGrupalViewSet,
    SolicitudCambioPlanViewSet,
)

router = DefaultRouter()
router.register("grupos", GrupoViewSet, basename="grupos")
router.register("planes", PlanGrupalViewSet, basename="planes")
router.register("actividades", ActividadPlanViewSet, basename="actividades")
router.register("asignaciones-servicio", ActividadServicioViewSet, basename="asignaciones-servicio")
router.register("solicitudes-cambio", SolicitudCambioPlanViewSet, basename="solicitudes-cambio")
router.register("participaciones", ParticipacionPlanViewSet, basename="participaciones")

urlpatterns = router.urls
