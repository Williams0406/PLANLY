from django.conf import settings
from django.db import models


class Entidad(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    nombre_comercial = models.CharField(max_length=255)
    ruc = models.CharField(max_length=50, blank=True)
    direccion = models.CharField(max_length=255)
    contacto_referencia = models.CharField(max_length=255)
    imagenes_promocionales = models.JSONField(default=list, blank=True)
    aprobado = models.BooleanField(default=False)

    def promedio_resenas(self):
        data = self.resenas.aggregate(promedio=models.Avg("puntaje"))
        return round(data["promedio"] or 0, 1)

    def __str__(self):
        return self.nombre_comercial


class Servicio(models.Model):
    MODALIDAD_PAGO_RESERVA = "reserva"
    MODALIDAD_PAGO_COMPLETO = "pago_completo"
    MODALIDAD_PAGO_CONTRAENTREGA = "contraentrega"
    MODALIDAD_PAGO_RESERVA_PREVIO_SALDO = "reserva_previo_saldo"
    MODALIDAD_PAGO_RESERVA_TOTAL_PREVIO = "reserva_total_previo"
    MODALIDAD_PAGO_OTRA = "otra"
    MODALIDAD_PAGO_CHOICES = [
        (MODALIDAD_PAGO_RESERVA, "Reserva"),
        (MODALIDAD_PAGO_COMPLETO, "Pago completo"),
        (MODALIDAD_PAGO_CONTRAENTREGA, "Contraentrega"),
        (MODALIDAD_PAGO_RESERVA_PREVIO_SALDO, "Reserva, pago previo y saldo final"),
        (MODALIDAD_PAGO_RESERVA_TOTAL_PREVIO, "Reserva y pago total antes del servicio"),
        (MODALIDAD_PAGO_OTRA, "Otra"),
    ]

    entidad = models.ForeignKey(Entidad, on_delete=models.CASCADE, related_name="servicios")
    categoria = models.CharField(max_length=120, default="General")
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField()
    hora_inicio = models.TimeField(null=True, blank=True)
    hora_fin = models.TimeField(null=True, blank=True)
    capacidad_maxima = models.PositiveIntegerField()
    costo_regular = models.DecimalField(max_digits=10, decimal_places=2)
    tiene_promocion = models.BooleanField(default=False)
    costo_promocional = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    modalidad_pago = models.CharField(
        max_length=40,
        choices=MODALIDAD_PAGO_CHOICES,
        default=MODALIDAD_PAGO_COMPLETO,
    )
    porcentaje_reserva = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    porcentaje_pago_previo = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    dias_antes_pago_previo = models.PositiveIntegerField(null=True, blank=True)
    descripcion_forma_pago = models.TextField(blank=True)
    lugar = models.CharField(max_length=255)
    contacto_referencia = models.CharField(max_length=255)
    imagen_principal = models.ImageField(upload_to="servicios/", null=True, blank=True)
    imagenes = models.JSONField(default=list, blank=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def precio_actual(self):
        if self.tiene_promocion and self.costo_promocional:
            return self.costo_promocional
        return self.costo_regular
    
    def promedio_resenas(self):
        data = self.resenas.aggregate(promedio=models.Avg("puntaje"))
        return round(data["promedio"] or 0, 1)

    def resumen_forma_pago(self):
        if self.modalidad_pago == self.MODALIDAD_PAGO_RESERVA and self.porcentaje_reserva:
            return f"Reserva del {self.porcentaje_reserva}% para asegurar el servicio."
        if self.modalidad_pago == self.MODALIDAD_PAGO_COMPLETO:
            return "Pago completo al confirmar el servicio."
        if self.modalidad_pago == self.MODALIDAD_PAGO_CONTRAENTREGA:
            return "Pago contraentrega o al momento de recibir el servicio."
        if (
            self.modalidad_pago == self.MODALIDAD_PAGO_RESERVA_PREVIO_SALDO
            and self.porcentaje_reserva is not None
            and self.porcentaje_pago_previo is not None
            and self.dias_antes_pago_previo is not None
        ):
            saldo = 100 - self.porcentaje_reserva - self.porcentaje_pago_previo
            return (
                f"Reserva del {self.porcentaje_reserva}%, otro {self.porcentaje_pago_previo}% "
                f"{self.dias_antes_pago_previo} dias antes y saldo final del {saldo}% al terminar."
            )
        if (
            self.modalidad_pago == self.MODALIDAD_PAGO_RESERVA_TOTAL_PREVIO
            and self.porcentaje_reserva is not None
            and self.porcentaje_pago_previo is not None
            and self.dias_antes_pago_previo is not None
        ):
            return (
                f"Reserva del {self.porcentaje_reserva}% y pago restante del {self.porcentaje_pago_previo}% "
                f"{self.dias_antes_pago_previo} dias antes del servicio."
            )
        if self.descripcion_forma_pago:
            return self.descripcion_forma_pago
        return self.get_modalidad_pago_display()

    def __str__(self):
        return self.nombre


class ServicioHorario(models.Model):
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE, related_name="horarios")
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()

    class Meta:
        ordering = ["fecha_inicio", "fecha_fin", "id"]

    def __str__(self):
        return f"{self.servicio.nombre}: {self.fecha_inicio} - {self.fecha_fin}"


class ResenaEntidad(models.Model):
    entidad = models.ForeignKey(Entidad, on_delete=models.CASCADE, related_name="resenas")
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    puntaje = models.PositiveSmallIntegerField()
    comentario = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("entidad", "usuario")
        ordering = ["-created_at"]


class ResenaServicio(models.Model):
    servicio = models.ForeignKey(Servicio, on_delete=models.CASCADE, related_name="resenas")
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    puntaje = models.PositiveSmallIntegerField()
    comentario = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("servicio", "usuario")
        ordering = ["-created_at"]
