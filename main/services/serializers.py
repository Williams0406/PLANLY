from django.db.models import Sum
from rest_framework import serializers

from .models import (
    Entidad,
    ResenaEntidad,
    ResenaServicio,
    Servicio,
    ServicioCategoria,
    ServicioHorario,
)


class ServicioCategoriaSerializer(serializers.ModelSerializer):
    servicios_count = serializers.SerializerMethodField()
    visualizaciones_count = serializers.SerializerMethodField()

    class Meta:
        model = ServicioCategoria
        fields = [
            "id",
            "nombre",
            "slug",
            "descripcion",
            "activo",
            "orden",
            "created_at",
            "servicios_count",
            "visualizaciones_count",
        ]
        read_only_fields = ["slug", "created_at", "servicios_count", "visualizaciones_count"]

    def validate_nombre(self, value):
        queryset = ServicioCategoria.objects.filter(nombre__iexact=value.strip())
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("Ya existe una categoria con ese nombre.")
        return value.strip()

    def get_servicios_count(self, obj):
        annotated = getattr(obj, "servicios_count", None)
        if annotated is not None:
            return annotated
        return Servicio.objects.filter(categoria=obj.nombre).count()

    def get_visualizaciones_count(self, obj):
        annotated = getattr(obj, "visualizaciones_count", None)
        if annotated is not None:
            return annotated
        total = Servicio.objects.filter(categoria=obj.nombre).aggregate(total=Sum("total_visualizaciones"))["total"]
        return total or 0


class ResenaEntidadSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source="usuario.username", read_only=True)

    class Meta:
        model = ResenaEntidad
        fields = ["id", "entidad", "usuario", "usuario_nombre", "puntaje", "comentario", "created_at"]
        read_only_fields = ["usuario", "created_at"]

    def validate_puntaje(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("El puntaje debe estar entre 1 y 5.")
        return value

    def create(self, validated_data):
        validated_data["usuario"] = self.context["request"].user
        return super().create(validated_data)


class ResenaServicioSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source="usuario.username", read_only=True)

    class Meta:
        model = ResenaServicio
        fields = ["id", "servicio", "usuario", "usuario_nombre", "puntaje", "comentario", "created_at"]
        read_only_fields = ["usuario", "created_at"]

    def validate_puntaje(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("El puntaje debe estar entre 1 y 5.")
        return value

    def create(self, validated_data):
        validated_data["usuario"] = self.context["request"].user
        return super().create(validated_data)


class EntidadSerializer(serializers.ModelSerializer):
    promedio_resenas = serializers.SerializerMethodField()
    total_resenas = serializers.SerializerMethodField()

    class Meta:
        model = Entidad
        exclude = ["user", "aprobado"]

    def get_promedio_resenas(self, obj):
        return obj.promedio_resenas()

    def get_total_resenas(self, obj):
        return obj.resenas.count()

    def create(self, validated_data):
        user = self.context["request"].user
        if user.tipo_usuario != "entidad":
            raise serializers.ValidationError("Solo usuarios tipo entidad pueden crear perfil empresarial.")
        if hasattr(user, "entidad"):
            raise serializers.ValidationError("Este usuario ya tiene una entidad registrada.")
        return Entidad.objects.create(user=user, **validated_data)


class EntidadAdminSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)
    telefono = serializers.CharField(source="user.telefono", read_only=True)
    entidad_aprobada = serializers.BooleanField(source="aprobado", read_only=True)
    date_joined = serializers.DateTimeField(source="user.date_joined", read_only=True)
    servicios_activos = serializers.SerializerMethodField()
    visualizaciones_totales = serializers.SerializerMethodField()

    class Meta:
        model = Entidad
        fields = [
            "id",
            "user_id",
            "username",
            "email",
            "telefono",
            "nombre_comercial",
            "ruc",
            "direccion",
            "contacto_referencia",
            "entidad_aprobada",
            "aprobado",
            "date_joined",
            "servicios_activos",
            "visualizaciones_totales",
        ]

    def get_servicios_activos(self, obj):
        annotated = getattr(obj, "servicios_activos", None)
        if annotated is not None:
            return annotated
        return obj.servicios.filter(activo=True).count()

    def get_visualizaciones_totales(self, obj):
        annotated = getattr(obj, "visualizaciones_totales", None)
        if annotated is not None:
            return annotated
        total = obj.servicios.aggregate(total=Sum("total_visualizaciones"))["total"]
        return total or 0


class ServicioHorarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServicioHorario
        fields = ["id", "fecha_inicio", "fecha_fin"]
        read_only_fields = ["id"]

    def validate(self, data):
        if data["fecha_inicio"] >= data["fecha_fin"]:
            raise serializers.ValidationError("La fecha de inicio debe ser menor a la fecha de fin.")
        return data


class ServicioSerializer(serializers.ModelSerializer):
    precio_actual = serializers.SerializerMethodField(read_only=True)
    promedio_resenas = serializers.SerializerMethodField()
    total_resenas = serializers.SerializerMethodField()
    horarios = ServicioHorarioSerializer(many=True, required=False)
    horario_resumen = serializers.SerializerMethodField()
    modalidad_pago_label = serializers.CharField(source="get_modalidad_pago_display", read_only=True)
    forma_pago_resumen = serializers.SerializerMethodField()

    class Meta:
        model = Servicio
        fields = "__all__"
        read_only_fields = ["entidad", "created_at", "total_visualizaciones"]

    def get_precio_actual(self, obj):
        return obj.precio_actual()

    def get_promedio_resenas(self, obj):
        return obj.promedio_resenas()

    def get_total_resenas(self, obj):
        return obj.resenas.count()

    def get_horario_resumen(self, obj):
        primer_horario = obj.horarios.order_by("fecha_inicio").first()
        if primer_horario:
            return {
                "fecha_inicio": primer_horario.fecha_inicio,
                "fecha_fin": primer_horario.fecha_fin,
                "total_horarios": obj.horarios.count(),
            }
        if obj.hora_inicio and obj.hora_fin:
            return {
                "hora_inicio": obj.hora_inicio,
                "hora_fin": obj.hora_fin,
                "total_horarios": 0,
            }
        return None

    def get_forma_pago_resumen(self, obj):
        return obj.resumen_forma_pago()

    def _validar_horarios(self, horarios):
        horarios_ordenados = sorted(horarios, key=lambda item: item["fecha_inicio"])
        for indice, horario in enumerate(horarios_ordenados):
            if horario["fecha_inicio"] >= horario["fecha_fin"]:
                raise serializers.ValidationError(
                    {"horarios": f"El horario #{indice + 1} tiene una fecha_inicio mayor o igual a fecha_fin."}
                )
            if indice > 0 and horario["fecha_inicio"] < horarios_ordenados[indice - 1]["fecha_fin"]:
                raise serializers.ValidationError(
                    {"horarios": "Los horarios no deben superponerse entre si."}
                )
        return horarios_ordenados

    def _sincronizar_horas_referencia(self, validated_data, horarios):
        if horarios:
            primer_horario = horarios[0]
            validated_data["hora_inicio"] = primer_horario["fecha_inicio"].timetz().replace(tzinfo=None)
            validated_data["hora_fin"] = primer_horario["fecha_fin"].timetz().replace(tzinfo=None)
            return

        hora_inicio = validated_data.get("hora_inicio", getattr(self.instance, "hora_inicio", None))
        hora_fin = validated_data.get("hora_fin", getattr(self.instance, "hora_fin", None))
        if (hora_inicio and not hora_fin) or (hora_fin and not hora_inicio):
            raise serializers.ValidationError("Debe especificar hora de inicio y fin.")
        if hora_inicio and hora_fin and hora_inicio >= hora_fin:
            raise serializers.ValidationError("La hora de inicio debe ser menor a la hora de fin.")

    def _parse_percentage(self, value):
        if value in (None, ""):
            return None
        return float(value)

    def _validar_categoria(self, data):
        should_validate = self.instance is None or "categoria" in data
        if not should_validate:
            return

        categoria = (data.get("categoria") or "").strip()
        if not categoria:
            raise serializers.ValidationError({"categoria": "Selecciona una categoria valida."})

        categoria_obj = ServicioCategoria.objects.filter(nombre__iexact=categoria, activo=True).first()
        if not categoria_obj:
            raise serializers.ValidationError({"categoria": "La categoria seleccionada no esta disponible."})

        data["categoria"] = categoria_obj.nombre

    def _validar_forma_pago(self, data):
        modalidad_pago = data.get(
            "modalidad_pago",
            getattr(self.instance, "modalidad_pago", Servicio.MODALIDAD_PAGO_COMPLETO),
        )
        porcentaje_reserva = self._parse_percentage(
            data.get("porcentaje_reserva", getattr(self.instance, "porcentaje_reserva", None))
        )
        porcentaje_pago_previo = self._parse_percentage(
            data.get("porcentaje_pago_previo", getattr(self.instance, "porcentaje_pago_previo", None))
        )
        dias_antes_pago_previo = data.get(
            "dias_antes_pago_previo",
            getattr(self.instance, "dias_antes_pago_previo", None),
        )
        descripcion_forma_pago = (
            data.get("descripcion_forma_pago", getattr(self.instance, "descripcion_forma_pago", "")) or ""
        ).strip()

        errors = {}
        porcentajes = {
            "porcentaje_reserva": porcentaje_reserva,
            "porcentaje_pago_previo": porcentaje_pago_previo,
        }
        for field, value in porcentajes.items():
            if value is not None and (value <= 0 or value > 100):
                errors[field] = "Debe ser un porcentaje mayor a 0 y menor o igual a 100."

        if dias_antes_pago_previo is not None and int(dias_antes_pago_previo) < 0:
            errors["dias_antes_pago_previo"] = "No puede ser negativo."

        if modalidad_pago == Servicio.MODALIDAD_PAGO_RESERVA:
            if porcentaje_reserva is None:
                errors["porcentaje_reserva"] = "Indica el porcentaje de reserva."
            elif porcentaje_reserva >= 100:
                errors["porcentaje_reserva"] = "La reserva debe ser menor a 100%."
            data["porcentaje_pago_previo"] = None
            data["dias_antes_pago_previo"] = None
        elif modalidad_pago == Servicio.MODALIDAD_PAGO_COMPLETO:
            data["porcentaje_reserva"] = None
            data["porcentaje_pago_previo"] = None
            data["dias_antes_pago_previo"] = None
        elif modalidad_pago == Servicio.MODALIDAD_PAGO_CONTRAENTREGA:
            data["porcentaje_reserva"] = None
            data["porcentaje_pago_previo"] = None
            data["dias_antes_pago_previo"] = None
        elif modalidad_pago == Servicio.MODALIDAD_PAGO_RESERVA_PREVIO_SALDO:
            if porcentaje_reserva is None:
                errors["porcentaje_reserva"] = "Indica el adelanto de reserva."
            if porcentaje_pago_previo is None:
                errors["porcentaje_pago_previo"] = "Indica el pago previo."
            if dias_antes_pago_previo in (None, ""):
                errors["dias_antes_pago_previo"] = "Indica cuantos dias antes se cobra el pago previo."
            if porcentaje_reserva is not None and porcentaje_pago_previo is not None:
                total = porcentaje_reserva + porcentaje_pago_previo
                if total >= 100:
                    errors["porcentaje_pago_previo"] = "La suma debe ser menor a 100% para dejar saldo final."
        elif modalidad_pago == Servicio.MODALIDAD_PAGO_RESERVA_TOTAL_PREVIO:
            if porcentaje_reserva is None:
                errors["porcentaje_reserva"] = "Indica el adelanto de reserva."
            if porcentaje_pago_previo is None:
                errors["porcentaje_pago_previo"] = "Indica el pago restante antes del servicio."
            if dias_antes_pago_previo in (None, ""):
                errors["dias_antes_pago_previo"] = "Indica cuantos dias antes se completa el pago."
            if porcentaje_reserva is not None and porcentaje_pago_previo is not None:
                total = round(porcentaje_reserva + porcentaje_pago_previo, 2)
                if total != 100:
                    errors["porcentaje_pago_previo"] = "La reserva y el pago previo deben sumar 100%."
        elif modalidad_pago == Servicio.MODALIDAD_PAGO_OTRA:
            if not descripcion_forma_pago:
                errors["descripcion_forma_pago"] = "Describe la forma de pago personalizada."

        if errors:
            raise serializers.ValidationError(errors)

        data["descripcion_forma_pago"] = descripcion_forma_pago

    def validate(self, data):
        self._validar_categoria(data)

        tiene_promocion = data.get("tiene_promocion", getattr(self.instance, "tiene_promocion", False))
        costo_promocional = data.get("costo_promocional", getattr(self.instance, "costo_promocional", None))
        costo_regular = data.get("costo_regular", getattr(self.instance, "costo_regular", None))
        if tiene_promocion:
            if not costo_promocional:
                raise serializers.ValidationError("Debe especificar costo promocional.")
            if costo_promocional >= costo_regular:
                raise serializers.ValidationError("El costo promocional debe ser menor al regular.")

        horarios = data.get("horarios", serializers.empty)
        if horarios is not serializers.empty:
            if not horarios:
                raise serializers.ValidationError({"horarios": "Debe agregar al menos un horario o enviar horas simples."})
            horarios = self._validar_horarios(horarios)

        self._sincronizar_horas_referencia(data, horarios if horarios is not serializers.empty else None)
        self._validar_forma_pago(data)
        return data

    def create(self, validated_data):
        horarios_data = validated_data.pop("horarios", [])
        user = self.context["request"].user
        if user.tipo_usuario != "entidad":
            raise serializers.ValidationError("Solo entidades pueden crear servicios.")
        if not hasattr(user, "entidad"):
            raise serializers.ValidationError("Debe crear primero su perfil de entidad.")
        if not user.entidad.aprobado:
            raise serializers.ValidationError("La entidad debe estar aprobada para publicar servicios.")
        servicio = Servicio.objects.create(entidad=user.entidad, **validated_data)
        if horarios_data:
            ServicioHorario.objects.bulk_create(
                [ServicioHorario(servicio=servicio, **horario) for horario in horarios_data]
            )
        return servicio

    def update(self, instance, validated_data):
        horarios_data = validated_data.pop("horarios", serializers.empty)
        instance = super().update(instance, validated_data)
        if horarios_data is not serializers.empty:
            instance.horarios.all().delete()
            ServicioHorario.objects.bulk_create(
                [ServicioHorario(servicio=instance, **horario) for horario in horarios_data]
            )
        return instance


