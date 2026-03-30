from django.contrib.sessions.models import Session
from django.core.management.base import BaseCommand
from django.db import transaction

from finance.models import DivisionMovimiento, MovimientoFinanciero, Prestamo
from groups.models import (
    ActividadPlan,
    ActividadServicio,
    ConfirmacionServicioIntegrante,
    Grupo,
    MiembroGrupo,
    ParticipacionPlan,
    PlanGrupal,
    SolicitudCambioPlan,
    VotoCambioPlan,
)
from services.models import Entidad, ResenaEntidad, ResenaServicio, Servicio, ServicioHorario
from users.models import User


class Command(BaseCommand):
    help = "Limpia tablas transaccionales y de negocio sin borrar los usuarios ya creados"

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Limpiando datos de negocio sin borrar usuarios..."))

        VotoCambioPlan.objects.all().delete()
        SolicitudCambioPlan.objects.all().delete()
        ConfirmacionServicioIntegrante.objects.all().delete()
        ParticipacionPlan.objects.all().delete()
        ActividadServicio.objects.all().delete()
        ActividadPlan.objects.all().delete()
        PlanGrupal.objects.all().delete()
        MiembroGrupo.objects.all().delete()
        Grupo.objects.all().delete()

        DivisionMovimiento.objects.all().delete()
        Prestamo.objects.all().delete()
        MovimientoFinanciero.objects.all().delete()

        ResenaServicio.objects.all().delete()
        ResenaEntidad.objects.all().delete()
        ServicioHorario.objects.all().delete()
        Servicio.objects.all().delete()
        Entidad.objects.all().delete()

        Session.objects.all().delete()

        remaining_users = User.objects.count()
        self.stdout.write(self.style.SUCCESS("Limpieza completa."))
        self.stdout.write(self.style.SUCCESS(f"Usuarios restantes: {remaining_users}"))
