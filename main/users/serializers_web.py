from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, PersonaProfile, PersonaPhoto, ensure_persona_profile


class UserMeSerializer(serializers.ModelSerializer):
    """Retorna info completa del usuario autenticado"""
    has_persona_profile = serializers.SerializerMethodField()
    has_entidad_profile = serializers.SerializerMethodField()
    entidad_aprobada = serializers.SerializerMethodField()
    entidad_id = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'tipo_usuario',
            'has_persona_profile', 'has_entidad_profile',
            'entidad_aprobada', 'entidad_id',
            'is_staff', 'is_superuser', 'is_admin',
        ]

    def get_has_persona_profile(self, obj):
        return hasattr(obj, 'persona_profile')

    def get_has_entidad_profile(self, obj):
        return hasattr(obj, 'entidad')

    def get_entidad_aprobada(self, obj):
        if hasattr(obj, 'entidad'):
            return obj.entidad.aprobado
        return False

    def get_entidad_id(self, obj):
        if hasattr(obj, 'entidad'):
            return obj.entidad.id
        return None

    def get_is_admin(self, obj):
        return bool(obj.is_staff or obj.is_superuser)


class RegisterWebSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'tipo_usuario']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError(
                {"password2": "Las contraseñas no coinciden."}
            )
        if data['tipo_usuario'] not in ['persona', 'entidad']:
            raise serializers.ValidationError(
                {"tipo_usuario": "Tipo de usuario inválido."}
            )
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        ensure_persona_profile(user)
        return user