class ServicioPublicoSerializer(serializers.ModelSerializer):
    entidad_nombre = serializers.CharField(source="entidad.nombre_comercial", read_only=True)
    entidad_direccion = serializers.CharField(source="entidad.direccion", read_only=True)
    entidad_contacto = serializers.CharField(source="entidad.contacto_referencia", read_only=True)
    entidad_imagenes = serializers.ListField(
        source="entidad.imagenes_promocionales",
        child=serializers.CharField(),
        read_only=True,
    )
    entidad_imagen_principal = serializers.SerializerMethodField()
    precio_actual = serializers.SerializerMethodField()
    promedio_resenas = serializers.SerializerMethodField()
    total_resenas = serializers.SerializerMethodField()
    horarios = ServicioHorarioSerializer(many=True, read_only=True)
    horario_resumen = serializers.SerializerMethodField()
    modalidad_pago_label = serializers.CharField(source="get_modalidad_pago_display", read_only=True)
    forma_pago_resumen = serializers.SerializerMethodField()

    class Meta:
        model = Servicio
        fields = [
            "id",
            "entidad",
            "categoria",
            "nombre",
            "descripcion",
            "lugar",
            "hora_inicio",
            "hora_fin",
            "capacidad_maxima",
            "precio_actual",
            "promedio_resenas",
            "total_resenas",
            "horarios",
            "horario_resumen",
            "modalidad_pago",
            "modalidad_pago_label",
            "porcentaje_reserva",
            "porcentaje_pago_previo",
            "dias_antes_pago_previo",
            "descripcion_forma_pago",
            "forma_pago_resumen",
            "entidad_nombre",
            "entidad_direccion",
            "entidad_contacto",
            "entidad_imagenes",
            "entidad_imagen_principal",
            "imagen_principal",
            "imagenes",
        ]

    def get_precio_actual(self, obj):
        return obj.precio_actual()

    def get_promedio_resenas(self, obj):
        return obj.promedio_resenas()

    def get_total_resenas(self, obj):
        return obj.resenas.count()

    def get_entidad_imagen_principal(self, obj):
        imagenes = obj.entidad.imagenes_promocionales or []
        return imagenes[0] if imagenes else None

    def get_horario_resumen(self, obj):
        return ServicioSerializer(context=self.context).get_horario_resumen(obj)

    def get_forma_pago_resumen(self, obj):
        return obj.resumen_forma_pago()


