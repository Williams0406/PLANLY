from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from groups.models import ActividadPlan, ActividadServicio, Grupo, MiembroGrupo, PlanGrupal
from services.models import Entidad, Servicio
from finance.models import MovimientoFinanciero, Prestamo


User = get_user_model()


class FinancePendingServicesTests(APITestCase):
    def setUp(self):
        self.persona = User.objects.create_user(
            username="persona_finance",
            password="pass1234",
            tipo_usuario="persona",
        )
        self.persona2 = User.objects.create_user(
            username="persona_finance_2",
            password="pass1234",
            tipo_usuario="persona",
        )
        self.entidad_user = User.objects.create_user(
            username="entidad_finance",
            password="pass1234",
            tipo_usuario="entidad",
        )
        self.entidad = Entidad.objects.create(
            user=self.entidad_user,
            nombre_comercial="Tours Finance",
            direccion="Centro",
            contacto_referencia="999",
            aprobado=True,
        )
        self.grupo = Grupo.objects.create(nombre="Grupo Finance", creado_por=self.persona)
        MiembroGrupo.objects.create(grupo=self.grupo, usuario=self.persona, rol="admin")
        MiembroGrupo.objects.create(grupo=self.grupo, usuario=self.persona2)
        inicio = timezone.now() + timedelta(days=2)
        self.plan = PlanGrupal.objects.create(
            nombre="Plan Finance",
            tipo_plan="grupal",
            grupo=self.grupo,
            creado_por=self.persona,
            lider=self.persona,
            fecha_inicio=inicio,
            fecha_fin=inicio + timedelta(days=1),
        )
        self.actividad = ActividadPlan.objects.create(
            plan=self.plan,
            titulo="Actividad principal",
            fecha_inicio=inicio,
            fecha_fin=inicio + timedelta(hours=8),
        )
        self.servicio = Servicio.objects.create(
            entidad=self.entidad,
            categoria="Tours",
            nombre="Servicio con reserva",
            descripcion="Descripcion",
            hora_inicio=inicio.time(),
            hora_fin=(inicio + timedelta(hours=2)).time(),
            capacidad_maxima=10,
            costo_regular=Decimal("200.00"),
            modalidad_pago=Servicio.MODALIDAD_PAGO_RESERVA,
            porcentaje_reserva=Decimal("30.00"),
            lugar="Lima",
            contacto_referencia="999",
        )
        self.asignacion = ActividadServicio.objects.create(
            actividad=self.actividad,
            servicio=self.servicio,
            usuario_asignador=self.persona,
            fecha_inicio=inicio,
            fecha_fin=inicio + timedelta(hours=2),
            estado="interes",
        )

    def test_lista_servicios_pendientes_con_montos_sugeridos(self):
        self.client.force_authenticate(self.persona)

        response = self.client.get(
            reverse("movimientos-servicios-pendientes"),
            {"plan_id": self.plan.id},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        item = response.data[0]
        self.assertEqual(item["asignacion_id"], self.asignacion.id)
        self.assertEqual(item["servicio_nombre"], self.servicio.nombre)
        self.assertEqual(item["estado"], "interes")
        self.assertEqual(item["precio_total"], Decimal("200.00"))
        self.assertEqual(item["payment_options"][0]["tipo"], "adelanto")
        self.assertEqual(item["payment_options"][0]["monto"], Decimal("60.00"))
        self.assertEqual(item["payment_options"][1]["tipo"], "restante")
        self.assertEqual(item["payment_options"][1]["monto"], Decimal("140.00"))

    def test_crear_movimiento_prestamo_genera_prestamo_asociado(self):
        self.client.force_authenticate(self.persona)

        response = self.client.post(
            reverse("movimientos-list"),
            {
                "descripcion": "Prestamo para entradas",
                "monto": "80.00",
                "fecha": timezone.now().date().isoformat(),
                "tipo_movimiento": "prestamo",
                "plan_grupal": self.plan.id,
                "grupo": self.grupo.id,
                "deudor_id": self.persona2.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        movimiento = MovimientoFinanciero.objects.get(descripcion="Prestamo para entradas")
        prestamo = Prestamo.objects.get(prestamista=self.persona, deudor=self.persona2, grupo=self.grupo)
        self.assertEqual(movimiento.tipo_movimiento, "prestamo")
        self.assertEqual(prestamo.monto, Decimal("80.00"))
        self.assertEqual(prestamo.saldo_pendiente, Decimal("80.00"))

    def test_contexto_prestamo_devuelve_planes_y_deudores(self):
        self.client.force_authenticate(self.persona)

        response = self.client.get(reverse("movimientos-prestamo-contexto"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.plan.id)
        self.assertEqual(response.data[0]["grupo_id"], self.grupo.id)
        self.assertEqual(response.data[0]["deudores"][0]["id"], self.persona2.id)

    def test_deudas_devuelve_prestamos_del_usuario_como_deudor(self):
        Prestamo.objects.create(
            grupo=self.grupo,
            prestamista=self.persona,
            deudor=self.persona2,
            monto=Decimal("90.00"),
            saldo_pendiente=Decimal("55.00"),
        )
        self.client.force_authenticate(self.persona2)

        response = self.client.get(reverse("prestamos-deudas"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["prestamista_username"], self.persona.username)
        self.assertEqual(response.data[0]["monto"], Decimal("90.00"))
        self.assertEqual(response.data[0]["saldo_pendiente"], Decimal("55.00"))

    def test_pago_prestamo_desde_movimiento_reduce_saldo(self):
        prestamo = Prestamo.objects.create(
            grupo=self.grupo,
            prestamista=self.persona,
            deudor=self.persona2,
            monto=Decimal("120.00"),
            saldo_pendiente=Decimal("80.00"),
        )
        self.client.force_authenticate(self.persona2)

        response = self.client.post(
            reverse("movimientos-list"),
            {
                "descripcion": "Pago parcial",
                "monto": "50.00",
                "fecha": timezone.now().date().isoformat(),
                "tipo_movimiento": "pago_prestamo",
                "prestamo_id": prestamo.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        prestamo.refresh_from_db()
        self.assertEqual(prestamo.saldo_pendiente, Decimal("30.00"))
        self.assertEqual(
            MovimientoFinanciero.objects.filter(usuario=self.persona2, tipo_movimiento="pago_prestamo").count(),
            1,
        )
