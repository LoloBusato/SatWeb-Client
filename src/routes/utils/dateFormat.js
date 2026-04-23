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
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}):(\d{2}))?/;

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
 * Convención tz del backend: las columnas DATETIME guardan wall-clock de
 * Buenos Aires SIN metadata de tz. Al leerlas, mysql2 (en Vercel UTC) las
 * reinterpreta como UTC y emite ISOs tipo "2026-04-23T00:00:00Z" — donde
 * el `Z` es engañoso, esas partes ya son AR-local. Por eso NO llamamos a
 * Intl.DateTimeFormat con una tz: tratamos el prefijo del ISO como
 * calendar-date literal (igual que hace Vercel al serializar el VARCHAR).
 *
 * Si en algún momento el backend se rearma para guardar UTC "de verdad"
 * (offset explícito de -3h entre store y display), hay que revisitar
 * este helper.
 */

/**
 * Devuelve "d/m/yyyy" (sin zero-pad, sin hora). Acepta:
 *   - VARCHAR legacy "23/4/2026" o "23/4/2026 18:38:07"
 *   - ISO string "2026-04-23T00:00:00.000Z" (DATETIME serializado)
 *   - Date object (equivalente al ISO string para nuestra convención)
 *   - null/undefined/"" → ""
 */
export function formatDateDmy(v) {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'string' && DMY_RE.test(v)) {
    return v.split(' ')[0];
  }
  if (typeof v === 'string') {
    const m = v.match(ISO_RE);
    if (m) return `${Number(m[3])}/${Number(m[2])}/${m[1]}`;
    return '';
  }
  if (v instanceof Date && !isNaN(v.getTime())) {
    return `${v.getUTCDate()}/${v.getUTCMonth() + 1}/${v.getUTCFullYear()}`;
  }
  return '';
}

/**
 * Devuelve "d/m/yyyy HH:MM:SS". Misma lógica que formatDateDmy pero con hora.
 */
export function formatDateTimeDmy(v) {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'string' && DMY_RE.test(v)) {
    return v;
  }
  if (typeof v === 'string') {
    const m = v.match(ISO_RE);
    if (!m) return '';
    const hour = m[4] ?? '00';
    const min = m[5] ?? '00';
    const sec = m[6] ?? '00';
    return `${Number(m[3])}/${Number(m[2])}/${m[1]} ${hour}:${min}:${sec}`;
  }
  if (v instanceof Date && !isNaN(v.getTime())) {
    const hh = String(v.getUTCHours()).padStart(2, '0');
    const mm = String(v.getUTCMinutes()).padStart(2, '0');
    const ss = String(v.getUTCSeconds()).padStart(2, '0');
    return `${v.getUTCDate()}/${v.getUTCMonth() + 1}/${v.getUTCFullYear()} ${hh}:${mm}:${ss}`;
  }
  return '';
}

/**
 * Parseá un valor de fecha (VARCHAR legacy o ISO) a un Date "día calendario"
 * local del runner (hora = 00:00:00). Suficiente para filtros que comparan
 * solamente la fecha (no la hora).
 * Devuelve null si el input es vacío o no parsea.
 */
export function parseDateDmyOrIso(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'string' && DMY_RE.test(v)) {
    const [d, m, y] = v.split(' ')[0].split('/').map(Number);
    return new Date(y, m - 1, d);
  }
  if (typeof v === 'string') {
    const m = v.match(ISO_RE);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  if (v instanceof Date && !isNaN(v.getTime())) {
    return new Date(v.getUTCFullYear(), v.getUTCMonth(), v.getUTCDate());
  }
  return null;
}