class ServicioDetalleSerializer(serializers.ModelSerializer):
    entidad_nombre = serializers.CharField(source="entidad.nombre_comercial", read_only=True)
    entidad_direccion = serializers.CharField(source="entidad.direccion", read_only=True)
    entidad_contacto_referencia = serializers.CharField(source="entidad.contacto_referencia", read_only=True)
    entidad_imagenes_promocionales = serializers.ListField(
        source="entidad.imagenes_promocionales",
        child=serializers.CharField(),
        read_only=True,
    )
    entidad_promedio_resenas = serializers.SerializerMethodField()
    entidad_total_resenas = serializers.SerializerMethodField()
    precio_actual = serializers.SerializerMethodField()
    descuento_porcentaje = serializers.SerializerMethodField()
    promedio_resenas = serializers.SerializerMethodField()
    total_resenas = serializers.SerializerMethodField()
    horarios = ServicioHorarioSerializer(many=True, read_only=True)
    horario_resumen = serializers.SerializerMethodField()
    modalidad_pago_label = serializers.CharField(source="get_modalidad_pago_display", read_only=True)
    forma_pago_resumen = serializers.SerializerMethodField()
    resenas = ResenaServicioSerializer(many=True, read_only=True)
    resenas_entidad = ResenaEntidadSerializer(source="entidad.resenas", many=True, read_only=True)

    class Meta:
        model = Servicio
        fields = [
            "id",
            "entidad",
            "categoria",
            "nombre",
            "descripcion",
            "lugar",
            "hora_inicio",
            "hora_fin",
            "capacidad_maxima",
            "costo_regular",
            "tiene_promocion",
            "costo_promocional",
            "precio_actual",
            "descuento_porcentaje",
            "promedio_resenas",
            "total_resenas",
            "horarios",
            "horario_resumen",
            "modalidad_pago",
            "modalidad_pago_label",
            "porcentaje_reserva",
            "porcentaje_pago_previo",
            "dias_antes_pago_previo",
            "descripcion_forma_pago",
            "forma_pago_resumen",
            "entidad_nombre",
            "entidad_direccion",
            "entidad_contacto_referencia",
            "entidad_imagenes_promocionales",
            "entidad_promedio_resenas",
            "entidad_total_resenas",
            "imagen_principal",
            "imagenes",
            "resenas",
            "resenas_entidad",
            "activo",
            "created_at",
            "total_visualizaciones",
        ]

    def get_precio_actual(self, obj):
        return obj.precio_actual()

    def get_descuento_porcentaje(self, obj):
        if obj.tiene_promocion and obj.costo_promocional:
            return round(((obj.costo_regular - obj.costo_promocional) / obj.costo_regular) * 100, 1)
        return 0

    def get_promedio_resenas(self, obj):
        return obj.promedio_resenas()

    def get_total_resenas(self, obj):
        return obj.resenas.count()

    def get_entidad_promedio_resenas(self, obj):
        return obj.entidad.promedio_resenas()

    def get_entidad_total_resenas(self, obj):
        return obj.entidad.resenas.count()

    def get_horario_resumen(self, obj):
        return ServicioSerializer(context=self.context).get_horario_resumen(obj)

    def get_forma_pago_resumen(self, obj):
        return obj.resumen_forma_pago()


