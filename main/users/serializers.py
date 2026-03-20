# users/serializers.py
from django.db.models import Q
from rest_framework import serializers
from .models import User, PersonaProfile, PersonaPhoto, FriendRequest


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "password", "tipo_usuario"]

    def validate(self, data):
        if data["tipo_usuario"] not in ["persona", "entidad"]:
            raise serializers.ValidationError("Tipo de usuario inválido.")
        return data

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserPublicSerializer(serializers.ModelSerializer):
    nombre_mostrar = serializers.SerializerMethodField()
    ocupacion = serializers.SerializerMethodField()
    ciudad = serializers.SerializerMethodField()
    amistad_estado = serializers.SerializerMethodField()
    solicitud_amistad_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "tipo_usuario",
            "nombre_mostrar",
            "ocupacion",
            "ciudad",
            "amistad_estado",
            "solicitud_amistad_id",
        ]

    def get_nombre_mostrar(self, obj):
        if hasattr(obj, "persona_profile"):
            return f"{obj.persona_profile.nombres} {obj.persona_profile.apellidos}".strip()
        if hasattr(obj, "entidad"):
            return obj.entidad.nombre_comercial
        return obj.username

    def get_ocupacion(self, obj):
        if hasattr(obj, "persona_profile"):
            return obj.persona_profile.ocupacion
        return ""

    def get_ciudad(self, obj):
        if hasattr(obj, "persona_profile"):
            return obj.persona_profile.ciudad
        return ""

    def _get_friend_request(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        user = request.user
        return FriendRequest.objects.filter(
            Q(sender=user, receiver=obj) | Q(sender=obj, receiver=user)
        ).order_by("-id").first()

    def get_amistad_estado(self, obj):
        fr = self._get_friend_request(obj)
        if not fr:
            return "ninguna"
        request = self.context.get("request")
        if fr.estado == "aceptada":
            return "amigos"
        if fr.estado == "rechazada":
            return "rechazada"
        if fr.sender_id == request.user.id:
            return "solicitud_enviada"
        return "solicitud_recibida"

    def get_solicitud_amistad_id(self, obj):
        fr = self._get_friend_request(obj)
        return fr.id if fr else None


class FriendRequestSerializer(serializers.ModelSerializer):
    sender = UserPublicSerializer(read_only=True)
    receiver = UserPublicSerializer(read_only=True)
    receiver_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = FriendRequest
        fields = [
            "id",
            "sender",
            "receiver",
            "receiver_id",
            "estado",
            "created_at",
            "responded_at",
        ]
        read_only_fields = ["estado", "created_at", "responded_at"]

    def validate(self, data):
        request = self.context["request"]
        receiver_id = data.get("receiver_id")
        if not receiver_id:
            raise serializers.ValidationError("receiver_id es requerido")
        if receiver_id == request.user.id:
            raise serializers.ValidationError("No puedes enviarte solicitud a ti mismo.")

        receiver = User.objects.filter(id=receiver_id, is_active=True).first()
        if not receiver:
            raise serializers.ValidationError("Usuario destino no existe.")

        if FriendRequest.objects.filter(sender=request.user, receiver=receiver).exists():
            raise serializers.ValidationError("Ya enviaste una solicitud a este usuario.")

        if FriendRequest.objects.filter(sender=receiver, receiver=request.user, estado="pendiente").exists():
            raise serializers.ValidationError("Este usuario ya te envió una solicitud pendiente.")

        data["receiver"] = receiver
        return data

    def create(self, validated_data):
        receiver = validated_data["receiver"]
        return FriendRequest.objects.create(
            sender=self.context["request"].user,
            receiver=receiver,
            estado="pendiente",
        )


class PersonaProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = PersonaProfile
        exclude = ["user"]

    def create(self, validated_data):
        user = self.context["request"].user

        if user.tipo_usuario != "persona":
            raise serializers.ValidationError("Solo personas pueden crear perfil.")

        if hasattr(user, "persona_profile"):
            raise serializers.ValidationError("Perfil ya existe.")

        return PersonaProfile.objects.create(user=user, **validated_data)


class PersonaPhotoSerializer(serializers.ModelSerializer):

    class Meta:
        model = PersonaPhoto
        fields = "__all__"
        read_only_fields = ["persona"]

    def validate(self, data):
        persona = self.context["request"].user.persona_profile

        if data.get("es_principal", False):
            total_principales = persona.fotos.filter(es_principal=True).count()
            if total_principales >= 5:
                raise serializers.ValidationError(
                    "Solo puedes tener máximo 5 fotos principales."
                )

        return data

    def create(self, validated_data):
        persona = self.context["request"].user.persona_profile
        return PersonaPhoto.objects.create(persona=persona, **validated_data)