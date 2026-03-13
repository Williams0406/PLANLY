from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from django.utils import timezone
from decimal import Decimal
import random

from users.models import User, PersonaProfile
from services.models import Entidad, Servicio
from groups.models import Grupo, MiembroGrupo, PlanGrupal, ParticipacionPlan
from finance.models import MovimientoFinanciero, DivisionMovimiento, Prestamo


# ──────────────────────────────────────────
# DATA DE MUESTRA
# ──────────────────────────────────────────

PERSONAS_DATA = [
    {"username": "carlos_viajero", "email": "carlos@test.com", "nombres": "Carlos", "apellidos": "Mendoza", "ocupacion": "Ingeniero", "nacionalidad": "Peruana", "ciudad": "Lima"},
    {"username": "sofia_travel",   "email": "sofia@test.com",  "nombres": "Sofía",  "apellidos": "Torres",  "ocupacion": "Diseñadora", "nacionalidad": "Peruana", "ciudad": "Cusco"},
    {"username": "miguel_tours",   "email": "miguel@test.com", "nombres": "Miguel", "apellidos": "Ramos",   "ocupacion": "Médico",    "nacionalidad": "Peruana", "ciudad": "Arequipa"},
    {"username": "lucia_explorer", "email": "lucia@test.com",  "nombres": "Lucía",  "apellidos": "Vargas",  "ocupacion": "Abogada",   "nacionalidad": "Peruana", "ciudad": "Lima"},
    {"username": "pedro_adventure","email": "pedro@test.com",  "nombres": "Pedro",  "apellidos": "Castro",  "ocupacion": "Estudiante","nacionalidad": "Peruana", "ciudad": "Trujillo"},
    {"username": "ana_wanderer",   "email": "ana@test.com",    "nombres": "Ana",    "apellidos": "Flores",  "ocupacion": "Profesora", "nacionalidad": "Peruana", "ciudad": "Lima"},
    {"username": "jose_backpacker","email": "jose@test.com",   "nombres": "José",   "apellidos": "Díaz",    "ocupacion": "Contador",  "nacionalidad": "Peruana", "ciudad": "Iquitos"},
    {"username": "maria_trips",    "email": "maria@test.com",  "nombres": "María",  "apellidos": "López",   "ocupacion": "Arquitecta","nacionalidad": "Peruana", "ciudad": "Lima"},
]

ENTIDADES_DATA = [
    {
        "username": "aventura_peru",
        "email": "contacto@aventuraperu.com",
        "nombre_comercial": "Aventura Perú Tours",
        "ruc": "20512345671",
        "direccion": "Av. El Sol 123, Cusco",
        "contacto": "Roberto Quispe",
    },
    {
        "username": "lima_experiences",
        "email": "info@limaexperiences.com",
        "nombre_comercial": "Lima Experiences",
        "ruc": "20512345672",
        "direccion": "Jr. de la Unión 456, Lima",
        "contacto": "Patricia Salas",
    },
    {
        "username": "manu_expeditions",
        "email": "reservas@manuexpeditions.com",
        "nombre_comercial": "Manu Expeditions",
        "ruc": "20512345673",
        "direccion": "Av. Pardo 789, Cusco",
        "contacto": "Carlos Flores",
    },
    {
        "username": "arequipa_tours",
        "email": "tours@arequipatours.pe",
        "nombre_comercial": "Arequipa Tours & Travel",
        "ruc": "20512345674",
        "direccion": "Calle Mercaderes 321, Arequipa",
        "contacto": "Carmen Medina",
    },
    {
        "username": "inka_trail",
        "email": "booking@inkatrail.pe",
        "nombre_comercial": "Inka Trail Adventures",
        "ruc": "20512345675",
        "direccion": "Plaza Regocijo 55, Cusco",
        "contacto": "Luis Huanca",
    },
]

