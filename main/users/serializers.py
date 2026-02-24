# users/serializers.py
from rest_framework import serializers
from .models import User, PersonaProfile, PersonaPhoto

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

