export function getAuthenticatedHome(user) {
  if (!user) {
    return '/login';
  }

  if (user.is_admin || user.is_staff || user.is_superuser) {
    return '/admin';
  }

  if (user.tipo_usuario === 'entidad') {
    if (!user.has_entidad_profile) {
      return '/entidad/setup';
    }

    if (!user.entidad_aprobada) {
      return '/entidad/pendiente';
    }

    return '/dashboard';
  }

  return '/servicios';
}
