# users/views.py
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import User, PersonaProfile, PersonaPhoto
from .serializers import (
    UserRegisterSerializer,
    PersonaProfileSerializer,
    PersonaPhotoSerializer
)
from .permissions import IsPersona

class RegisterViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

class PersonaProfileViewSet(viewsets.ModelViewSet):
    serializer_class = PersonaProfileSerializer
    permission_classes = [IsAuthenticated, IsPersona]

    def get_queryset(self):
        return PersonaProfile.objects.filter(user=self.request.user)

class PersonaPhotoViewSet(viewsets.ModelViewSet):
    serializer_class = PersonaPhotoSerializer
    permission_classes = [IsAuthenticated, IsPersona]

    def get_queryset(self):
        return PersonaPhoto.objects.filter(
            persona__user=self.request.user
        )
