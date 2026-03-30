from django.contrib import admin
from .models import Entidad, Servicio, ServicioHorario


@admin.register(Entidad)
class EntidadAdmin(admin.ModelAdmin):
    list_display = ("nombre_comercial", "user", "aprobado")
    list_filter = ("aprobado",)
    search_fields = ("nombre_comercial", "ruc")


class ServicioHorarioInline(admin.TabularInline):
    model = ServicioHorario
    extra = 1


@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = ("nombre", "entidad", "costo_regular", "tiene_promocion", "activo")
    list_filter = ("activo", "tiene_promocion")
    search_fields = ("nombre", "lugar")
    inlines = [ServicioHorarioInline]