class ServicioResumenSerializer(serializers.ModelSerializer):
    precio_actual = serializers.SerializerMethodField()
    promedio_resenas = serializers.SerializerMethodField()

    class Meta:
        model = Servicio
        fields = [
            "id",
            "categoria",
            "nombre",
            "descripcion",
            "lugar",
            "hora_inicio",
            "hora_fin",
            "precio_actual",
            "promedio_resenas",
            "imagen_principal",
            "imagenes",
        ]

    def get_precio_actual(self, obj):
        return obj.precio_actual()

    def get_promedio_resenas(self, obj):
        return obj.promedio_resenas()


class EntidadPublicaDetalleSerializer(serializers.ModelSerializer):
    promedio_resenas = serializers.SerializerMethodField()
    total_resenas = serializers.SerializerMethodField()
    servicios = serializers.SerializerMethodField()
    resenas = ResenaEntidadSerializer(many=True, read_only=True)

    class Meta:
        model = Entidad
        fields = [
            "id",
            "nombre_comercial",
            "ruc",
            "direccion",
            "contacto_referencia",
            "imagenes_promocionales",
            "promedio_resenas",
            "total_resenas",
            "servicios",
            "resenas",
        ]

    def get_promedio_resenas(self, obj):
        return obj.promedio_resenas()

    def get_total_resenas(self, obj):
        return obj.resenas.count()

    def get_servicios(self, obj):
        servicios = obj.servicios.filter(activo=True).order_by("categoria", "nombre")
        return ServicioResumenSerializer(servicios, many=True, context=self.context).data
