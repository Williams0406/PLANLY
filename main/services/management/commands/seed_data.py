from datetime import date, datetime
from decimal import Decimal

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from finance.models import DivisionMovimiento, MovimientoFinanciero, Prestamo
from groups.models import (
    ActividadPlan,
    ActividadServicio,
    ConfirmacionServicioIntegrante,
    Grupo,
    MiembroGrupo,
    ParticipacionPlan,
    PlanGrupal,
)
from services.models import Entidad, Servicio, ServicioHorario
from users.models import PersonaProfile, User


PASSWORD = "test1234"

PERSONAS_DATA = [
    {
        "username": "carlos_viajero",
        "email": "carlos@test.com",
        "telefono": "999000001",
        "nombres": "Carlos",
        "apellidos": "Mendoza",
        "ocupacion": "Ingeniero",
        "nacionalidad": "Peruana",
        "ciudad": "Lima",
    },
    {
        "username": "sofia_travel",
        "email": "sofia@test.com",
        "telefono": "999000002",
        "nombres": "Sofia",
        "apellidos": "Torres",
        "ocupacion": "Disenadora",
        "nacionalidad": "Peruana",
        "ciudad": "Cusco",
    },
    {
        "username": "miguel_tours",
        "email": "miguel@test.com",
        "telefono": "999000003",
        "nombres": "Miguel",
        "apellidos": "Ramos",
        "ocupacion": "Medico",
        "nacionalidad": "Peruana",
        "ciudad": "Arequipa",
    },
    {
        "username": "lucia_explorer",
        "email": "lucia@test.com",
        "telefono": "999000004",
        "nombres": "Lucia",
        "apellidos": "Vargas",
        "ocupacion": "Abogada",
        "nacionalidad": "Peruana",
        "ciudad": "Lima",
    },
    {
        "username": "pedro_adventure",
        "email": "pedro@test.com",
        "telefono": "999000005",
        "nombres": "Pedro",
        "apellidos": "Castro",
        "ocupacion": "Estudiante",
        "nacionalidad": "Peruana",
        "ciudad": "Trujillo",
    },
]

