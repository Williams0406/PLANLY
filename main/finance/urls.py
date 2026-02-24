# finance/urls.py
from rest_framework.routers import DefaultRouter
from .views import MovimientoViewSet, PrestamoViewSet

router = DefaultRouter()
router.register("movimientos", MovimientoViewSet, basename="movimientos")
router.register("prestamos", PrestamoViewSet, basename="prestamos")

urlpatterns = router.urls
