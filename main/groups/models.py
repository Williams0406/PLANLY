# groups/models.py
from django.db import models
from django.conf import settings
from services.models import Servicio


class Grupo(models.Model):
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre


class MiembroGrupo(models.Model):
    ROL_CHOICES = (
        ("admin", "Admin"),
        ("miembro", "Miembro"),
    )

    grupo = models.ForeignKey(Grupo, on_delete=models.CASCADE, related_name="miembros")
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default="miembro")
    activo = models.BooleanField(default=True)

    class Meta:
        unique_together = ("grupo", "usuario")

    def __str__(self):
        return f"{self.usuario} - {self.grupo}"

class PlanGrupal(models.Model):
    ESTADO_CHOICES = (
        ("propuesto", "Propuesto"),
        ("confirmado", "Confirmado"),
        ("cancelado", "Cancelado"),
    )

    grupo = models.ForeignKey(Grupo, on_delete=models.CASCADE, related_name="planes")
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default="propuesto")
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.servicio.nombre} - {self.grupo.nombre}"

class ParticipacionPlan(models.Model):
    plan = models.ForeignKey(PlanGrupal, on_delete=models.CASCADE, related_name="participaciones")
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    acepta_participar = models.BooleanField(null=True)  # None = pendiente
    fecha_respuesta = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("plan", "usuario")

