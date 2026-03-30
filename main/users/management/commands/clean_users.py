from django.contrib.sessions.models import Session
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from users.models import User


class Command(BaseCommand):
    help = "Elimina todos los usuarios del sistema y limpia sus sesiones"

    def add_arguments(self, parser):
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Confirma la eliminación sin pedir validación adicional.",
        )
        parser.add_argument(
            "--keep-superusers",
            action="store_true",
            help="Conserva los superusuarios y elimina el resto de usuarios.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if not options["yes"]:
            raise CommandError(
                "Este comando elimina usuarios de forma irreversible. "
                "Vuelve a ejecutarlo con --yes para confirmar."
            )

        queryset = User.objects.all()
        action_label = "todos los usuarios"

        if options["keep_superusers"]:
            queryset = queryset.filter(is_superuser=False)
            action_label = "todos los usuarios excepto superusuarios"

        total = queryset.count()

        self.stdout.write(self.style.WARNING(f"Eliminando {action_label}..."))
        self.stdout.write(self.style.WARNING(f"Usuarios a eliminar: {total}"))

        Session.objects.all().delete()
        deleted_count, _ = queryset.delete()

        self.stdout.write(self.style.SUCCESS("Limpieza de usuarios completada."))
        self.stdout.write(self.style.SUCCESS(f"Registros eliminados por cascada: {deleted_count}"))
        self.stdout.write(self.style.SUCCESS(f"Usuarios restantes: {User.objects.count()}"))
