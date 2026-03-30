from django.db.models import Q
from rest_framework import serializers
from .models import User, PersonaProfile, PersonaPhoto, FriendRequest, ensure_persona_profile


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
        ensure_persona_profile(user)
        return user


class UserPublicSerializer(serializers.ModelSerializer):
    nombre_mostrar = serializers.SerializerMethodField()
    ocupacion = serializers.SerializerMethodField()
    ciudad = serializers.SerializerMethodField()
    amistad_estado = serializers.SerializerMethodField()
    solicitud_amistad_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "tipo_usuario", "nombre_mostrar", "ocupacion", "ciudad", "amistad_estado", "solicitud_amistad_id"]

    def get_nombre_mostrar(self, obj):
        if hasattr(obj, "persona_profile"):
            return f"{obj.persona_profile.nombres} {obj.persona_profile.apellidos}".strip()
        if hasattr(obj, "entidad"):
            return obj.entidad.nombre_comercial
        return obj.username

    def get_ocupacion(self, obj):
        return obj.persona_profile.ocupacion if hasattr(obj, "persona_profile") else ""

    def get_ciudad(self, obj):
        return obj.persona_profile.ciudad if hasattr(obj, "persona_profile") else ""

    def _get_friend_request(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        return FriendRequest.objects.filter(Q(sender=request.user, receiver=obj) | Q(sender=obj, receiver=request.user)).order_by("-id").first()

    def get_amistad_estado(self, obj):
        fr = self._get_friend_request(obj)
        if not fr:
            return "ninguna"
        request = self.context.get("request")
        if fr.estado == "aceptada":
            return "amigos"
        if fr.estado == "rechazada":
            return "rechazada"
        return "solicitud_enviada" if fr.sender_id == request.user.id else "solicitud_recibida"

    def get_solicitud_amistad_id(self, obj):
        fr = self._get_friend_request(obj)
        return fr.id if fr else None


class PersonaPhotoPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = PersonaPhoto
        fields = ["id", "imagen", "es_principal", "orden"]


class UserPublicProfileSerializer(serializers.ModelSerializer):
    nombre_mostrar = serializers.SerializerMethodField()
    ocupacion = serializers.SerializerMethodField()
    ciudad = serializers.SerializerMethodField()
    nacionalidad = serializers.SerializerMethodField()
    descripcion = serializers.SerializerMethodField()
    hobbies = serializers.SerializerMethodField()
    fotos = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "tipo_usuario", "nombre_mostrar", "ocupacion", "ciudad", "nacionalidad", "descripcion", "hobbies", "fotos"]

    def get_nombre_mostrar(self, obj):
        if hasattr(obj, "persona_profile"):
            return f"{obj.persona_profile.nombres} {obj.persona_profile.apellidos}".strip()
        return obj.username

    def get_ocupacion(self, obj):
        return obj.persona_profile.ocupacion if hasattr(obj, "persona_profile") else ""

    def get_ciudad(self, obj):
        return obj.persona_profile.ciudad if hasattr(obj, "persona_profile") else ""

    def get_nacionalidad(self, obj):
        return obj.persona_profile.nacionalidad if hasattr(obj, "persona_profile") else ""

    def get_descripcion(self, obj):
        return obj.persona_profile.descripcion if hasattr(obj, "persona_profile") else ""

    def get_hobbies(self, obj):
        return obj.persona_profile.hobbies if hasattr(obj, "persona_profile") else ""

    def get_fotos(self, obj):
        if not hasattr(obj, "persona_profile"):
            return []
        fotos = obj.persona_profile.fotos.filter(visible=True).order_by("orden", "id")
        return PersonaPhotoPublicSerializer(fotos, many=True, context=self.context).data


class FriendRequestSerializer(serializers.ModelSerializer):
    sender = UserPublicSerializer(read_only=True)
    receiver = UserPublicSerializer(read_only=True)
    receiver_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = FriendRequest
        fields = ["id", "sender", "receiver", "receiver_id", "estado", "created_at", "responded_at"]
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
        return FriendRequest.objects.create(sender=self.context["request"].user, receiver=validated_data["receiver"], estado="pendiente")


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

    def _get_persona_or_raise(self):
        user = self.context["request"].user
        try:
            return user.persona_profile
        except PersonaProfile.DoesNotExist:
            raise serializers.ValidationError({"detail": "Debes completar tu perfil de persona antes de subir fotos."})

    def validate(self, data):
        self._get_persona_or_raise()
        return data

    def create(self, validated_data):
        persona = self._get_persona_or_raise()
        if validated_data.get("es_principal", False):
            persona.fotos.filter(es_principal=True).delete()
        return PersonaPhoto.objects.create(persona=persona, **validated_data)

    def update(self, instance, validated_data):
        persona = self._get_persona_or_raise()
        if validated_data.get("es_principal", False):
            persona.fotos.filter(es_principal=True).exclude(id=instance.id).delete()
        return super().update(instance, validated_data)
