# users/urls.py
from rest_framework.routers import DefaultRouter
from .views import RegisterViewSet, PersonaProfileViewSet, PersonaPhotoViewSet

router = DefaultRouter()
router.register("register", RegisterViewSet, basename="register")
router.register("perfil", PersonaProfileViewSet, basename="perfil")
router.register("fotos", PersonaPhotoViewSet, basename="fotos")

urlpatterns = router.urls
