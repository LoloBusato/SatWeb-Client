// Helpers para leer los campos de fecha que vienen del backend durante el
// Paso 2 del cierre de Fase 3 (ver memoria project_rewrite_plan.md).
//
// Contexto:
//   - Backend legacy hasta hoy devuelve dates como VARCHAR en formato
//     "d/m/yyyy" (o "d/m/yyyy H:M:S" para messages/reducestock).
//   - Fase 3.4 agregó columnas DATETIME espejo con sufijo "_dt" que el
//     trigger dual-write mantiene en sincronía. `SELECT *` ahora devuelve
//     AMBAS (created_at VARCHAR + created_at_dt ISO string).
//   - Paso 3 va a droppear la VARCHAR y renombrar _dt → nombre original;
//     en ese momento el campo `created_at` pasa a ser ISO.
//
// Estos helpers tragan cualquiera de las dos formas:
//   * pickDate(row, 'created_at') prefiere row.created_at_dt (nueva) y si
//     no existe cae a row.created_at (vieja). Después del drop en Paso 3,
//     _dt desaparece y el fallback queda leyendo la (ahora ISO) columna
//     original — sin requerir otro redeploy de frontend.
//   * formatDateDmy / formatDateTimeDmy devuelven siempre el string en
//     formato legacy "d/m/yyyy" para preservar la UI sin cambios visuales.
//   * parseDateDmyOrIso devuelve un Date local de Buenos Aires para los
//     filtros (Repairs.js, Operaciones.js) sin depender del formato.
//
// La timezone Argentina (UTC-3, sin DST) está hardcodeada porque es el
// único uso del sistema.

const DMY_RE = /^\d{1,2}\/\d{1,2}\/\d{4}/;
const TZ = 'America/Argentina/Buenos_Aires';

/**
 * Elegí el mejor valor entre `row[field + '_dt']` y `row[field]`.
 * Transición-safe: mientras Paso 3 no haya corrido el backend devuelve
 * ambos; después del drop sólo el plain field (que pasa a ser ISO).
 */
export function pickDate(row, field) {
  if (!row) return null;
  const dt = row[field + '_dt'];
  if (dt !== undefined && dt !== null && dt !== '') return dt;
  const legacy = row[field];
  return legacy === undefined || legacy === '' ? null : legacy;
}

/**
 * Devuelve "d/m/yyyy" (sin zero-pad, sin hora). Acepta:
 *   - VARCHAR legacy "23/4/2026" o "23/4/2026 18:38:07"
 *   - ISO string "2026-04-23T03:00:00.000Z" (DATETIME serializado)
 *   - Date object
 *   - null/undefined/"" → ""
 */
export function formatDateDmy(v) {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'string' && DMY_RE.test(v)) {
    return v.split(' ')[0];
  }
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
    .formatToParts(d)
    .reduce((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});
  return `${Number(parts.day)}/${Number(parts.month)}/${parts.year}`;
}

/**
 * Devuelve "d/m/yyyy HH:MM:SS". Misma lógica que formatDateDmy pero con hora.
 */
export function formatDateTimeDmy(v) {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'string' && DMY_RE.test(v)) {
    return v;
  }
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return '';
  const parts = new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .formatToParts(d)
    .reduce((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return `${Number(parts.day)}/${Number(parts.month)}/${parts.year} ${hour}:${parts.minute}:${parts.second}`;
}

/**
 * Parseá un valor de fecha (VARCHAR legacy o ISO) a un Date local AR
 * (hora = 00:00:00). Útil para filtros que comparan fechas sin hora.
 * Devuelve null si el input es vacío o no parsea.
 */
export function parseDateDmyOrIso(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'string' && DMY_RE.test(v)) {
    const [d, m, y] = v.split(' ')[0].split('/').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return null;
  // Nos quedamos con la fecha-calendario en TZ AR (resuelve edge cases
  // donde el ISO viene de un momento cercano a medianoche UTC).
  const parts = new Intl.DateTimeFormat('es-AR', {
    timeZone: TZ,
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  })
    .formatToParts(d)
    .reduce((acc, p) => {
      acc[p.type] = p.value;
      return acc;
    }, {});
  return new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
}
