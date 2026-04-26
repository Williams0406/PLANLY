/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {'persona'|'entidad'} tipo_usuario
 * @property {boolean} has_entidad_profile
 * @property {boolean} entidad_aprobada
 * @property {number|null} entidad_id
 * @property {boolean} is_staff
 * @property {boolean} is_superuser
 * @property {boolean} is_admin
 */

/**
 * @typedef {Object} ServicioHorario
 * @property {number} id
 * @property {string} fecha_inicio
 * @property {string} fecha_fin
 */

/**
 * @typedef {Object} Servicio
 * @property {number} id
 * @property {string} nombre
 * @property {string} descripcion
 * @property {string} lugar
 * @property {string} hora_inicio
 * @property {string} hora_fin
 * @property {ServicioHorario[]} horarios
 * @property {number} capacidad_maxima
 * @property {number} costo_regular
 * @property {boolean} tiene_promocion
 * @property {number|null} costo_promocional
 * @property {'reserva'|'pago_completo'|'contraentrega'|'reserva_previo_saldo'|'reserva_total_previo'|'otra'} modalidad_pago
 * @property {string} modalidad_pago_label
 * @property {number|null} porcentaje_reserva
 * @property {number|null} porcentaje_pago_previo
 * @property {number|null} dias_antes_pago_previo
 * @property {string} descripcion_forma_pago
 * @property {string} forma_pago_resumen
 * @property {number} precio_actual
 * @property {number} descuento_porcentaje
 * @property {string} entidad_nombre
 * @property {boolean} activo
 */

export {};
