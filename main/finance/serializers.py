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

    class Meta:
        model = MovimientoFinanciero
        fields = "__all__"
        read_only_fields = ["usuario", "created_at"]

    def validate(self, data):
        grupo = data.get("grupo")
        plan = data.get("plan_grupal")
        user = self.context["request"].user

        if grupo:
            if not MiembroGrupo.objects.filter(
                grupo=grupo,
                usuario=user,
                activo=True
            ).exists():
                raise serializers.ValidationError(
                    "No perteneces a este grupo."
                )

        if data["monto"] <= 0:
            raise serializers.ValidationError(
                "El monto debe ser mayor a 0."
            )

        return data

    @transaction.atomic
    def create(self, validated_data):
        divisiones_data = validated_data.pop("divisiones", [])
        user = self.context["request"].user
        monto_total = validated_data["monto"]
        grupo = validated_data.get("grupo")

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
        else:
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
