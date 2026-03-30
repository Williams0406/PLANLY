# finance/serializers.py
from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from .models import MovimientoFinanciero, DivisionMovimiento, Prestamo
from groups.models import MiembroGrupo

class MovimientoSerializer(serializers.ModelSerializer):
    divisiones = serializers.ListField(
        write_only=True,
        required=False
    )
    deudor_id = serializers.IntegerField(write_only=True, required=False)
    prestamo_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = MovimientoFinanciero
        fields = "__all__"
        read_only_fields = ["usuario", "created_at"]

    def validate(self, data):
        grupo = data.get("grupo")
        plan = data.get("plan_grupal")
        user = self.context["request"].user
        deudor_id = data.get("deudor_id")
        prestamo_id = data.get("prestamo_id")

        if grupo:
            if not MiembroGrupo.objects.filter(
                grupo=grupo,
                usuario=user,
                activo=True
            ).exists():
                raise serializers.ValidationError(
                    "No perteneces a este grupo."
                )

        if plan and plan.grupo_id and grupo and plan.grupo_id != grupo.id:
            raise serializers.ValidationError(
                "El grupo debe coincidir con el grupo del plan."
            )

        if data.get("tipo_movimiento") == "prestamo":
            if not plan:
                raise serializers.ValidationError(
                    {"plan_grupal": "Selecciona un plan para registrar el prestamo."}
                )
            if not plan.grupo_id:
                raise serializers.ValidationError(
                    {"plan_grupal": "El plan debe estar vinculado a un grupo."}
                )
            if not deudor_id:
                raise serializers.ValidationError(
                    {"deudor_id": "Selecciona un deudor del grupo."}
                )
            miembro_deudor = MiembroGrupo.objects.filter(
                grupo=plan.grupo,
                usuario_id=deudor_id,
                activo=True,
            ).exists()
            if not miembro_deudor:
                raise serializers.ValidationError(
                    {"deudor_id": "El deudor debe pertenecer al grupo del plan."}
                )
            if deudor_id == user.id:
                raise serializers.ValidationError(
                    {"deudor_id": "No puedes registrarte como tu propio deudor."}
                )

        if data.get("tipo_movimiento") == "pago_prestamo":
            if not prestamo_id:
                raise serializers.ValidationError(
                    {"prestamo_id": "Selecciona un prestamo a pagar."}
                )
            prestamo = Prestamo.objects.filter(id=prestamo_id, deudor=user).first()
            if not prestamo:
                raise serializers.ValidationError(
                    {"prestamo_id": "Solo puedes pagar prestamos donde seas el deudor."}
                )
            if data["monto"] > prestamo.monto:
                raise serializers.ValidationError(
                    {"monto": "El monto no puede superar el monto original del prestamo."}
                )
            if data["monto"] > prestamo.saldo_pendiente:
                raise serializers.ValidationError(
                    {"monto": "El monto no puede superar el saldo pendiente del prestamo."}
                )

        if data["monto"] <= 0:
            raise serializers.ValidationError(
                "El monto debe ser mayor a 0."
            )

        return data

    @transaction.atomic
    def create(self, validated_data):
        divisiones_data = validated_data.pop("divisiones", [])
        deudor_id = validated_data.pop("deudor_id", None)
        prestamo_id = validated_data.pop("prestamo_id", None)
        user = self.context["request"].user
        monto_total = validated_data["monto"]
        plan = validated_data.get("plan_grupal")
        grupo = validated_data.get("grupo") or getattr(plan, "grupo", None)
        if grupo and not validated_data.get("grupo"):
            validated_data["grupo"] = grupo

        movimiento = MovimientoFinanciero.objects.create(
            usuario=user,
            **validated_data
        )

        # Si no se envían divisiones y es gasto grupal → dividir automático
        if not divisiones_data and grupo:
            miembros = MiembroGrupo.objects.filter(
                grupo=grupo,
                activo=True
            )

            cantidad = miembros.count()
            monto_dividido = monto_total / cantidad

            for miembro in miembros:
                DivisionMovimiento.objects.create(
                    movimiento=movimiento,
                    usuario=miembro.usuario,
                    monto_asignado=monto_dividido
                )
        elif divisiones_data:
            suma = Decimal("0")

            for division in divisiones_data:
                suma += Decimal(str(division["monto"]))

            if suma != monto_total:
                raise serializers.ValidationError(
                    "La suma de divisiones debe ser igual al monto total."
                )

            for division in divisiones_data:
                DivisionMovimiento.objects.create(
                    movimiento=movimiento,
                    usuario_id=division["usuario_id"],
                    monto_asignado=division["monto"]
                )

        if movimiento.tipo_movimiento == "prestamo":
            Prestamo.objects.create(
                grupo=plan.grupo,
                prestamista=user,
                deudor_id=deudor_id,
                monto=monto_total,
                saldo_pendiente=monto_total,
            )

        if movimiento.tipo_movimiento == "pago_prestamo":
            prestamo = Prestamo.objects.get(id=prestamo_id, deudor=user)
            prestamo.saldo_pendiente -= monto_total
            prestamo.save(update_fields=["saldo_pendiente"])

        return movimiento

class PrestamoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Prestamo
        fields = "__all__"
        read_only_fields = ["prestamista", "saldo_pendiente", "created_at"]

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["prestamista"] = user
        validated_data["saldo_pendiente"] = validated_data["monto"]

        return Prestamo.objects.create(**validated_data)