ENTIDADES_DATA = [
    {
        "username": "aventura_peru",
        "email": "contacto@aventuraperu.com",
        "telefono": "988100001",
        "nombre_comercial": "Aventura Peru Tours",
        "ruc": "20512345671",
        "direccion": "Av. El Sol 123, Cusco",
        "contacto_referencia": "Roberto Quispe - 984001001",
        "servicios": [
            {
                "categoria": "Tours",
                "nombre": "Tour Machu Picchu Full Day",
                "descripcion": "Visita guiada completa a Machu Picchu con transporte y guia.",
                "capacidad_maxima": 20,
                "costo_regular": Decimal("320.00"),
                "tiene_promocion": True,
                "costo_promocional": Decimal("269.00"),
                "modalidad_pago": Servicio.MODALIDAD_PAGO_RESERVA_TOTAL_PREVIO,
                "porcentaje_reserva": Decimal("35.00"),
                "porcentaje_pago_previo": Decimal("65.00"),
                "dias_antes_pago_previo": 7,
                "descripcion_forma_pago": "",
                "lugar": "Cusco",
                "horarios": [
                    ("2026-04-15T05:00:00-05:00", "2026-04-15T20:00:00-05:00"),
                    ("2026-04-16T05:00:00-05:00", "2026-04-16T20:00:00-05:00"),
                ],
            },
            {
                "categoria": "Tours",
                "nombre": "Valle Sagrado de los Incas",
                "descripcion": "Recorrido por Pisac, Ollantaytambo y Chinchero.",
                "capacidad_maxima": 15,
                "costo_regular": Decimal("180.00"),
                "tiene_promocion": False,
                "costo_promocional": None,
                "modalidad_pago": Servicio.MODALIDAD_PAGO_RESERVA,
                "porcentaje_reserva": Decimal("25.00"),
                "porcentaje_pago_previo": None,
                "dias_antes_pago_previo": None,
                "descripcion_forma_pago": "El saldo restante se paga al iniciar el tour.",
                "lugar": "Cusco",
                "horarios": [
                    ("2026-04-17T07:00:00-05:00", "2026-04-17T18:00:00-05:00"),
                    ("2026-04-18T07:00:00-05:00", "2026-04-18T18:00:00-05:00"),
                ],
            },
        ],
    },
    {
        "username": "lima_experiences",
        "email": "info@limaexperiences.com",
        "telefono": "988100002",
        "nombre_comercial": "Lima Experiences",
        "ruc": "20512345672",
        "direccion": "Jr. de la Union 456, Lima",
        "contacto_referencia": "Patricia Salas - 984002002",
        "servicios": [
            {
                "categoria": "Gastronomia",
                "nombre": "Tour Gastronomico Miraflores",
                "descripcion": "Ruta por mercados y restaurantes emblematicos de Miraflores.",
                "capacidad_maxima": 12,
                "costo_regular": Decimal("150.00"),
                "tiene_promocion": True,
                "costo_promocional": Decimal("120.00"),
                "modalidad_pago": Servicio.MODALIDAD_PAGO_COMPLETO,
                "porcentaje_reserva": None,
                "porcentaje_pago_previo": None,
                "dias_antes_pago_previo": None,
                "descripcion_forma_pago": "",
                "lugar": "Lima",
                "horarios": [
                    ("2026-04-12T12:00:00-05:00", "2026-04-12T17:00:00-05:00"),
                    ("2026-04-13T12:00:00-05:00", "2026-04-13T17:00:00-05:00"),
                ],
            },
            {
                "categoria": "Aventura",
                "nombre": "Parapente Miraflores al Atardecer",
                "descripcion": "Vuelo en parapente biplaza con vista al mar.",
                "capacidad_maxima": 6,
                "costo_regular": Decimal("200.00"),
                "tiene_promocion": False,
                "costo_promocional": None,
                "modalidad_pago": Servicio.MODALIDAD_PAGO_CONTRAENTREGA,
                "porcentaje_reserva": None,
                "porcentaje_pago_previo": None,
                "dias_antes_pago_previo": None,
                "descripcion_forma_pago": "",
                "lugar": "Lima",
                "horarios": [
                    ("2026-04-12T16:00:00-05:00", "2026-04-12T19:00:00-05:00"),
                    ("2026-04-13T16:00:00-05:00", "2026-04-13T19:00:00-05:00"),
                ],
            },
        ],
    },
    {
        "username": "arequipa_tours",
        "email": "tours@arequipatours.pe",
        "telefono": "988100003",
        "nombre_comercial": "Arequipa Tours Travel",
        "ruc": "20512345674",
        "direccion": "Calle Mercaderes 321, Arequipa",
        "contacto_referencia": "Carmen Medina - 984004004",
        "servicios": [
            {
                "categoria": "Aventura",
                "nombre": "Trekking Canon del Colca",
                "descripcion": "Trekking de dos dias con avistamiento de condores.",
                "capacidad_maxima": 14,
                "costo_regular": Decimal("280.00"),
                "tiene_promocion": True,
                "costo_promocional": Decimal("240.00"),
                "modalidad_pago": Servicio.MODALIDAD_PAGO_RESERVA_PREVIO_SALDO,
                "porcentaje_reserva": Decimal("20.00"),
                "porcentaje_pago_previo": Decimal("50.00"),
                "dias_antes_pago_previo": 4,
                "descripcion_forma_pago": "",
                "lugar": "Arequipa",
                "horarios": [
                    ("2026-04-20T04:00:00-05:00", "2026-04-20T19:00:00-05:00"),
                    ("2026-04-21T04:00:00-05:00", "2026-04-21T19:00:00-05:00"),
                ],
            },
            {
                "categoria": "City Tour",
                "nombre": "Tour Ciudad Blanca Arequipa",
                "descripcion": "Recorrido por los principales atractivos de Arequipa.",
                "capacidad_maxima": 20,
                "costo_regular": Decimal("95.00"),
                "tiene_promocion": False,
                "costo_promocional": None,
                "modalidad_pago": Servicio.MODALIDAD_PAGO_OTRA,
                "porcentaje_reserva": None,
                "porcentaje_pago_previo": None,
                "dias_antes_pago_previo": None,
                "descripcion_forma_pago": "Separa con S/ 20 y paga el resto 2 dias antes de la salida por transferencia.",
                "lugar": "Arequipa",
                "horarios": [
                    ("2026-04-20T09:00:00-05:00", "2026-04-20T15:00:00-05:00"),
                    ("2026-04-21T09:00:00-05:00", "2026-04-21T15:00:00-05:00"),
                ],
            },
        ],
    },
]

