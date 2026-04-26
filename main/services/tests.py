from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Entidad, Servicio, ServicioCategoria


class ServicioHorariosAPITests(APITestCase):
    def setUp(self):
        self.category, _ = ServicioCategoria.objects.get_or_create(nombre="Tours", defaults={"orden": 1})
        self.user = get_user_model().objects.create_user(
            username="entidad",
            email="entidad@test.com",
            password="secret123",
            tipo_usuario="entidad",
        )
        self.entidad = Entidad.objects.create(
            user=self.user,
            nombre_comercial="Planly Tours",
            direccion="Lima",
            contacto_referencia="999999999",
            aprobado=True,
        )
        self.client.force_authenticate(self.user)

    def test_crea_servicio_con_multiples_horarios(self):
        inicio = timezone.now() + timedelta(days=1)
        payload = {
            "categoria": "Tours",
            "nombre": "Tour nocturno",
            "descripcion": "Recorrido guiado",
            "capacidad_maxima": 15,
            "costo_regular": "120.00",
            "modalidad_pago": "reserva_total_previo",
            "porcentaje_reserva": "30.00",
            "porcentaje_pago_previo": "70.00",
            "dias_antes_pago_previo": 5,
            "lugar": "Centro de Lima",
            "contacto_referencia": "Guia principal",
            "horarios": [
                {
                    "fecha_inicio": inicio.isoformat(),
                    "fecha_fin": (inicio + timedelta(hours=2)).isoformat(),
                },
                {
                    "fecha_inicio": (inicio + timedelta(days=1)).isoformat(),
                    "fecha_fin": (inicio + timedelta(days=1, hours=3)).isoformat(),
                },
            ],
        }

        response = self.client.post(reverse("mis-servicios-list"), payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        servicio = Servicio.objects.get(pk=response.data["id"])
        self.assertEqual(servicio.horarios.count(), 2)
        self.assertEqual(response.data["horario_resumen"]["total_horarios"], 2)
        self.assertIsNotNone(response.data["hora_inicio"])
        self.assertIsNotNone(response.data["hora_fin"])
        self.assertEqual(response.data["modalidad_pago"], "reserva_total_previo")
        self.assertEqual(
            response.data["forma_pago_resumen"],
            "Reserva del 30.00% y pago restante del 70.00% 5 dias antes del servicio.",
        )

    def test_actualiza_horarios_reemplazando_los_existentes(self):
        servicio = Servicio.objects.create(
            entidad=self.entidad,
            categoria="Tours",
            nombre="Tour de prueba",
            descripcion="Servicio base",
            hora_inicio="08:00:00",
            hora_fin="10:00:00",
            capacidad_maxima=10,
            costo_regular="90.00",
            lugar="Barranco",
            contacto_referencia="Coordinador",
        )
        inicio = timezone.now() + timedelta(days=2)
        servicio.horarios.create(fecha_inicio=inicio, fecha_fin=inicio + timedelta(hours=2))

        payload = {
            "horarios": [
                {
                    "fecha_inicio": (inicio + timedelta(days=4)).isoformat(),
                    "fecha_fin": (inicio + timedelta(days=4, hours=1)).isoformat(),
                }
            ]
        }

        response = self.client.patch(reverse("mis-servicios-detail", args=[servicio.id]), payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        servicio.refresh_from_db()
        self.assertEqual(servicio.horarios.count(), 1)

    def test_rechaza_horarios_superpuestos(self):
        inicio = timezone.now() + timedelta(days=1)
        payload = {
            "categoria": "Tours",
            "nombre": "Tour invalido",
            "descripcion": "Recorrido guiado",
            "capacidad_maxima": 15,
            "costo_regular": "120.00",
            "lugar": "Centro de Lima",
            "contacto_referencia": "Guia principal",
            "horarios": [
                {
                    "fecha_inicio": inicio.isoformat(),
                    "fecha_fin": (inicio + timedelta(hours=2)).isoformat(),
                },
                {
                    "fecha_inicio": (inicio + timedelta(hours=1)).isoformat(),
                    "fecha_fin": (inicio + timedelta(hours=3)).isoformat(),
                },
            ],
        }

        response = self.client.post(reverse("mis-servicios-list"), payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("horarios", response.data)

    def test_rechaza_forma_pago_inconsistente(self):
        inicio = timezone.now() + timedelta(days=1)
        payload = {
            "categoria": "Tours",
            "nombre": "Tour con pagos invalidos",
            "descripcion": "Recorrido guiado",
            "capacidad_maxima": 15,
            "costo_regular": "120.00",
            "modalidad_pago": "reserva_total_previo",
            "porcentaje_reserva": "20.00",
            "porcentaje_pago_previo": "50.00",
            "dias_antes_pago_previo": 3,
            "lugar": "Centro de Lima",
            "contacto_referencia": "Guia principal",
            "horarios": [
                {
                    "fecha_inicio": inicio.isoformat(),
                    "fecha_fin": (inicio + timedelta(hours=2)).isoformat(),
                }
            ],
        }

        response = self.client.post(reverse("mis-servicios-list"), payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("porcentaje_pago_previo", response.data)

    def test_rechaza_categoria_que_no_existe_en_tabla(self):
        inicio = timezone.now() + timedelta(days=1)
        payload = {
            "categoria": "No registrada",
            "nombre": "Tour sin categoria valida",
            "descripcion": "Recorrido guiado",
            "capacidad_maxima": 15,
            "costo_regular": "120.00",
            "lugar": "Centro de Lima",
            "contacto_referencia": "Guia principal",
            "horarios": [
                {
                    "fecha_inicio": inicio.isoformat(),
                    "fecha_fin": (inicio + timedelta(hours=2)).isoformat(),
                }
            ],
        }

        response = self.client.post(reverse("mis-servicios-list"), payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("categoria", response.data)


class ServicioPublicoMetricsTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="entidad-publica",
            email="entidad-publica@test.com",
            password="secret123",
            tipo_usuario="entidad",
        )
        self.entidad = Entidad.objects.create(
            user=self.user,
            nombre_comercial="Planly Aventura",
            direccion="Cusco",
            contacto_referencia="984000111",
            aprobado=True,
        )
        self.categoria, _ = ServicioCategoria.objects.get_or_create(nombre="Aventura", defaults={"orden": 1})
        self.servicio = Servicio.objects.create(
            entidad=self.entidad,
            categoria="Aventura",
            nombre="Ruta extrema",
            descripcion="Experiencia outdoor",
            hora_inicio="08:00:00",
            hora_fin="12:00:00",
            capacidad_maxima=8,
            costo_regular="200.00",
            lugar="Cusco",
            contacto_referencia="Guia principal",
        )

    def test_incrementa_visualizaciones_al_abrir_detalle_publico(self):
        response = self.client.get(reverse("web-servicio-detalle", args=[self.servicio.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.servicio.refresh_from_db()
        self.assertEqual(self.servicio.total_visualizaciones, 1)


class AdminDashboardAPITests(APITestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_user(
            username="planly-admin",
            email="admin@test.com",
            password="secret123",
            tipo_usuario="persona",
            is_staff=True,
            is_superuser=True,
        )
        self.category, _ = ServicioCategoria.objects.get_or_create(nombre="Tours", defaults={"orden": 1})
        entidad_user = get_user_model().objects.create_user(
            username="entidad-pendiente",
            email="entidad-pendiente@test.com",
            password="secret123",
            tipo_usuario="entidad",
        )
        self.entidad = Entidad.objects.create(
            user=entidad_user,
            nombre_comercial="Entidad pendiente",
            direccion="Lima",
            contacto_referencia="999888777",
            aprobado=False,
        )
        Servicio.objects.create(
            entidad=self.entidad,
            categoria="Tours",
            nombre="Tour pendiente",
            descripcion="Servicio de prueba",
            hora_inicio="09:00:00",
            hora_fin="11:00:00",
            capacidad_maxima=10,
            costo_regular="150.00",
            lugar="Lima",
            contacto_referencia="Coordinador",
            total_visualizaciones=7,
        )
        self.client.force_authenticate(self.admin)

    def test_dashboard_admin_retorna_metricas_clave(self):
        response = self.client.get(reverse("admin-dashboard"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["stats"]["usuarios_persona"], 1)
        self.assertEqual(response.data["stats"]["usuarios_entidad"], 1)
        self.assertEqual(response.data["stats"]["entidades_pendientes"], 1)
        tours_row = next(item for item in response.data["categorias"] if item["nombre"] == "Tours")
        self.assertEqual(tours_row["visualizaciones_count"], 7)

    def test_admin_puede_aprobar_entidad(self):
        response = self.client.post(reverse("admin-entidades-aprobar", args=[self.entidad.id]))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.entidad.refresh_from_db()
        self.assertTrue(self.entidad.aprobado)
