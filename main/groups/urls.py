# groups/urls.py
from rest_framework.routers import DefaultRouter
from .views import GrupoViewSet, PlanGrupalViewSet, ParticipacionPlanViewSet

router = DefaultRouter()
router.register("grupos", GrupoViewSet, basename="grupos")
router.register("planes", PlanGrupalViewSet, basename="planes")
router.register("participaciones", ParticipacionPlanViewSet, basename="participaciones")

urlpatterns = router.urls