GRUPOS_DATA = [
    {
        "nombre": "Amigos del Cusco 2026",
        "descripcion": "Viaje grupal a Cusco en abril",
        "creado_por": "carlos_viajero",
        "miembros": ["carlos_viajero", "sofia_travel", "miguel_tours"],
        "plan": {
            "nombre": "Escapada Cusco",
            "descripcion": "Plan para recorrer Cusco y alrededores",
            "estado": "propuesto",
            "fecha_inicio": "2026-04-15T04:00:00-05:00",
            "fecha_fin": "2026-04-18T22:00:00-05:00",
            "actividades": [
                {
                    "titulo": "Machu Picchu",
                    "descripcion": "Salida principal",
                    "fecha_inicio": "2026-04-15T04:30:00-05:00",
                    "fecha_fin": "2026-04-15T21:00:00-05:00",
                    "orden": 1,
                    "servicio": "Tour Machu Picchu Full Day",
                    "servicio_horario_index": 0,
                    "estado": "interes",
                },
                {
                    "titulo": "Valle Sagrado",
                    "descripcion": "Segundo dia",
                    "fecha_inicio": "2026-04-17T06:30:00-05:00",
                    "fecha_fin": "2026-04-17T19:00:00-05:00",
                    "orden": 2,
                    "servicio": "Valle Sagrado de los Incas",
                    "servicio_horario_index": 0,
                    "estado": "confirmado",
                },
            ],
        },
    },
    {
        "nombre": "Lima Sunset Crew",
        "descripcion": "Plan de experiencias urbanas en Lima",
        "creado_por": "lucia_explorer",
        "miembros": ["lucia_explorer", "pedro_adventure", "sofia_travel"],
        "plan": {
            "nombre": "Lima de Dia y Atardecer",
            "descripcion": "Comida y aventura",
            "estado": "confirmado",
            "fecha_inicio": "2026-04-12T10:00:00-05:00",
            "fecha_fin": "2026-04-13T21:00:00-05:00",
            "actividades": [
                {
                    "titulo": "Almuerzo Miraflores",
                    "descripcion": "Ruta gastronomica",
                    "fecha_inicio": "2026-04-12T11:30:00-05:00",
                    "fecha_fin": "2026-04-12T17:30:00-05:00",
                    "orden": 1,
                    "servicio": "Tour Gastronomico Miraflores",
                    "servicio_horario_index": 0,
                    "estado": "confirmado",
                },
                {
                    "titulo": "Parapente",
                    "descripcion": "Atardecer frente al mar",
                    "fecha_inicio": "2026-04-12T15:30:00-05:00",
                    "fecha_fin": "2026-04-12T19:30:00-05:00",
                    "orden": 2,
                    "servicio": "Parapente Miraflores al Atardecer",
                    "servicio_horario_index": 0,
                    "estado": "interes",
                },
            ],
        },
    },
]


