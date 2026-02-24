# finance/models.py
from django.db import models
from django.conf import settings
from groups.models import Grupo, PlanGrupal

# Create your models here.
class MovimientoFinanciero(models.Model):
    TIPO_CHOICES = (
        ("gasto_grupal", "Gasto Grupal"),
        ("gasto_individual", "Gasto Individual"),
        ("prestamo", "Prestamo"),
        ("pago_prestamo", "Pago Prestamo"),
    )

    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    grupo = models.ForeignKey(Grupo, on_delete=models.CASCADE, null=True, blank=True)
    plan_grupal = models.ForeignKey(PlanGrupal, on_delete=models.CASCADE, null=True, blank=True)
    tipo_movimiento = models.CharField(max_length=20, choices=TIPO_CHOICES)
    descripcion = models.CharField(max_length=255)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    fecha = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tipo_movimiento} - {self.monto}"

class DivisionMovimiento(models.Model):
    movimiento = models.ForeignKey(MovimientoFinanciero, on_delete=models.CASCADE, related_name="divisiones")
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    monto_asignado = models.DecimalField(max_digits=12, decimal_places=2)

class Prestamo(models.Model):
    grupo = models.ForeignKey(Grupo, on_delete=models.CASCADE)
    prestamista = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="prestamos_otorgados")
    deudor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="prestamos_recibidos")
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    saldo_pendiente = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

