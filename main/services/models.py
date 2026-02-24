# services/models.py
from django.db import models
from django.conf import settings


class Entidad(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    nombre_comercial = models.CharField(max_length=255)
    ruc = models.CharField(max_length=50, blank=True)
    direccion = models.CharField(max_length=255)
    contacto_referencia = models.CharField(max_length=255)
    aprobado = models.BooleanField(default=False)

    def __str__(self):
        return self.nombre_comercial


class Servicio(models.Model):
    entidad = models.ForeignKey(Entidad, on_delete=models.CASCADE, related_name="servicios")
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    capacidad_maxima = models.PositiveIntegerField()
    costo_regular = models.DecimalField(max_digits=10, decimal_places=2)
    tiene_promocion = models.BooleanField(default=False)
    costo_promocional = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    lugar = models.CharField(max_length=255)
    contacto_referencia = models.CharField(max_length=255)
    imagen_principal = models.ImageField(upload_to="servicios/", null=True, blank=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def precio_actual(self):
        if self.tiene_promocion and self.costo_promocional:
            return self.costo_promocional
        return self.costo_regular

    def __str__(self):
        return self.nombre
