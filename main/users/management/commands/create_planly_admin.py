from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


User = get_user_model()


class Command(BaseCommand):
    help = "Crea o actualiza un usuario administrador compatible con el panel web de Planly."

    def add_arguments(self, parser):
        parser.add_argument("--username", required=True, help="Username del administrador")
        parser.add_argument("--email", required=True, help="Email del administrador")
        parser.add_argument("--password", required=True, help="Password del administrador")

    def handle(self, *args, **options):
        username = options["username"].strip()
        email = options["email"].strip()
        password = options["password"]

        if len(password) < 6:
            raise CommandError("La password debe tener al menos 6 caracteres.")

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "tipo_usuario": "persona",
            },
        )

        user.email = email
        user.tipo_usuario = user.tipo_usuario or "persona"
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(password)
        user.save()

        action = "creado" if created else "actualizado"
        self.stdout.write(
            self.style.SUCCESS(
                f"Administrador {action} correctamente: {user.username} ({user.email})"
            )
        )
