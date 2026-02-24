# groups/serializers.py
from rest_framework import serializers
from django.utils import timezone
from .models import Grupo, MiembroGrupo, PlanGrupal, ParticipacionPlan


class GrupoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Grupo
        fields = "__all__"
        read_only_fields = ["creado_por"]

    def create(self, validated_data):
        user = self.context["request"].user

        if user.tipo_usuario != "persona":
            raise serializers.ValidationError("Solo personas pueden crear grupos.")

        grupo = Grupo.objects.create(creado_por=user, **validated_data)

        MiembroGrupo.objects.create(
            grupo=grupo,
            usuario=user,
            rol="admin"
        )

        return grupo

class PlanGrupalSerializer(serializers.ModelSerializer):

    class Meta:
        model = PlanGrupal
        fields = "__all__"
        read_only_fields = ["creado_por", "estado"]

    def validate(self, data):
        user = self.context["request"].user
        grupo = data["grupo"]

        if not MiembroGrupo.objects.filter(
            grupo=grupo,
            usuario=user,
            activo=True
        ).exists():
            raise serializers.ValidationError(
                "Solo miembros del grupo pueden crear planes."
            )

        return data

    def create(self, validated_data):
        user = self.context["request"].user
        grupo = validated_data["grupo"]

        plan = PlanGrupal.objects.create(
            creado_por=user,
            estado="propuesto",
            **validated_data
        )

        # Crear participaciones automáticas
        miembros = MiembroGrupo.objects.filter(grupo=grupo, activo=True)

        for miembro in miembros:
            ParticipacionPlan.objects.create(
                plan=plan,
                usuario=miembro.usuario
            )

        return plan

class ParticipacionPlanSerializer(serializers.ModelSerializer):

    class Meta:
        model = ParticipacionPlan
        fields = "__all__"
        read_only_fields = ["plan", "usuario", "fecha_respuesta"]

    def update(self, instance, validated_data):
        instance.acepta_participar = validated_data.get(
            "acepta_participar",
            instance.acepta_participar
        )
        instance.fecha_respuesta = timezone.now()
        instance.save()
        return instance