from django.contrib import admin
from .models import MovimientoFinanciero, DivisionMovimiento, Prestamo


@admin.register(MovimientoFinanciero)
class MovimientoAdmin(admin.ModelAdmin):
    list_display = ("tipo_movimiento", "usuario", "monto", "fecha")
    list_filter = ("tipo_movimiento", "fecha")


admin.site.register(DivisionMovimiento)
admin.site.register(Prestamo)
