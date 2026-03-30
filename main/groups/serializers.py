from django.utils import timezone
from rest_framework import serializers
from users.serializers import PersonaPhotoPublicSerializer
from .models import ActividadPlan, ActividadServicio, ConfirmacionServicioIntegrante, Grupo, MiembroGrupo, ParticipacionPlan, PlanGrupal, SolicitudCambioPlan, VotoCambioPlan


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
        MiembroGrupo.objects.create(grupo=grupo, usuario=user, rol="admin")
        return grupo


class GrupoMemberSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="usuario.id", read_only=True)
    username = serializers.CharField(source="usuario.username", read_only=True)
    nombre_mostrar = serializers.SerializerMethodField()
    ocupacion = serializers.SerializerMethodField()
    ciudad = serializers.SerializerMethodField()
    es_lider = serializers.SerializerMethodField()
    fotos = serializers.SerializerMethodField()

    class Meta:
        model = MiembroGrupo
        fields = ["id", "user_id", "username", "nombre_mostrar", "ocupacion", "ciudad", "rol", "es_lider", "fotos"]

    def get_nombre_mostrar(self, obj):
        if hasattr(obj.usuario, "persona_profile"):
            return f"{obj.usuario.persona_profile.nombres} {obj.usuario.persona_profile.apellidos}".strip()
        return obj.usuario.username

    def get_ocupacion(self, obj):
        return obj.usuario.persona_profile.ocupacion if hasattr(obj.usuario, "persona_profile") else ""

    def get_ciudad(self, obj):
        return obj.usuario.persona_profile.ciudad if hasattr(obj.usuario, "persona_profile") else ""

    def get_es_lider(self, obj):
        return obj.grupo.creado_por_id == obj.usuario_id

    def get_fotos(self, obj):
        if not hasattr(obj.usuario, "persona_profile"):
            return []
        fotos = obj.usuario.persona_profile.fotos.filter(visible=True).order_by("orden", "id")
        return PersonaPhotoPublicSerializer(fotos, many=True, context=self.context).data


class PlanGrupalSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanGrupal
        fields = "__all__"
        read_only_fields = ["creado_por", "estado", "lider"]

    def validate(self, data):
        user = self.context["request"].user
        grupo = data.get("grupo")
        tipo_plan = data.get("tipo_plan", getattr(self.instance, "tipo_plan", "grupal"))
        if tipo_plan == "grupal":
            if not grupo:
                raise serializers.ValidationError("Los planes grupales requieren grupo.")
            if not MiembroGrupo.objects.filter(grupo=grupo, usuario=user, activo=True).exists():
                raise serializers.ValidationError("Solo miembros del grupo pueden crear/editar planes grupales.")
        if tipo_plan == "individual" and grupo:
            raise serializers.ValidationError("Un plan individual no debe tener grupo.")
        fecha_inicio = data.get("fecha_inicio", getattr(self.instance, "fecha_inicio", None))
        fecha_fin = data.get("fecha_fin", getattr(self.instance, "fecha_fin", None))
        if fecha_inicio and fecha_fin and fecha_inicio >= fecha_fin:
            raise serializers.ValidationError("La fecha/hora de fin debe ser posterior al inicio.")
        return data

    def create(self, validated_data):
        user = self.context["request"].user
        grupo = validated_data.get("grupo")
        plan = PlanGrupal.objects.create(creado_por=user, lider=user, estado="propuesto", **validated_data)
        if plan.tipo_plan == "grupal":
            for miembro in MiembroGrupo.objects.filter(grupo=grupo, activo=True):
                ParticipacionPlan.objects.create(plan=plan, usuario=miembro.usuario)
        return plan


class ActividadPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActividadPlan
        fields = "__all__"

    def validate(self, data):
        if data["fecha_inicio"] >= data["fecha_fin"]:
            raise serializers.ValidationError("La fecha/hora de fin debe ser posterior al inicio.")
        plan = data["plan"]
        if plan.fecha_inicio and data["fecha_inicio"] < plan.fecha_inicio:
            raise serializers.ValidationError("La actividad no puede iniciar antes del plan.")
        if plan.fecha_fin and data["fecha_fin"] > plan.fecha_fin:
            raise serializers.ValidationError("La actividad no puede finalizar después del plan.")
        return data


class ActividadServicioSerializer(serializers.ModelSerializer):
    confirmaciones_resumen = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ActividadServicio
        fields = "__all__"
        read_only_fields = ["usuario_asignador", "estado", "movimiento_pago"]
    
    def get_confirmaciones_resumen(self, obj):
        return {
            "pendientes": obj.confirmaciones.filter(estado="pendiente").count(),
            "aceptadas": obj.confirmaciones.filter(estado="aceptado").count(),
            "rechazadas": obj.confirmaciones.filter(estado="rechazado").count(),
        }

    def validate(self, data):
        if data["fecha_inicio"] >= data["fecha_fin"]:
            raise serializers.ValidationError("La fecha/hora de fin debe ser posterior al inicio.")
        actividad = data["actividad"]
        if data["fecha_inicio"] < actividad.fecha_inicio or data["fecha_fin"] > actividad.fecha_fin:
            raise serializers.ValidationError("El servicio debe estar dentro de la ventana horaria de la actividad.")
        return data

    def create(self, validated_data):
        user = self.context["request"].user
        validated_data["usuario_asignador"] = user
        validated_data["estado"] = "interes"
        return super().create(validated_data)


class ConfirmacionServicioIntegranteSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source="usuario.username", read_only=True)
    plan_id = serializers.IntegerField(source="asignacion.actividad.plan_id", read_only=True)
    actividad_titulo = serializers.CharField(source="asignacion.actividad.titulo", read_only=True)
    servicio_nombre = serializers.CharField(source="asignacion.servicio.nombre", read_only=True)

    class Meta:
        model = ConfirmacionServicioIntegrante
        fields = ["id", "asignacion", "usuario", "usuario_nombre", "estado", "mensaje", "fecha_respuesta", "plan_id", "actividad_titulo", "servicio_nombre"]
        read_only_fields = ["usuario", "fecha_respuesta"]


class ParticipacionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParticipacionPlan
        fields = "__all__"
        read_only_fields = ["plan", "usuario", "fecha_respuesta"]

    def update(self, instance, validated_data):
        instance.acepta_participar = validated_data.get("acepta_participar", instance.acepta_participar)
        instance.fecha_respuesta = timezone.now()
        instance.save()
        return instance


class VotoCambioPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = VotoCambioPlan
        fields = "__all__"
        read_only_fields = ["solicitud", "usuario", "fecha_voto"]


class SolicitudCambioPlanSerializer(serializers.ModelSerializer):
    votos = VotoCambioPlanSerializer(many=True, read_only=True)

    class Meta:
        model = SolicitudCambioPlan
        fields = "__all__"
        read_only_fields = ["solicitado_por", "estado", "created_at"]
