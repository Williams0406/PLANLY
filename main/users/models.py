# users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ("persona", "Persona"),
        ("entidad", "Entidad"),
    )

    tipo_usuario = models.CharField(max_length=20, choices=USER_TYPE_CHOICES)

    telefono = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return self.username

class PersonaProfile(models.Model):

    TIPO_DOCUMENTO_CHOICES = (
        ("dni", "DNI"),
        ("pasaporte", "Pasaporte"),
        ("cedula", "Cédula"),
        ("otro", "Otro"),
    )

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="persona_profile"
    )

    tipo_documento = models.CharField(max_length=20, choices=TIPO_DOCUMENTO_CHOICES)
    numero_documento = models.CharField(max_length=50, unique=True)

    nombres = models.CharField(max_length=150)
    apellidos = models.CharField(max_length=150)

    fecha_nacimiento = models.DateField()

    ocupacion = models.CharField(max_length=150, blank=True)
    descripcion = models.TextField(blank=True)
    hobbies = models.TextField(blank=True)
    nacionalidad = models.CharField(max_length=100)

    ciudad = models.CharField(max_length=100)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombres} {self.apellidos}"

class PersonaPhoto(models.Model):
    persona = models.ForeignKey(
        PersonaProfile,
        on_delete=models.CASCADE,
        related_name="fotos"
    )

    imagen = models.ImageField(upload_to="perfiles/")
    es_principal = models.BooleanField(default=False)
    orden = models.PositiveIntegerField(default=0)
    visible = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["orden"]
