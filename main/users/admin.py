from django.contrib import admin
from .models import User, PersonaProfile, PersonaPhoto


admin.site.register(User)
admin.site.register(PersonaProfile)
admin.site.register(PersonaPhoto)
