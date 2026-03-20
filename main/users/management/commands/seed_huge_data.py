import random
from datetime import timedelta, date, time
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from finance.models import DivisionMovimiento, MovimientoFinanciero, Prestamo
from groups.models import (
    ActividadPlan,
    ActividadServicio,
    Grupo,
    MiembroGrupo,
    ParticipacionPlan,
    PlanGrupal,
)
from services.models import Entidad, Servicio
from users.models import PersonaProfile, User


FIRST_NAMES = [
    "Ana", "Luis", "Marta", "Diego", "Rosa", "Carlos", "Elena", "Jorge", "Lucia", "Pedro",
]
LAST_NAMES = [
    "Perez", "Gomez", "Torres", "Vargas", "Rojas", "Diaz", "Castro", "Flores", "Ruiz", "Mendoza",
]
CITIES = ["Lima", "Cusco", "Arequipa", "Trujillo", "Piura", "Tacna"]
OCCUPATIONS = ["Ingeniero", "Disenador", "Analista", "Profesor", "Abogado", "Medico"]
SERVICE_NAMES = [
    "Catering", "Fotografia", "DJ", "Salon", "Transporte", "Decoracion", "Animacion", "Seguridad",
]


class Command(BaseCommand):
    help = "Genera una muestra grande de datos para desarrollo/demo"

    def add_arguments(self, parser):
        parser.add_argument("--personas", type=int, default=120, help="Cantidad de usuarios persona")
        parser.add_argument("--entidades", type=int, default=40, help="Cantidad de usuarios entidad")
        parser.add_argument("--servicios-por-entidad", type=int, default=8, help="Servicios por entidad")
        parser.add_argument("--grupos", type=int, default=35, help="Cantidad de grupos")
        parser.add_argument("--planes-individuales", type=int, default=180, help="Planes individuales")
        parser.add_argument("--planes-grupales", type=int, default=90, help="Planes grupales")
        parser.add_argument("--actividades-por-plan", type=int, default=5, help="Actividades promedio por plan")
        parser.add_argument("--asignaciones-por-actividad", type=int, default=2, help="Servicios por actividad")
        parser.add_argument("--movimientos", type=int, default=420, help="Movimientos financieros")
        parser.add_argument("--prestamos", type=int, default=120, help="Prestamos")
        parser.add_argument(
            "--password",
            type=str,
            default="Demo1234!",
            help="Password para usuarios nuevos",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        personas_count = options["personas"]
        entidades_count = options["entidades"]
        servicios_por_entidad = options["servicios_por_entidad"]
        grupos_count = options["grupos"]
        planes_ind_count = options["planes_individuales"]
        planes_grp_count = options["planes_grupales"]
        acts_per_plan = max(1, options["actividades_por_plan"])
        asig_per_act = max(1, options["asignaciones_por_actividad"])
        movimientos_count = options["movimientos"]
        prestamos_count = options["prestamos"]
        default_password = options["password"]

        self.stdout.write(self.style.WARNING("Iniciando seed masivo..."))

        # 1) Usuarios persona + perfiles
        personas = []
        for i in range(personas_count):
            username = f"persona_{timezone.now().strftime('%m%d')}_{i:04d}"
            email = f"{username}@demo.local"
            if User.objects.filter(username=username).exists():
                continue
            user = User(username=username, email=email, tipo_usuario="persona")
            user.set_password(default_password)
            personas.append(user)
        User.objects.bulk_create(personas, batch_size=500)

        persona_users = list(User.objects.filter(tipo_usuario="persona").order_by("id")[:max(1, personas_count * 2)])

        perfiles = []
        existing_profile_user_ids = set(PersonaProfile.objects.filter(user__in=persona_users).values_list("user_id", flat=True))
        for idx, user in enumerate(persona_users):
            if user.id in existing_profile_user_ids:
                continue
            nombres = random.choice(FIRST_NAMES)
            apellidos = random.choice(LAST_NAMES)
            perfiles.append(
                PersonaProfile(
                    user=user,
                    tipo_documento="dni",
                    numero_documento=f"{user.id:08d}{idx % 10}",
                    nombres=nombres,
                    apellidos=apellidos,
                    fecha_nacimiento=date(1990 + (idx % 10), (idx % 12) + 1, (idx % 28) + 1),
                    ocupacion=random.choice(OCCUPATIONS),
                    descripcion="Perfil demo generado automáticamente",
                    hobbies="Viajar, música",
                    nacionalidad="Peruana",
                    ciudad=random.choice(CITIES),
                )
            )
        PersonaProfile.objects.bulk_create(perfiles, batch_size=500)

        # 2) Usuarios entidad + entidad
        entidades_users_new = []
        for i in range(entidades_count):
            username = f"entidad_{timezone.now().strftime('%m%d')}_{i:04d}"
            email = f"{username}@demo.local"
            if User.objects.filter(username=username).exists():
                continue
            user = User(username=username, email=email, tipo_usuario="entidad")
            user.set_password(default_password)
            entidades_users_new.append(user)
        User.objects.bulk_create(entidades_users_new, batch_size=500)

        entidad_users = list(User.objects.filter(tipo_usuario="entidad").order_by("id")[:max(1, entidades_count * 2)])
        existing_entidad_user_ids = set(Entidad.objects.filter(user__in=entidad_users).values_list("user_id", flat=True))
        entidades = []
        for idx, user in enumerate(entidad_users):
            if user.id in existing_entidad_user_ids:
                continue
            entidades.append(
                Entidad(
                    user=user,
                    nombre_comercial=f"Empresa Demo {user.id}",
                    ruc=f"20{user.id:09d}"[:11],
                    direccion=f"Av. Demo {idx + 10}, {random.choice(CITIES)}",
                    contacto_referencia=f"Contacto {idx + 1}",
                    aprobado=True,
                )
            )
        Entidad.objects.bulk_create(entidades, batch_size=200)

        entidades = list(Entidad.objects.select_related("user").all())

        # 3) Servicios
        servicios = []
        for entidad in entidades:
            existing = Servicio.objects.filter(entidad=entidad).count()
            to_create = max(0, servicios_por_entidad - existing)
            for i in range(to_create):
                hr_ini = random.randint(6, 12)
                hr_fin = min(23, hr_ini + random.randint(2, 8))
                regular = Decimal(random.randint(80, 900))
                promo = random.choice([True, False])
                servicios.append(
                    Servicio(
                        entidad=entidad,
                        nombre=f"{random.choice(SERVICE_NAMES)} {entidad.id}-{i + 1}",
                        descripcion="Servicio demo para pruebas masivas",
                        hora_inicio=time(hr_ini, 0),
                        hora_fin=time(hr_fin, 0),
                        capacidad_maxima=random.randint(5, 150),
                        costo_regular=regular,
                        tiene_promocion=promo,
                        costo_promocional=(regular * Decimal("0.85")).quantize(Decimal("0.01")) if promo else None,
                        lugar=random.choice(CITIES),
                        contacto_referencia=entidad.contacto_referencia,
                        activo=True,
                    )
                )
        Servicio.objects.bulk_create(servicios, batch_size=500)
        all_servicios = list(Servicio.objects.all())

        # 4) Grupos y miembros
        if not persona_users:
            self.stdout.write(self.style.ERROR("No hay usuarios persona para continuar."))
            return

        grupos = []
        for i in range(grupos_count):
            creador = random.choice(persona_users)
            grupos.append(Grupo(nombre=f"Grupo Demo {timezone.now().strftime('%m%d')}-{i + 1}", descripcion="Grupo de prueba", creado_por=creador))
        Grupo.objects.bulk_create(grupos, batch_size=200)

        grupos = list(Grupo.objects.order_by("-id")[:grupos_count])
        miembros = []
        for grupo in grupos:
            sample_size = min(len(persona_users), random.randint(3, 10))
            members = random.sample(persona_users, sample_size)
            admin_added = False
            for user in members:
                miembros.append(
                    MiembroGrupo(
                        grupo=grupo,
                        usuario=user,
                        rol="admin" if (not admin_added and user == grupo.creado_por) else "miembro",
                        activo=True,
                    )
                )
                if user == grupo.creado_por:
                    admin_added = True
            if not admin_added:
                miembros.append(MiembroGrupo(grupo=grupo, usuario=grupo.creado_por, rol="admin", activo=True))
        MiembroGrupo.objects.bulk_create(miembros, ignore_conflicts=True, batch_size=1000)

        # 5) Planes
        now = timezone.now()
        planes = []
        for i in range(planes_ind_count):
            creador = random.choice(persona_users)
            start = now + timedelta(days=random.randint(-30, 120), hours=random.randint(0, 10))
            end = start + timedelta(hours=random.randint(8, 60))
            planes.append(
                PlanGrupal(
                    nombre=f"Plan Individual {i + 1}",
                    descripcion="Plan individual demo",
                    tipo_plan="individual",
                    grupo=None,
                    servicio=random.choice(all_servicios) if all_servicios and random.random() < 0.3 else None,
                    lider=creador,
                    creado_por=creador,
                    estado=random.choice(["propuesto", "confirmado", "borrador"]),
                    fecha_inicio=start,
                    fecha_fin=end,
                )
            )

        for i in range(planes_grp_count):
            grupo = random.choice(grupos)
            start = now + timedelta(days=random.randint(-30, 120), hours=random.randint(0, 10))
            end = start + timedelta(hours=random.randint(8, 90))
            planes.append(
                PlanGrupal(
                    nombre=f"Plan Grupal {i + 1}",
                    descripcion="Plan grupal demo",
                    tipo_plan="grupal",
                    grupo=grupo,
                    servicio=random.choice(all_servicios) if all_servicios and random.random() < 0.2 else None,
                    lider=grupo.creado_por,
                    creado_por=grupo.creado_por,
                    estado=random.choice(["propuesto", "confirmado", "borrador"]),
                    fecha_inicio=start,
                    fecha_fin=end,
                )
            )
        PlanGrupal.objects.bulk_create(planes, batch_size=500)

        new_planes = list(PlanGrupal.objects.order_by("-id")[: (planes_ind_count + planes_grp_count)])

        # participaciones para planes grupales
        participaciones = []
        membresia_por_grupo = {}
        for mg in MiembroGrupo.objects.filter(grupo__in=[p.grupo for p in new_planes if p.grupo_id], activo=True):
            membresia_por_grupo.setdefault(mg.grupo_id, []).append(mg.usuario_id)

        for plan in new_planes:
            if plan.tipo_plan != "grupal" or not plan.grupo_id:
                continue
            for user_id in membresia_por_grupo.get(plan.grupo_id, []):
                participaciones.append(ParticipacionPlan(plan=plan, usuario_id=user_id, acepta_participar=None))
        ParticipacionPlan.objects.bulk_create(participaciones, ignore_conflicts=True, batch_size=1500)

        # 6) Actividades y asignaciones
        actividades = []
        for plan in new_planes:
            base_start = plan.fecha_inicio or now
            base_end = plan.fecha_fin or (base_start + timedelta(days=1))
            total_seconds = max(3600, int((base_end - base_start).total_seconds()))
            for i in range(acts_per_plan):
                offset = int((i / max(1, acts_per_plan)) * total_seconds * 0.8)
                start = base_start + timedelta(seconds=offset)
                end = min(base_end, start + timedelta(hours=random.randint(1, 6)))
                if end <= start:
                    end = start + timedelta(hours=1)
                actividades.append(
                    ActividadPlan(
                        plan=plan,
                        titulo=f"Actividad {i + 1} - {plan.nombre}",
                        descripcion="Actividad demo",
                        fecha_inicio=start,
                        fecha_fin=end,
                        orden=i,
                    )
                )
        ActividadPlan.objects.bulk_create(actividades, batch_size=1000)

        new_acts = list(ActividadPlan.objects.order_by("-id")[: len(actividades)])
        asignaciones = []
        for act in new_acts:
            if not all_servicios:
                break
            for _ in range(asig_per_act):
                serv = random.choice(all_servicios)
                start = act.fecha_inicio
                end = act.fecha_fin
                asignaciones.append(
                    ActividadServicio(
                        actividad=act,
                        servicio=serv,
                        usuario_asignador=act.plan.creado_por,
                        fecha_inicio=start,
                        fecha_fin=end,
                        estado=random.choice(["interes", "confirmado", "cancelado"]),
                    )
                )
        ActividadServicio.objects.bulk_create(asignaciones, batch_size=1000)

        # 7) Finanzas
        movimientos = []
        for i in range(movimientos_count):
            user = random.choice(persona_users)
            tipo = random.choice(["gasto_grupal", "gasto_individual", "prestamo", "pago_prestamo"])
            grupo = random.choice(grupos) if (tipo == "gasto_grupal" and grupos) else None
            plan = random.choice(new_planes) if random.random() < 0.4 and new_planes else None
            movimientos.append(
                MovimientoFinanciero(
                    usuario=user,
                    grupo=grupo,
                    plan_grupal=plan,
                    tipo_movimiento=tipo,
                    descripcion=f"Movimiento demo {i + 1}",
                    monto=Decimal(random.randint(20, 2000)),
                    fecha=(now - timedelta(days=random.randint(0, 180))).date(),
                )
            )
        MovimientoFinanciero.objects.bulk_create(movimientos, batch_size=1000)

        new_moves = list(MovimientoFinanciero.objects.order_by("-id")[:movimientos_count])
        divisiones = []
        for mov in new_moves:
            if mov.tipo_movimiento != "gasto_grupal" or not mov.grupo_id:
                continue
            miembros_ids = list(
                MiembroGrupo.objects.filter(grupo_id=mov.grupo_id, activo=True).values_list("usuario_id", flat=True)
            )[:5]
            if not miembros_ids:
                continue
            monto_por = (mov.monto / len(miembros_ids)).quantize(Decimal("0.01"))
            for uid in miembros_ids:
                divisiones.append(DivisionMovimiento(movimiento=mov, usuario_id=uid, monto_asignado=monto_por))
        DivisionMovimiento.objects.bulk_create(divisiones, batch_size=1000)

        prestamos = []
        if len(persona_users) >= 2 and grupos:
            for _ in range(prestamos_count):
                prestamista, deudor = random.sample(persona_users, 2)
                monto = Decimal(random.randint(100, 2500))
                saldo = (monto * Decimal(random.uniform(0.1, 1))).quantize(Decimal("0.01"))
                prestamos.append(
                    Prestamo(
                        grupo=random.choice(grupos),
                        prestamista=prestamista,
                        deudor=deudor,
                        monto=monto,
                        saldo_pendiente=saldo,
                    )
                )
        Prestamo.objects.bulk_create(prestamos, batch_size=500)

        self.stdout.write(self.style.SUCCESS("✅ Seed masivo completado"))
        self.stdout.write(
            self.style.SUCCESS(
                f"Usuarios: {User.objects.count()} | Perfiles: {PersonaProfile.objects.count()} | "
                f"Entidades: {Entidad.objects.count()} | Servicios: {Servicio.objects.count()} | "
                f"Grupos: {Grupo.objects.count()} | Planes: {PlanGrupal.objects.count()} | "
                f"Actividades: {ActividadPlan.objects.count()} | Asignaciones: {ActividadServicio.objects.count()} | "
                f"Movimientos: {MovimientoFinanciero.objects.count()} | Prestamos: {Prestamo.objects.count()}"
            )
        )