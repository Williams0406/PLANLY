from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Entidad, Servicio


class ServicioHorariosAPITests(APITestCase):
    def setUp(self):
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
        self.assertEqual(response.data["forma_pago_resumen"], "Reserva del 30.00% y pago restante del 70.00% 5 dias antes del servicio.")

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
