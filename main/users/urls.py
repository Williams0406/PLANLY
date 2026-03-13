from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import RegisterViewSet, PersonaProfileViewSet, PersonaPhotoViewSet
from .views_web import RegisterWebView, MeView

router = DefaultRouter()
router.register("register", RegisterViewSet, basename="register")
router.register("perfil", PersonaProfileViewSet, basename="perfil")
router.register("fotos", PersonaPhotoViewSet, basename="fotos")

urlpatterns = router.urls + [
    path("auth/register/", RegisterWebView.as_view(), name="web-register"),
    path("me/", MeView.as_view(), name="me"),
]