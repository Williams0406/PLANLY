from django.core.management.base import BaseCommand
from django.db import transaction

from finance.models import DivisionMovimiento, MovimientoFinanciero, Prestamo
from groups.models import (
    ActividadPlan,
    ActividadServicio,
    Grupo,
    MiembroGrupo,
    ParticipacionPlan,
    PlanGrupal,
    SolicitudCambioPlan,
    VotoCambioPlan,
)
from services.models import Entidad, Servicio
from users.models import PersonaPhoto, PersonaProfile, User


class Command(BaseCommand):
    help = "Limpia todas las tablas de negocio excepto la tabla de usuarios"

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Limpiando datos no-user..."))

        # Ordenado por dependencias FK
        VotoCambioPlan.objects.all().delete()
        SolicitudCambioPlan.objects.all().delete()
        ParticipacionPlan.objects.all().delete()
        ActividadServicio.objects.all().delete()
        ActividadPlan.objects.all().delete()
        PlanGrupal.objects.all().delete()
        MiembroGrupo.objects.all().delete()
        Grupo.objects.all().delete()

        DivisionMovimiento.objects.all().delete()
        Prestamo.objects.all().delete()
        MovimientoFinanciero.objects.all().delete()

        Servicio.objects.all().delete()
        Entidad.objects.all().delete()

        PersonaPhoto.objects.all().delete()
        PersonaProfile.objects.all().delete()

        self.stdout.write(self.style.SUCCESS("✅ Limpieza completada (usuarios preservados)."))
        self.stdout.write(self.style.SUCCESS(f"Usuarios existentes: {User.objects.count()}"))