class Command(BaseCommand):
    help = "Genera datos demo actualizados para el esquema actual de Planly"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Limpia los datos demo antes de sembrar nuevos registros",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            self._reset_demo_data()

        self.stdout.write(self.style.WARNING("Generando datos demo actualizados..."))

        personas = self._crear_personas()
        entidades, servicios = self._crear_entidades_y_servicios()
        self._crear_grupos_planes_y_asignaciones(personas, servicios)
        self._crear_finanzas(personas)

        self.stdout.write(self.style.SUCCESS("Seed demo completado."))
        self.stdout.write(
            self.style.SUCCESS(
                f"Usuarios: {User.objects.count()} | "
                f"Perfiles: {PersonaProfile.objects.count()} | "
                f"Entidades: {Entidad.objects.count()} | "
                f"Servicios: {Servicio.objects.count()} | "
                f"Horarios: {ServicioHorario.objects.count()} | "
                f"Grupos: {Grupo.objects.count()} | "
                f"Planes: {PlanGrupal.objects.count()} | "
                f"Actividades: {ActividadPlan.objects.count()} | "
                f"Asignaciones: {ActividadServicio.objects.count()} | "
                f"Movimientos: {MovimientoFinanciero.objects.count()} | "
                f"Prestamos: {Prestamo.objects.count()}"
            )
        )
        self.stdout.write(self.style.WARNING(f"Password demo: {PASSWORD}"))

    def _reset_demo_data(self):
        self.stdout.write("Limpiando datos existentes del seed demo...")
        ConfirmacionServicioIntegrante.objects.all().delete()
        ActividadServicio.objects.all().delete()
        ActividadPlan.objects.all().delete()
        ParticipacionPlan.objects.all().delete()
        PlanGrupal.objects.all().delete()
        MiembroGrupo.objects.all().delete()
        Grupo.objects.all().delete()
        DivisionMovimiento.objects.all().delete()
        Prestamo.objects.all().delete()
        MovimientoFinanciero.objects.all().delete()
        ServicioHorario.objects.all().delete()
        Servicio.objects.all().delete()
        Entidad.objects.all().delete()
        PersonaProfile.objects.filter(user__username__in=[item["username"] for item in PERSONAS_DATA]).delete()

    def _crear_personas(self):
        personas = {}
        hashed_password = make_password(PASSWORD)

        for index, data in enumerate(PERSONAS_DATA, start=1):
            user, created = User.objects.get_or_create(
                username=data["username"],
                defaults={
                    "email": data["email"],
                    "password": hashed_password,
                    "tipo_usuario": "persona",
                    "telefono": data["telefono"],
                    "is_active": True,
                },
            )
            if not created:
                user.email = data["email"]
                user.telefono = data["telefono"]
                user.tipo_usuario = "persona"
                user.is_active = True
                user.save(update_fields=["email", "telefono", "tipo_usuario", "is_active"])

            PersonaProfile.objects.update_or_create(
                user=user,
                defaults={
                    "tipo_documento": "dni",
                    "numero_documento": f"70{index:06d}",
                    "nombres": data["nombres"],
                    "apellidos": data["apellidos"],
                    "fecha_nacimiento": date(1990 + index, min(index, 12), min(10 + index, 28)),
                    "ocupacion": data["ocupacion"],
                    "descripcion": f"{data['nombres']} disfruta viajar y organizar planes con amigos.",
                    "hobbies": "Viajes, fotografia, gastronomia",
                    "nacionalidad": data["nacionalidad"],
                    "ciudad": data["ciudad"],
                },
            )
            personas[user.username] = user
        return personas

    def _crear_entidades_y_servicios(self):
        entidades = {}
        servicios = {}
        hashed_password = make_password(PASSWORD)

        for entidad_data in ENTIDADES_DATA:
            user, created = User.objects.get_or_create(
                username=entidad_data["username"],
                defaults={
                    "email": entidad_data["email"],
                    "password": hashed_password,
                    "tipo_usuario": "entidad",
                    "telefono": entidad_data["telefono"],
                    "is_active": True,
                },
            )
            if not created:
                user.email = entidad_data["email"]
                user.telefono = entidad_data["telefono"]
                user.tipo_usuario = "entidad"
                user.is_active = True
                user.save(update_fields=["email", "telefono", "tipo_usuario", "is_active"])

            entidad, _ = Entidad.objects.update_or_create(
                user=user,
                defaults={
                    "nombre_comercial": entidad_data["nombre_comercial"],
                    "ruc": entidad_data["ruc"],
                    "direccion": entidad_data["direccion"],
                    "contacto_referencia": entidad_data["contacto_referencia"],
                    "aprobado": True,
                },
            )
            entidades[user.username] = entidad

            for servicio_data in entidad_data["servicios"]:
                first_start = datetime.fromisoformat(servicio_data["horarios"][0][0])
                first_end = datetime.fromisoformat(servicio_data["horarios"][0][1])
                servicio, _ = Servicio.objects.update_or_create(
                    entidad=entidad,
                    nombre=servicio_data["nombre"],
                    defaults={
                        "categoria": servicio_data["categoria"],
                        "descripcion": servicio_data["descripcion"],
                        "hora_inicio": first_start.time(),
                        "hora_fin": first_end.time(),
                        "capacidad_maxima": servicio_data["capacidad_maxima"],
                        "costo_regular": servicio_data["costo_regular"],
                        "tiene_promocion": servicio_data["tiene_promocion"],
                        "costo_promocional": servicio_data["costo_promocional"],
                        "modalidad_pago": servicio_data["modalidad_pago"],
                        "porcentaje_reserva": servicio_data["porcentaje_reserva"],
                        "porcentaje_pago_previo": servicio_data["porcentaje_pago_previo"],
                        "dias_antes_pago_previo": servicio_data["dias_antes_pago_previo"],
                        "descripcion_forma_pago": servicio_data["descripcion_forma_pago"],
                        "lugar": servicio_data["lugar"],
                        "contacto_referencia": entidad_data["contacto_referencia"],
                        "activo": True,
                    },
                )

                servicio.horarios.all().delete()
                ServicioHorario.objects.bulk_create(
                    [
                        ServicioHorario(
                            servicio=servicio,
                            fecha_inicio=datetime.fromisoformat(start),
                            fecha_fin=datetime.fromisoformat(end),
                        )
                        for start, end in servicio_data["horarios"]
                    ]
                )
                servicios[servicio.nombre] = servicio

        return entidades, servicios

    def _crear_grupos_planes_y_asignaciones(self, personas, servicios):
        for group_data in GRUPOS_DATA:
            creador = personas[group_data["creado_por"]]
            grupo, _ = Grupo.objects.get_or_create(
                nombre=group_data["nombre"],
                defaults={
                    "descripcion": group_data["descripcion"],
                    "creado_por": creador,
                },
            )
            if grupo.descripcion != group_data["descripcion"] or grupo.creado_por_id != creador.id:
                grupo.descripcion = group_data["descripcion"]
                grupo.creado_por = creador
                grupo.save(update_fields=["descripcion", "creado_por"])

            for username in group_data["miembros"]:
                MiembroGrupo.objects.update_or_create(
                    grupo=grupo,
                    usuario=personas[username],
                    defaults={
                        "rol": "admin" if username == group_data["creado_por"] else "miembro",
                        "activo": True,
                    },
                )

            plan_data = group_data["plan"]
            plan, _ = PlanGrupal.objects.update_or_create(
                grupo=grupo,
                nombre=plan_data["nombre"],
                defaults={
                    "descripcion": plan_data["descripcion"],
                    "tipo_plan": "grupal",
                    "servicio": None,
                    "lider": creador,
                    "creado_por": creador,
                    "estado": plan_data["estado"],
                    "fecha_inicio": datetime.fromisoformat(plan_data["fecha_inicio"]),
                    "fecha_fin": datetime.fromisoformat(plan_data["fecha_fin"]),
                },
            )

            miembros_ids = list(grupo.miembros.filter(activo=True).values_list("usuario_id", flat=True))
            for user_id in miembros_ids:
                ParticipacionPlan.objects.update_or_create(
                    plan=plan,
                    usuario_id=user_id,
                    defaults={
                        "acepta_participar": True,
                        "fecha_respuesta": timezone.now(),
                    },
                )

            actividades_existentes = {}
            for actividad in ActividadPlan.objects.filter(plan=plan):
                actividades_existentes[actividad.titulo] = actividad

            for actividad_data in plan_data["actividades"]:
                actividad, _ = ActividadPlan.objects.update_or_create(
                    plan=plan,
                    titulo=actividad_data["titulo"],
                    defaults={
                        "descripcion": actividad_data["descripcion"],
                        "fecha_inicio": datetime.fromisoformat(actividad_data["fecha_inicio"]),
                        "fecha_fin": datetime.fromisoformat(actividad_data["fecha_fin"]),
                        "orden": actividad_data["orden"],
                    },
                )
                actividades_existentes.pop(actividad.titulo, None)

                servicio = servicios[actividad_data["servicio"]]
                horario = servicio.horarios.all()[actividad_data["servicio_horario_index"]]

                asignacion, _ = ActividadServicio.objects.update_or_create(
                    actividad=actividad,
                    servicio=servicio,
                    defaults={
                        "usuario_asignador": creador,
                        "fecha_inicio": horario.fecha_inicio,
                        "fecha_fin": horario.fecha_fin,
                        "estado": actividad_data["estado"],
                    },
                )

                for user_id in miembros_ids:
                    ConfirmacionServicioIntegrante.objects.update_or_create(
                        asignacion=asignacion,
                        usuario_id=user_id,
                        defaults={
                            "estado": "aceptado" if actividad_data["estado"] == "confirmado" else "pendiente",
                            "fecha_respuesta": timezone.now() if actividad_data["estado"] == "confirmado" else None,
                            "mensaje": f"Confirma el servicio '{servicio.nombre}' para la actividad '{actividad.titulo}'.",
                        },
                    )

            for leftover in actividades_existentes.values():
                leftover.delete()

    def _crear_finanzas(self, personas):
        persona_list = list(personas.values())
        grupos = list(Grupo.objects.all())
        planes = list(PlanGrupal.objects.all())

        movimiento_specs = [
            {
                "usuario": personas["carlos_viajero"],
                "grupo": grupos[0] if grupos else None,
                "plan": planes[0] if planes else None,
                "tipo": "gasto_grupal",
                "descripcion": "Pasajes y reservas Cusco",
                "monto": Decimal("450.00"),
                "fecha": date(2026, 4, 10),
            },
            {
                "usuario": personas["lucia_explorer"],
                "grupo": grupos[1] if len(grupos) > 1 else None,
                "plan": planes[1] if len(planes) > 1 else None,
                "tipo": "gasto_grupal",
                "descripcion": "Reserva parapente y comida",
                "monto": Decimal("310.00"),
                "fecha": date(2026, 4, 11),
            },
            {
                "usuario": personas["sofia_travel"],
                "grupo": None,
                "plan": planes[0] if planes else None,
                "tipo": "gasto_individual",
                "descripcion": "Compras para el viaje",
                "monto": Decimal("95.00"),
                "fecha": date(2026, 4, 9),
            },
        ]

        for spec in movimiento_specs:
            movimiento, _ = MovimientoFinanciero.objects.update_or_create(
                usuario=spec["usuario"],
                descripcion=spec["descripcion"],
                fecha=spec["fecha"],
                defaults={
                    "grupo": spec["grupo"],
                    "plan_grupal": spec["plan"],
                    "tipo_movimiento": spec["tipo"],
                    "monto": spec["monto"],
                },
            )
            movimiento.divisiones.all().delete()
            if spec["tipo"] == "gasto_grupal" and spec["grupo"]:
                miembros = list(spec["grupo"].miembros.filter(activo=True).values_list("usuario_id", flat=True))
                if miembros:
                    monto_dividido = (spec["monto"] / len(miembros)).quantize(Decimal("0.01"))
                    DivisionMovimiento.objects.bulk_create(
                        [
                            DivisionMovimiento(
                                movimiento=movimiento,
                                usuario_id=user_id,
                                monto_asignado=monto_dividido,
                            )
                            for user_id in miembros
                        ]
                    )

        Prestamo.objects.update_or_create(
            grupo=grupos[0] if grupos else None,
            prestamista=persona_list[0],
            deudor=persona_list[1],
            defaults={
                "monto": Decimal("200.00"),
                "saldo_pendiente": Decimal("80.00"),
            },
        )
