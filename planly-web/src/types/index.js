/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {'persona'|'entidad'} tipo_usuario
 * @property {boolean} has_entidad_profile
 * @property {boolean} entidad_aprobada
 * @property {number|null} entidad_id
 */

/**
 * @typedef {Object} Servicio
 * @property {number} id
 * @property {string} nombre
 * @property {string} descripcion
 * @property {string} lugar
 * @property {string} hora_inicio
 * @property {string} hora_fin
 * @property {number} capacidad_maxima
 * @property {number} costo_regular
 * @property {boolean} tiene_promocion
 * @property {number|null} costo_promocional
 * @property {number} precio_actual
 * @property {number} descuento_porcentaje
 * @property {string} entidad_nombre
 * @property {boolean} activo
 */

export {};