SERVICIOS_DATA = [
    # Aventura Perú Tours
    {
        "entidad_idx": 0,
        "nombre": "Tour Machu Picchu Full Day",
        "descripcion": "Visita guiada completa a la ciudadela inca de Machu Picchu. Incluye transporte en tren desde Cusco, bus de subida y bajada, guía certificado bilingüe y entrada al sitio arqueológico.",
        "hora_inicio": "05:00:00",
        "hora_fin": "20:00:00",
        "capacidad_maxima": 20,
        "costo_regular": Decimal("320.00"),
        "tiene_promocion": True,
        "costo_promocional": Decimal("269.00"),
        "lugar": "Cusco",
        "contacto_referencia": "Roberto Quispe - 984001001",
    },
    {
        "entidad_idx": 0,
        "nombre": "Valle Sagrado de los Incas",
        "descripcion": "Recorrido por el Valle Sagrado incluyendo Pisac, Ollantaytambo y Chinchero. Almuerzo típico incluido. Ideal para conocer la cultura inca fuera de Machu Picchu.",
        "hora_inicio": "07:00:00",
        "hora_fin": "18:00:00",
        "capacidad_maxima": 15,
        "costo_regular": Decimal("180.00"),
        "tiene_promocion": False,
        "costo_promocional": None,
        "lugar": "Cusco",
        "contacto_referencia": "Roberto Quispe - 984001001",
    },
    {
        "entidad_idx": 0,
        "nombre": "Trekking Camino Inca 4 Días",
        "descripcion": "La ruta más icónica de Sudamérica. 4 días caminando por los Andes con vistas espectaculares, sitios arqueológicos y llegada a Machu Picchu al amanecer. Incluye camping, cocinero y porteadores.",
        "hora_inicio": "06:00:00",
        "hora_fin": "17:00:00",
        "capacidad_maxima": 16,
        "costo_regular": Decimal("850.00"),
        "tiene_promocion": True,
        "costo_promocional": Decimal("720.00"),
        "lugar": "Cusco",
        "contacto_referencia": "Roberto Quispe - 984001001",
    },
    # Lima Experiences
    {
        "entidad_idx": 1,
        "nombre": "Tour Gastronómico Miraflores",
        "descripcion": "Descubre los sabores de Lima en un recorrido por los mejores restaurantes y mercados de Miraflores. Incluye degustaciones en 5 lugares emblemáticos y cóctel de bienvenida con pisco sour.",
        "hora_inicio": "12:00:00",
        "hora_fin": "17:00:00",
        "capacidad_maxima": 12,
        "costo_regular": Decimal("150.00"),
        "tiene_promocion": True,
        "costo_promocional": Decimal("120.00"),
        "lugar": "Lima",
        "contacto_referencia": "Patricia Salas - 984002002",
    },
    {
        "entidad_idx": 1,
        "nombre": "City Tour Lima Histórica",
        "descripcion": "Recorrido por el Centro Histórico de Lima declarado Patrimonio Mundial por la UNESCO. Visita la Catedral, Plaza Mayor, Convento de San Francisco y sus famosas catacumbas.",
        "hora_inicio": "09:00:00",
        "hora_fin": "13:00:00",
        "capacidad_maxima": 25,
        "costo_regular": Decimal("80.00"),
        "tiene_promocion": False,
        "costo_promocional": None,
        "lugar": "Lima",
        "contacto_referencia": "Patricia Salas - 984002002",
    },
    {
        "entidad_idx": 1,
        "nombre": "Surf Lesson Miraflores",
        "descripcion": "Aprende a surfear en las olas de Miraflores con instructores certificados. Incluye equipo completo (tabla, traje de neopreno), clase teórica y 2 horas de práctica en el mar.",
        "hora_inicio": "08:00:00",
        "hora_fin": "11:00:00",
        "capacidad_maxima": 8,
        "costo_regular": Decimal("120.00"),
        "tiene_promocion": True,
        "costo_promocional": Decimal("95.00"),
        "lugar": "Lima",
        "contacto_referencia": "Patricia Salas - 984002002",
    },
    {
        "entidad_idx": 1,
        "nombre": "Parapente Miraflores al Atardecer",
        "descripcion": "Vuelo en parapente biplaza sobre los acantilados de Miraflores con vista al Océano Pacífico. La experiencia más emocionante de Lima. Fotos y video incluidos.",
        "hora_inicio": "16:00:00",
        "hora_fin": "19:00:00",
        "capacidad_maxima": 6,
        "costo_regular": Decimal("200.00"),
        "tiene_promocion": False,
        "costo_promocional": None,
        "lugar": "Lima",
        "contacto_referencia": "Patricia Salas - 984002002",
    },
    # Manu Expeditions
    {
        "entidad_idx": 2,
        "nombre": "Expedición Reserva Nacional del Manu",
        "descripcion": "Aventura de 5 días en la reserva de biodiversidad más grande del mundo. Avistamiento de aves, flora exótica, comunidades nativas y fauna amazónica. Todo incluido.",
        "hora_inicio": "06:00:00",
        "hora_fin": "18:00:00",
        "capacidad_maxima": 10,
        "costo_regular": Decimal("1200.00"),
        "tiene_promocion": True,
        "costo_promocional": Decimal("980.00"),
        "lugar": "Cusco",
        "contacto_referencia": "Carlos Flores - 984003003",
    },
    {
        "entidad_idx": 2,
        "nombre": "Kayak en el Lago Titicaca",
        "descripcion": "Aventura en kayak por el lago navegable más alto del mundo. Visitamos las islas flotantes de los Uros y la isla Taquile. Incluye equipo, guía y almuerzo en isla.",
        "hora_inicio": "08:00:00",
        "hora_fin": "17:00:00",
        "capacidad_maxima": 12,
        "costo_regular": Decimal("220.00"),
        "tiene_promocion": False,
        "costo_promocional": None,
        "lugar": "Puno",
        "contacto_referencia": "Carlos Flores - 984003003",
    },
    # Arequipa Tours
    {
        "entidad_idx": 3,
        "nombre": "Trekking Cañón del Colca",
        "descripcion": "Uno de los cañones más profundos del mundo. 2 días de trekking con avistamiento de cóndores, termas naturales en Chivay y pueblos típicos. Incluye alojamiento y guía.",
        "hora_inicio": "04:00:00",
        "hora_fin": "19:00:00",
        "capacidad_maxima": 14,
        "costo_regular": Decimal("280.00"),
        "tiene_promocion": True,
        "costo_promocional": Decimal("240.00"),
        "lugar": "Arequipa",
        "contacto_referencia": "Carmen Medina - 984004004",
    },
    {
        "entidad_idx": 3,
        "nombre": "Tour Ciudad Blanca Arequipa",
        "descripcion": "Recorrido por Arequipa, la ciudad del sillar blanco. Visita el Monasterio de Santa Catalina, Plaza de Armas, Mirador de Yanahuara y degustación de gastronomía arequipeña.",
        "hora_inicio": "09:00:00",
        "hora_fin": "15:00:00",
        "capacidad_maxima": 20,
        "costo_regular": Decimal("95.00"),
        "tiene_promocion": False,
        "costo_promocional": None,
        "lugar": "Arequipa",
        "contacto_referencia": "Carmen Medina - 984004004",
    },
    {
        "entidad_idx": 3,
        "nombre": "Escalada Volcán El Misti",
        "descripcion": "Ascenso al emblemático volcán El Misti (5,822 msnm). 2 días con campamento en la ruta. Incluye equipo técnico especializado, guías certificados en alta montaña y oxígeno de emergencia.",
        "hora_inicio": "02:00:00",
        "hora_fin": "18:00:00",
        "capacidad_maxima": 8,
        "costo_regular": Decimal("450.00"),
        "tiene_promocion": True,
        "costo_promocional": Decimal("380.00"),
        "lugar": "Arequipa",
        "contacto_referencia": "Carmen Medina - 984004004",
    },
    # Inka Trail Adventures
    {
        "entidad_idx": 4,
        "nombre": "Choquequirao Trek 4 Días",
        "descripcion": "La Machu Picchu sin turistas. Trekking de 4 días hasta la ciudadela de Choquequirao, considerada la joya oculta de los Incas. Solo accesible a pie, lo que garantiza experiencia exclusiva.",
        "hora_inicio": "05:00:00",
        "hora_fin": "18:00:00",
        "capacidad_maxima": 10,
        "costo_regular": Decimal("680.00"),
        "tiene_promocion": False,
        "costo_promocional": None,
        "lugar": "Cusco",
        "contacto_referencia": "Luis Huanca - 984005005",
    },
    {
        "entidad_idx": 4,
        "nombre": "Montaña de 7 Colores",
        "descripcion": "Visita a la icónica Montaña Vinicunca, conocida mundialmente por sus colores únicos. Incluye transporte desde Cusco, guía, bastones de trekking y desayuno andino.",
        "hora_inicio": "04:00:00",
        "hora_fin": "18:00:00",
        "capacidad_maxima": 18,
        "costo_regular": Decimal("140.00"),
        "tiene_promocion": True,
        "costo_promocional": Decimal("115.00"),
        "lugar": "Cusco",
        "contacto_referencia": "Luis Huanca - 984005005",
    },
    {
        "entidad_idx": 4,
        "nombre": "Rafting Río Urubamba",
        "descripcion": "Descenso en rafting por el río sagrado de los Incas. Rápidos de nivel II-III, perfectos para principiantes y aventureros. Incluye equipo completo, guía y almuerzo post-actividad.",
        "hora_inicio": "08:00:00",
        "hora_fin": "14:00:00",
        "capacidad_maxima": 16,
        "costo_regular": Decimal("160.00"),
        "tiene_promocion": False,
        "costo_promocional": None,
        "lugar": "Cusco",
        "contacto_referencia": "Luis Huanca - 984005005",
    },
]

