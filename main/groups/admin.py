from django.contrib import admin
from .models import Grupo, MiembroGrupo, PlanGrupal, ParticipacionPlan

admin.site.register(Grupo)
admin.site.register(MiembroGrupo)
admin.site.register(PlanGrupal)
admin.site.register(ParticipacionPlan)
