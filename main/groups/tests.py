from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from finance.models import DivisionMovimiento, MovimientoFinanciero, Prestamo
from groups.models import Grupo, MiembroGrupo, PlanGrupal
from services.models import Entidad, Servicio


User = get_user_model()


class PlanFlowTests(APITestCase):
    def setUp(self):
        self.persona = User.objects.create_user(
            username="persona1",
            password="pass1234",
            tipo_usuario="persona",
        )
        self.persona2 = User.objects.create_user(
            username="persona2",
            password="pass1234",
            tipo_usuario="persona",
        )
        self.entidad_user = User.objects.create_user(
            username="entidad1",
            password="pass1234",
            tipo_usuario="entidad",
        )

        self.entidad = Entidad.objects.create(
            user=self.entidad_user,
            nombre_comercial="Tours SAC",
            direccion="Calle 1",
            contacto_referencia="999",
        )
        self.servicio = Servicio.objects.create(
            entidad=self.entidad,
            nombre="City Tour",
            descripcion="Tour completo",
            hora_inicio=timezone.now().time(),
            hora_fin=(timezone.now() + timedelta(hours=2)).time(),
            capacidad_maxima=10,
            costo_regular="100.00",
            lugar="Centro",
            contacto_referencia="999",
        )

    def test_servicio_se_asigna_en_interes_y_confirma_con_pago_automatico_grupal(self):
        self.client.force_authenticate(self.persona)
        start = timezone.now() + timedelta(days=1)
        end = start + timedelta(hours=8)

        grupo = Grupo.objects.create(nombre="Grupo City Tour", creado_por=self.persona)
        MiembroGrupo.objects.create(grupo=grupo, usuario=self.persona, rol="admin")
        MiembroGrupo.objects.create(grupo=grupo, usuario=self.persona2)

        plan_response = self.client.post(
            reverse("planes-list"),
            {
                "nombre": "Plan grupal",
                "tipo_plan": "grupal",
                "grupo": grupo.id,
                "fecha_inicio": start.isoformat(),
                "fecha_fin": end.isoformat(),
            },
            format="json",
        )
        self.assertEqual(plan_response.status_code, status.HTTP_201_CREATED)

        actividad_response = self.client.post(
            reverse("actividades-list"),
            {
                "plan": plan_response.data["id"],
                "titulo": "Mañana",
                "fecha_inicio": start.isoformat(),
                "fecha_fin": (start + timedelta(hours=3)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(actividad_response.status_code, status.HTTP_201_CREATED)

        asignacion_response = self.client.post(
            reverse("asignaciones-servicio-list"),
            {
                "actividad": actividad_response.data["id"],
                "servicio": self.servicio.id,
                "fecha_inicio": start.isoformat(),
                "fecha_fin": (start + timedelta(hours=2)).isoformat(),
            },
            format="json",
        )
        self.assertEqual(asignacion_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(asignacion_response.data["estado"], "interes")

        confirmar_response = self.client.post(
            reverse("asignaciones-servicio-confirmar-pago", args=[asignacion_response.data["id"]]),
            format="json",
        )

        self.assertEqual(confirmar_response.status_code, status.HTTP_200_OK)
        self.assertEqual(confirmar_response.data["tipo_movimiento"], "gasto_grupal")

        movimiento = MovimientoFinanciero.objects.get(id=confirmar_response.data["movimiento_id"])
        self.assertEqual(movimiento.monto, Decimal("100.00"))
        self.assertEqual(movimiento.tipo_movimiento, "gasto_grupal")
        self.assertEqual(movimiento.grupo_id, grupo.id)

        divisiones = DivisionMovimiento.objects.filter(movimiento=movimiento).order_by("usuario_id")
        self.assertEqual(divisiones.count(), 2)
        self.assertEqual(divisiones[0].monto_asignado + divisiones[1].monto_asignado, Decimal("100.00"))
        montos_por_usuario = {division.usuario_id: division.monto_asignado for division in divisiones}
        self.assertEqual(montos_por_usuario[self.persona.id], Decimal("50.00"))
        self.assertEqual(montos_por_usuario[self.persona2.id], Decimal("50.00"))

        prestamos = Prestamo.objects.filter(grupo=grupo, prestamista=self.persona)
        self.assertEqual(prestamos.count(), 1)
        self.assertEqual(prestamos.first().deudor_id, self.persona2.id)
        self.assertEqual(prestamos.first().monto, montos_por_usuario[self.persona2.id])
        self.assertEqual(prestamos.first().saldo_pendiente, montos_por_usuario[self.persona2.id])

    def test_servicio_puede_cancelarse(self):
        self.client.force_authenticate(self.persona)
        start = timezone.now() + timedelta(days=1)
        end = start + timedelta(hours=8)

        plan_response = self.client.post(
            reverse("planes-list"),
            {
                "nombre": "Plan personal",
                "tipo_plan": "individual",
                "fecha_inicio": start.isoformat(),
                "fecha_fin": end.isoformat(),
            },
            format="json",
        )
        actividad_response = self.client.post(
            reverse("actividades-list"),
            {
                "plan": plan_response.data["id"],
                "titulo": "Tarde",
                "fecha_inicio": start.isoformat(),
                "fecha_fin": (start + timedelta(hours=3)).isoformat(),
            },
            format="json",
        )
        asignacion_response = self.client.post(
            reverse("asignaciones-servicio-list"),
            {
                "actividad": actividad_response.data["id"],
                "servicio": self.servicio.id,
                "fecha_inicio": start.isoformat(),
                "fecha_fin": (start + timedelta(hours=2)).isoformat(),
            },
            format="json",
        )

        cancelar_response = self.client.post(
            reverse("asignaciones-servicio-cancelar", args=[asignacion_response.data["id"]]),
            {},
            format="json",
        )

        self.assertEqual(cancelar_response.status_code, status.HTTP_200_OK)
        self.assertEqual(cancelar_response.data["estado"], "cancelado")

    def test_plan_grupal_requiere_aprobacion_total_para_cambios(self):
        grupo = Grupo.objects.create(nombre="Viajeros", creado_por=self.persona)
        MiembroGrupo.objects.create(grupo=grupo, usuario=self.persona, rol="admin")
        MiembroGrupo.objects.create(grupo=grupo, usuario=self.persona2)

        self.client.force_authenticate(self.persona)
        start = timezone.now() + timedelta(days=2)
        end = start + timedelta(hours=6)

        create_response = self.client.post(
            reverse("planes-list"),
            {
                "nombre": "Plan grupal",
                "tipo_plan": "grupal",
                "grupo": grupo.id,
                "fecha_inicio": start.isoformat(),
                "fecha_fin": end.isoformat(),
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        plan_id = create_response.data["id"]

        update_response = self.client.patch(
            reverse("planes-detail", args=[plan_id]),
            {"nombre": "Plan grupal actualizado"},
            format="json",
        )
        self.assertEqual(update_response.status_code, status.HTTP_202_ACCEPTED)
        solicitud_id = update_response.data["solicitud_id"]

        self.client.force_authenticate(self.persona2)
        aprobar_response = self.client.post(
            reverse("solicitudes-cambio-aprobar", args=[solicitud_id]),
            {},
            format="json",
        )
        self.assertEqual(aprobar_response.status_code, status.HTTP_200_OK)

        plan = PlanGrupal.objects.get(id=plan_id)
        self.assertEqual(plan.nombre, "Plan grupal actualizado")
