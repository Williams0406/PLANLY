import io
from pathlib import Path
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import PersonaProfile, PersonaPhoto


User = get_user_model()
TEST_MEDIA_ROOT = Path(__file__).resolve().parent.parent / "test_media"


@override_settings(MEDIA_ROOT=TEST_MEDIA_ROOT)
class PersonaPhotoUploadTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="persona_fotos",
            password="pass1234",
            tipo_usuario="persona",
        )
        self.profile = PersonaProfile.objects.create(
            user=self.user,
            tipo_documento="dni",
            numero_documento="12345678",
            nombres="Persona",
            apellidos="Fotos",
            fecha_nacimiento="1998-01-10",
            ocupacion="Tester",
            descripcion="Probando uploads",
            hobbies="Viajes",
            nacionalidad="Peruana",
            ciudad="Lima",
        )
        self.client.force_authenticate(self.user)

    def make_image(self, name="foto:perfil?.jpg"):
        buffer = io.BytesIO()
        Image.new("RGB", (32, 32), color="blue").save(buffer, format="JPEG")
        buffer.seek(0)
        buffer.name = name
        return buffer

    def test_upload_foto_sanitiza_nombre_y_devuelve_json(self):
        response = self.client.post(
            reverse("fotos-list"),
            {
                "imagen": self.make_image(),
                "es_principal": "true",
                "visible": "true",
                "orden": "1",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("imagen", response.data)
        self.assertEqual(PersonaPhoto.objects.count(), 1)
        saved_name = PersonaPhoto.objects.get().imagen.name
        self.assertTrue(saved_name.startswith("perfiles/"))
        self.assertNotIn(":", saved_name)
        self.assertTrue(saved_name.endswith(".jpg"))

    def test_upload_foto_error_interno_responde_json_controlado(self):
        with patch("users.serializers.PersonaPhotoSerializer.create", side_effect=OSError("disk error")):
            response = self.client.post(
                reverse("fotos-list"),
                {
                    "imagen": self.make_image("foto.jpg"),
                    "es_principal": "true",
                    "visible": "true",
                    "orden": "1",
                },
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertEqual(response.data["detail"], "No se pudo guardar la imagen. Intenta con otra foto o formato.")

    def test_upload_foto_sin_perfil_persona_responde_400(self):
        other_user = User.objects.create_user(
            username="sin_perfil_persona",
            password="pass1234",
            tipo_usuario="persona",
        )
        self.client.force_authenticate(other_user)

        response = self.client.post(
            reverse("fotos-list"),
            {
                "imagen": self.make_image("foto.jpg"),
                "es_principal": "true",
                "visible": "true",
                "orden": "1",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"][0], "Debes completar tu perfil de persona antes de subir fotos.")


class PersonaRegistrationTests(APITestCase):
    def test_registro_api_persona_crea_persona_profile_automaticamente(self):
        response = self.client.post(
            reverse("register-list"),
            {
                "username": "persona_auto_api",
                "email": "persona_auto_api@test.com",
                "password": "pass1234",
                "tipo_usuario": "persona",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="persona_auto_api")
        self.assertTrue(hasattr(user, "persona_profile"))
        self.assertEqual(user.persona_profile.nombres, "persona_auto_api")
        self.assertEqual(user.persona_profile.numero_documento, f"AUTO-{user.id}")

    def test_registro_web_persona_crea_persona_profile_automaticamente(self):
        response = self.client.post(
            reverse("web-register"),
            {
                "username": "persona_auto_web",
                "email": "persona_auto_web@test.com",
                "password": "pass1234",
                "password2": "pass1234",
                "tipo_usuario": "persona",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="persona_auto_web")
        self.assertTrue(hasattr(user, "persona_profile"))
        self.assertEqual(user.persona_profile.nacionalidad, "Peruana")
        self.assertEqual(user.persona_profile.ciudad, "Lima")


class UserPublicListTests(APITestCase):
    def setUp(self):
        self.current_user = User.objects.create_user(
            username="current_persona",
            password="pass1234",
            tipo_usuario="persona",
        )
        self.persona_user = User.objects.create_user(
            username="persona_visible",
            password="pass1234",
            tipo_usuario="persona",
        )
        self.entidad_user = User.objects.create_user(
            username="entidad_visible",
            password="pass1234",
            tipo_usuario="entidad",
        )
        self.client.force_authenticate(self.current_user)

    def test_lista_usuarios_filtra_por_tipo_usuario(self):
        response = self.client.get(
            reverse("usuarios-list"),
            {"tipo_usuario": "persona"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.data["results"] if isinstance(response.data, dict) else response.data
        usernames = [item["username"] for item in payload]

        self.assertIn("persona_visible", usernames)
        self.assertNotIn("entidad_visible", usernames)
        self.assertNotIn("current_persona", usernames)
