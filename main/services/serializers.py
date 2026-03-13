# services/serializers.py
from rest_framework import serializers
from .models import Entidad, Servicio
from users.models import User

class EntidadSerializer(serializers.ModelSerializer):

    class Meta:
        model = Entidad
        exclude = ["user", "aprobado"]  # aprobado lo controla admin

    def create(self, validated_data):
        user = self.context["request"].user

        if user.tipo_usuario != "entidad":
            raise serializers.ValidationError(
                "Solo usuarios tipo entidad pueden crear perfil empresarial."
            )

        if hasattr(user, "entidad"):
            raise serializers.ValidationError(
                "Este usuario ya tiene una entidad registrada."
            )

        return Entidad.objects.create(user=user, **validated_data)

class ServicioSerializer(serializers.ModelSerializer):

    precio_actual = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Servicio
        fields = "__all__"
        read_only_fields = ["entidad", "created_at"]

    def get_precio_actual(self, obj):
        return obj.precio_actual()

    def validate(self, data):

        tiene_promocion = data.get("tiene_promocion")
        costo_promocional = data.get("costo_promocional")
        costo_regular = data.get("costo_regular")

        if tiene_promocion:
            if not costo_promocional:
                raise serializers.ValidationError(
                    "Debe especificar costo promocional."
                )

            if costo_promocional >= costo_regular:
                raise serializers.ValidationError(
                    "El costo promocional debe ser menor al regular."
                )

        return data

    def create(self, validated_data):
        user = self.context["request"].user

        if user.tipo_usuario != "entidad":
            raise serializers.ValidationError(
                "Solo entidades pueden crear servicios."
            )

        if not hasattr(user, "entidad"):
            raise serializers.ValidationError(
                "Debe crear primero su perfil de entidad."
            )

        if not user.entidad.aprobado:
            raise serializers.ValidationError(
                "La entidad debe estar aprobada para publicar servicios."
            )

        return Servicio.objects.create(
            entidad=user.entidad,
            **validated_data
        )

class ServicioPublicoSerializer(serializers.ModelSerializer):

    entidad_nombre = serializers.CharField(source="entidad.nombre_comercial", read_only=True)
    precio_actual = serializers.SerializerMethodField()

    class Meta:
        model = Servicio
        fields = [
            "id",
            "nombre",
            "descripcion",
            "lugar",
            "hora_inicio",
            "hora_fin",
            "capacidad_maxima",
            "precio_actual",
            "entidad_nombre",
            "imagen_principal",
        ]

    def get_precio_actual(self, obj):
        return obj.precio_actual()

class ServicioDetalleSerializer(serializers.ModelSerializer):
    """Serializer completo para la web"""
    entidad_nombre = serializers.CharField(
        source="entidad.nombre_comercial", read_only=True
    )
    entidad_direccion = serializers.CharField(
        source="entidad.direccion", read_only=True
    )
    precio_actual = serializers.SerializerMethodField()
    descuento_porcentaje = serializers.SerializerMethodField()

    class Meta:
        model = Servicio
        fields = [
            "id", "nombre", "descripcion", "lugar",
            "hora_inicio", "hora_fin", "capacidad_maxima",
            "costo_regular", "tiene_promocion", "costo_promocional",
            "precio_actual", "descuento_porcentaje",
            "entidad_nombre", "entidad_direccion",
            "imagen_principal", "activo", "created_at",
        ]

    def get_precio_actual(self, obj):
        return obj.precio_actual()

    def get_descuento_porcentaje(self, obj):
        if obj.tiene_promocion and obj.costo_promocional:
            descuento = (
                (obj.costo_regular - obj.costo_promocional)
                / obj.costo_regular * 100
            )
            return round(descuento, 1)
        return 0
