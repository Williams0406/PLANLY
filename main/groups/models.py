from django.conf import settings
from django.db import models
from services.models import Servicio


class Grupo(models.Model):
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nombre


class MiembroGrupo(models.Model):
    ROL_CHOICES = (("admin", "Admin"), ("miembro", "Miembro"))
    grupo = models.ForeignKey(Grupo, on_delete=models.CASCADE, related_name="miembros")
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rol = models.CharField(max_length=20, choices=ROL_CHOICES, default="miembro")
    activo = models.BooleanField(default=True)

    class Meta:
        unique_together = ("grupo", "usuario")

    def __str__(self):
        return f"{self.usuario} - {self.grupo}"


class PlanGrupal(models.Model):
    TIPO_CHOICES = (("individual", "Individual"), ("grupal", "Grupal"))
    ESTADO_CHOICES = (("borrador", "Borrador"), ("propuesto", "Propuesto"), ("confirmado", "Confirmado"), ("cancelado", "Cancelado"))
    nombre = models.CharField(max_length=255, default="Plan")
    descripcion = models.TextField(blank=True)
    tipo_plan = models.CharField(max_length=20, choices=TIPO_CHOICES, default="grupal")
    grupo = models.ForeignKey(Grupo, on_delete=models.CASCADE, related_name="planes", null=True, blank=True)
    servicio = models.ForeignKey(Servicio, on_delete=models.SET_NULL, null=True, blank=True)
    lider = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="planes_liderados", null=True, blank=True)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default="propuesto")
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_fin = models.DateTimeField(null=True, blank=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        scope = self.grupo.nombre if self.grupo_id else self.creado_por.username
        return f"{self.nombre} - {scope}"


class ActividadPlan(models.Model):
    plan = models.ForeignKey(PlanGrupal, on_delete=models.CASCADE, related_name="actividades")
    titulo = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["fecha_inicio", "orden", "id"]


class ActividadServicio(models.Model):
    ESTADO_CHOICES = (
        ("pendiente_confirmacion", "Pendiente confirmación"),
        ("interes", "Interés"),
        ("confirmado", "Confirmado"),
        ("cancelado", "Cancelado"),
    )
    actividad = models.ForeignKey(ActividadPlan, on_delete=models.CASCADE, related_name="servicios_asignados")
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE)
    usuario_asignador = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    estado = models.CharField(max_length=30, choices=ESTADO_CHOICES, default="interes")
    movimiento_pago = models.ForeignKey("finance.MovimientoFinanciero", on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ConfirmacionServicioIntegrante(models.Model):
    ESTADO_CHOICES = (("pendiente", "Pendiente"), ("aceptado", "Aceptado"), ("rechazado", "Rechazado"))
    asignacion = models.ForeignKey(ActividadServicio, on_delete=models.CASCADE, related_name="confirmaciones")
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default="pendiente")
    mensaje = models.TextField(default="Se requiere tu confirmación para agregar este servicio a una actividad.")
    fecha_respuesta = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("asignacion", "usuario")


class ParticipacionPlan(models.Model):
    plan = models.ForeignKey(PlanGrupal, on_delete=models.CASCADE, related_name="participaciones")
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    acepta_participar = models.BooleanField(null=True)
    fecha_respuesta = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("plan", "usuario")


class SolicitudCambioPlan(models.Model):
    ESTADO_CHOICES = (("pendiente", "Pendiente"), ("aprobado", "Aprobado"), ("rechazado", "Rechazado"))
    plan = models.ForeignKey(PlanGrupal, on_delete=models.CASCADE, related_name="solicitudes_cambio")
    solicitado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    cambios = models.JSONField(default=dict)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default="pendiente")
    created_at = models.DateTimeField(auto_now_add=True)


class VotoCambioPlan(models.Model):
    solicitud = models.ForeignKey(SolicitudCambioPlan, on_delete=models.CASCADE, related_name="votos")
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    aprobado = models.BooleanField(null=True)
    fecha_voto = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("solicitud", "usuario")