GRUPOS_DATA = [
    {"nombre": "Amigos del Cusco 2025", "descripcion": "Viaje grupal a Cusco para Semana Santa"},
    {"nombre": "Familia Torres - Verano", "descripcion": "Vacaciones familiares en la playa"},
    {"nombre": "Team Building Empresa", "descripcion": "Actividad de integración laboral"},
    {"nombre": "Mochileros Lima-Cusco", "descripcion": "Ruta de mochileros por el sur del Perú"},
    {"nombre": "Cumpleaños de Sofía", "descripcion": "Celebración especial en Arequipa"},
]

MOVIMIENTOS_DATA = [
    {"descripcion": "Pasajes de bus Lima - Cusco", "monto": Decimal("180.00"), "tipo": "gasto_grupal"},
    {"descripcion": "Hospedaje Hostel Cusco 3 noches", "monto": Decimal("240.00"), "tipo": "gasto_grupal"},
    {"descripcion": "Cena en restaurante El Huacatay", "monto": Decimal("95.00"), "tipo": "gasto_grupal"},
    {"descripcion": "Entrada Machu Picchu", "monto": Decimal("152.00"), "tipo": "gasto_individual"},
    {"descripcion": "Taxi aeropuerto", "monto": Decimal("45.00"), "tipo": "gasto_individual"},
    {"descripcion": "Mercado artesanal Pisac", "monto": Decimal("60.00"), "tipo": "gasto_individual"},
    {"descripcion": "Préstamo para pasajes", "monto": Decimal("200.00"), "tipo": "prestamo"},
    {"descripcion": "Pago deuda cena", "monto": Decimal("95.00"), "tipo": "pago_prestamo"},
]


