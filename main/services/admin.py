from django.contrib import admin

from .models import Entidad, Servicio, ServicioCategoria, ServicioHorario


@admin.register(ServicioCategoria)
class ServicioCategoriaAdmin(admin.ModelAdmin):
    list_display = ("nombre", "activo", "orden", "slug")
    list_filter = ("activo",)
    search_fields = ("nombre", "descripcion")
    ordering = ("orden", "nombre")


@admin.register(Entidad)
class EntidadAdmin(admin.ModelAdmin):
    list_display = ("nombre_comercial", "user", "aprobado")
    list_filter = ("aprobado",)
    search_fields = ("nombre_comercial", "ruc", "user__username", "user__email")


class ServicioHorarioInline(admin.TabularInline):
    model = ServicioHorario
    extra = 1


@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = (
        "nombre",
        "entidad",
        "categoria",
        "costo_regular",
        "tiene_promocion",
        "activo",
        "total_visualizaciones",
    )
    list_filter = ("activo", "tiene_promocion", "categoria")
    search_fields = ("nombre", "lugar", "categoria", "entidad__nombre_comercial")
    inlines = [ServicioHorarioInline]