class Command(BaseCommand):
    help = "Genera datos de muestra completos para Planly"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Elimina todos los datos antes de crear nuevos",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            self.stdout.write("🗑️  Eliminando datos existentes...")
            self._reset_data()

        self.stdout.write(self.style.SUCCESS("🚀 Iniciando generación de datos de muestra...\n"))

        personas = self._crear_personas()
        entidades, servicios = self._crear_entidades_y_servicios()
        grupos = self._crear_grupos(personas)
        self._crear_planes(grupos, servicios, personas)
        self._crear_movimientos(personas, grupos)

        self.stdout.write("\n" + "="*50)
        self.stdout.write(self.style.SUCCESS("✅ Datos de muestra creados exitosamente!\n"))
        self.stdout.write(self.style.WARNING("📋 CREDENCIALES DE ACCESO:"))
        self.stdout.write("──────────────────────────────────────────")
        self.stdout.write("👤 PERSONAS (contraseña: test1234)")
        for p in PERSONAS_DATA:
            self.stdout.write(f"   • {p['username']}")
        self.stdout.write("\n🏢 ENTIDADES (contraseña: test1234)")
        for e in ENTIDADES_DATA:
            self.stdout.write(f"   • {e['username']} → {e['nombre_comercial']}")
        self.stdout.write("──────────────────────────────────────────")
        self.stdout.write(self.style.SUCCESS(f"""
📊 RESUMEN:
   • {len(personas)} usuarios persona
   • {len(entidades)} entidades aprobadas
   • {len(servicios)} servicios publicados
   • {len(grupos)} grupos creados
   • Planes y movimientos financieros generados
"""))

    def _reset_data(self):
        MovimientoFinanciero.objects.all().delete()
        Prestamo.objects.all().delete()
        ParticipacionPlan.objects.all().delete()
        PlanGrupal.objects.all().delete()
        MiembroGrupo.objects.all().delete()
        Grupo.objects.all().delete()
        Servicio.objects.all().delete()
        Entidad.objects.all().delete()
        from users.models import PersonaProfile, PersonaPhoto
        PersonaPhoto.objects.all().delete()
        PersonaProfile.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        self.stdout.write(self.style.SUCCESS("   ✓ Datos eliminados\n"))

    def _crear_personas(self):
        self.stdout.write("👤 Creando usuarios persona...")
        personas = []
        hashed_password = make_password("test1234")

        for i, data in enumerate(PERSONAS_DATA):
            user, created = User.objects.get_or_create(
                username=data["username"],
                defaults={
                    "email": data["email"],
                    "password": hashed_password,
                    "tipo_usuario": "persona",
                    "telefono": f"98400{i:04d}",
                    "is_active": True,
                },
            )

            if created:
                from datetime import date
                PersonaProfile.objects.get_or_create(
                    user=user,
                    defaults={
                        "tipo_documento": "dni",
                        "numero_documento": f"7000000{i+1}",
                        "nombres": data["nombres"],
                        "apellidos": data["apellidos"],
                        "fecha_nacimiento": date(1990 + i, (i % 12) + 1, 15),
                        "ocupacion": data["ocupacion"],
                        "descripcion": f"Amante de los viajes y las aventuras. {data['ocupacion']} de profesión.",
                        "hobbies": "Viajes, fotografía, senderismo, gastronomía",
                        "nacionalidad": data["nacionalidad"],
                        "ciudad": data["ciudad"],
                    },
                )
                self.stdout.write(f"   ✓ {user.username}")

            personas.append(user)

        return personas

    def _crear_entidades_y_servicios(self):
        self.stdout.write("\n🏢 Creando entidades y servicios...")
        entidades = []
        servicios_creados = []
        hashed_password = make_password("test1234")

        for data in ENTIDADES_DATA:
            user, created = User.objects.get_or_create(
                username=data["username"],
                defaults={
                    "email": data["email"],
                    "password": hashed_password,
                    "tipo_usuario": "entidad",
                    "is_active": True,
                },
            )

            entidad, _ = Entidad.objects.get_or_create(
                user=user,
                defaults={
                    "nombre_comercial": data["nombre_comercial"],
                    "ruc": data["ruc"],
                    "direccion": data["direccion"],
                    "contacto_referencia": data["contacto"],
                    "aprobado": True,  # Aprobadas automáticamente
                },
            )

            if created:
                self.stdout.write(f"   ✓ {entidad.nombre_comercial}")

            entidades.append(entidad)

        self.stdout.write("\n🎯 Creando servicios...")
        for data in SERVICIOS_DATA:
            entidad = entidades[data["entidad_idx"]]
            servicio, created = Servicio.objects.get_or_create(
                entidad=entidad,
                nombre=data["nombre"],
                defaults={
                    "descripcion": data["descripcion"],
                    "hora_inicio": data["hora_inicio"],
                    "hora_fin": data["hora_fin"],
                    "capacidad_maxima": data["capacidad_maxima"],
                    "costo_regular": data["costo_regular"],
                    "tiene_promocion": data["tiene_promocion"],
                    "costo_promocional": data["costo_promocional"],
                    "lugar": data["lugar"],
                    "contacto_referencia": data["contacto_referencia"],
                    "activo": True,
                },
            )
            if created:
                self.stdout.write(f"   ✓ {servicio.nombre} — S/{servicio.costo_regular}")
            servicios_creados.append(servicio)

        return entidades, servicios_creados

    def _crear_grupos(self, personas):
        self.stdout.write("\n👥 Creando grupos...")
        grupos = []

        for i, data in enumerate(GRUPOS_DATA):
            creador = personas[i % len(personas)]

            grupo, created = Grupo.objects.get_or_create(
                nombre=data["nombre"],
                defaults={
                    "descripcion": data["descripcion"],
                    "creado_por": creador,
                },
            )

            if created:
                # Admin: el creador
                MiembroGrupo.objects.get_or_create(
                    grupo=grupo,
                    usuario=creador,
                    defaults={"rol": "admin", "activo": True},
                )

                # Agregar 3-5 miembros aleatorios
                otros = [p for p in personas if p != creador]
                miembros = random.sample(otros, min(random.randint(2, 4), len(otros)))

                for miembro in miembros:
                    MiembroGrupo.objects.get_or_create(
                        grupo=grupo,
                        usuario=miembro,
                        defaults={"rol": "miembro", "activo": True},
                    )

                self.stdout.write(
                    f"   ✓ {grupo.nombre} ({grupo.miembros.count()} miembros)"
                )

            grupos.append(grupo)

        return grupos

    def _crear_planes(self, grupos, servicios, personas):
        self.stdout.write("\n🗺️  Creando planes grupales...")

        estados = ["propuesto", "confirmado", "propuesto", "confirmado", "cancelado"]

        for i, grupo in enumerate(grupos):
            miembros = MiembroGrupo.objects.filter(grupo=grupo, activo=True)
            if not miembros.exists():
                continue

            creador_miembro = miembros.filter(rol="admin").first()
            if not creador_miembro:
                continue

            # Crear 2 planes por grupo
            for j in range(2):
                servicio = servicios[(i * 2 + j) % len(servicios)]
                estado = estados[(i + j) % len(estados)]

                plan, created = PlanGrupal.objects.get_or_create(
                    grupo=grupo,
                    servicio=servicio,
                    defaults={
                        "creado_por": creador_miembro.usuario,
                        "estado": estado,
                    },
                )

                if created:
                    # Crear participaciones para todos los miembros
                    for miembro in miembros:
                        acepta = random.choice([True, True, False, None])
                        ParticipacionPlan.objects.get_or_create(
                            plan=plan,
                            usuario=miembro.usuario,
                            defaults={
                                "acepta_participar": acepta,
                                "fecha_respuesta": timezone.now() if acepta is not None else None,
                            },
                        )

        self.stdout.write(
            f"   ✓ {PlanGrupal.objects.count()} planes creados"
        )

    def _crear_movimientos(self, personas, grupos):
        self.stdout.write("\n💰 Creando movimientos financieros...")
        import datetime

        for i, persona in enumerate(personas[:5]):  # Solo primeros 5
            grupo = grupos[i % len(grupos)] if grupos else None

            for j, mov_data in enumerate(MOVIMIENTOS_DATA[:4]):
                fecha = datetime.date.today() - datetime.timedelta(days=random.randint(1, 60))

                mov = MovimientoFinanciero.objects.create(
                    usuario=persona,
                    grupo=grupo if mov_data["tipo"] == "gasto_grupal" else None,
                    tipo_movimiento=mov_data["tipo"],
                    descripcion=mov_data["descripcion"],
                    monto=mov_data["monto"],
                    fecha=fecha,
                )

                # División automática para gastos grupales
                if mov_data["tipo"] == "gasto_grupal" and grupo:
                    miembros = MiembroGrupo.objects.filter(grupo=grupo, activo=True)
                    cantidad = miembros.count()
                    if cantidad > 0:
                        monto_dividido = mov_data["monto"] / cantidad
                        for miembro in miembros:
                            DivisionMovimiento.objects.create(
                                movimiento=mov,
                                usuario=miembro.usuario,
                                monto_asignado=monto_dividido,
                            )

        self.stdout.write(
            f"   ✓ {MovimientoFinanciero.objects.count()} movimientos creados"
        )