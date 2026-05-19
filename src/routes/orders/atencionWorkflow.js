// Helpers compartidos entre el home de Atención al Cliente (grupoId === 14)
// y la pestaña "Atención al cliente" del home admin. Centralizan:
//   - Las transiciones de estado disparadas por cada botón.
//   - Los umbrales de antigüedad que mueven una orden de "Esperando" a
//     "Acciones para hacer ahora".
//   - El payload del PUT /orders/:id preservando el resto de los campos
//     (el backend espera el body completo y nullea lo que falte).
//   - El anchor del countdown (state_changed_at, agregado en migration 0023;
//     cae a created_at en órdenes muy viejas sin backfill).

import { parseDateDmyOrIso, pickDate } from '../utils/dateFormat'

export const LAB_GROUP_NAME = 'Laboratorio Principal Belgrano'

// Cada acción tiene `kind` que define cómo se confirma con el usuario:
//   - 'toast'      : toast flotante con barra de 5s + botón Deshacer. La
//                    PUT se dispara al vencer el toast.
//   - 'modal'      : modal de confirmación con resumen del impacto.
//   - 'presupuesto': modal con textarea — guarda mensaje "PRESUPUESTO: ..."
//                    o "PRESUPUESTO ACEPTADO: ..." vía POST /messages y
//                    después dispara la PUT al nuevo estado.
//   - 'finalizar'  : usa PUT /orders/finalizar/:id (el backend setea
//                    state_id = delivered_state_id, users_id = 18,
//                    returned_at y state_changed_at).
//
// `reset: true` ⇒ la PUT manda el mismo state_id actual — el backend
// bumpea state_changed_at y el countdown empieza de cero.
//
// `targetGroup` (si está) ⇒ resolver users_id por nombre vs /grupousuarios.
// Cuando es null pero el estado destino tiene forces_admin_assignment=1
// (INCUCAI, SOLUCIONA ADMIN), el backend pisa el users_id al grupo Admin.
export const ACCIONES_POR_ESTADO = {
    // === Always-action states (siempre aparecen en "Acciones para hacer ahora") ===
    'REPARADO': [
        { id: 'avisar_cliente', label: 'Avisar cliente', kind: 'toast',
          target: 'REPARADO CLIENTE AVISADO' },
    ],
    'PRESUPUESTAR': [
        { id: 'enviar_presupuesto', label: 'Enviar presupuesto', kind: 'presupuesto',
          target: 'ESPERANDO RESPUESTA CLIENTE',
          presupuestoPrefix: 'PRESUPUESTO',
          presupuestoTitle: 'Enviar presupuesto al cliente' },
    ],
    'CONSULTAR A CLIENTE': [
        { id: 'consulte', label: 'Consulté', kind: 'toast',
          target: 'REPARAR', targetGroup: LAB_GROUP_NAME },
    ],
    'COMPRAR REPUESTO': [
        { id: 'compre', label: 'Compré / Pedí', kind: 'toast',
          target: 'ESPERANDO REPUESTO' },
    ],
    'NO REPARADO': [
        { id: 'avise_cliente_incucai', label: 'Avisé al cliente', kind: 'toast',
          target: 'INCUCAI' }, // backend force-asigna a Admin (forces_admin_assignment=1)
    ],

    // === Wait states con acciones (mismas en "Esperando" y en "Acciones ahora"
    //     cuando vence el plazo) ===
    'ESPERANDO RESPUESTA CLIENTE': [
        { id: 'si_acepto', label: 'Sí aceptó', kind: 'presupuesto',
          target: 'REPARAR', targetGroup: LAB_GROUP_NAME,
          presupuestoPrefix: 'PRESUPUESTO ACEPTADO',
          presupuestoTitle: 'Registrar presupuesto aceptado' },
        { id: 'no_acepto', label: 'No aceptó', kind: 'modal',
          target: 'CERRAR Y DEVOLVER', targetGroup: LAB_GROUP_NAME,
          modalTitle: 'Cliente rechazó el presupuesto',
          modalBody: 'La orden pasa a CERRAR Y DEVOLVER y se reasigna a Laboratorio Principal Belgrano para que cierren el equipo.' },
        { id: 'no_contesto', label: 'No contestó', kind: 'toast',
          target: 'ESPERANDO RESPUESTA CLIENTE', reset: true },
    ],
    'ESPERANDO REPUESTO': [
        { id: 'llego', label: 'Llegó', kind: 'toast',
          target: 'REPARAR', targetGroup: LAB_GROUP_NAME },
        { id: 'no_llego', label: 'No llegó', kind: 'toast',
          target: 'ESPERANDO REPUESTO', reset: true },
        { id: 'no_consigo', label: 'No consigo', kind: 'modal',
          target: 'SOLUCIONA ADMIN',
          modalTitle: 'Derivar a Admin',
          modalBody: 'La orden pasa a SOLUCIONA ADMIN. El backend reasigna automáticamente al grupo Admin.' },
    ],
    'REPARADO CLIENTE AVISADO': [
        { id: 'vino_a_buscar', label: 'Vino a buscar', kind: 'toast',
          finalizar: true }, // PUT /orders/finalizar/:id
        { id: 'no_vino', label: 'No vino', kind: 'toast',
          target: 'REPARADO CLIENTE AVISADO', reset: true },
    ],
    'SOLUCIONA ADMIN': [
        { id: 'cerrar_y_devolver', label: 'Cerrar y devolver', kind: 'modal',
          target: 'CERRAR Y DEVOLVER', targetGroup: LAB_GROUP_NAME,
          modalTitle: 'Cerrar y devolver',
          modalBody: 'La orden pasa a CERRAR Y DEVOLVER y se reasigna a Laboratorio Principal Belgrano.' },
    ],
    // Pre-Venta — cliente retiró pagando menos del saldo. Acciones:
    'DEUDOR': [
        // 'navigate' es un kind nuevo: en vez de PUT, hace navigate(targetPath).
        // Útil cuando la acción requiere un screen complejo (cobro pre-venta,
        // modal de arrepentimiento) que ya tiene su propia ruta.
        { id: 'cobro_resto', label: 'Cobró el resto', kind: 'navigate',
          targetPath: '/preventa-cobro/' /* :id appendado en handleAction */ },
        { id: 'no_pago', label: 'No pagó', kind: 'toast',
          target: 'DEUDOR', reset: true },
        { id: 'arrepentido', label: 'Se arrepintió', kind: 'navigate',
          targetPath: '/messages/' /* :id — el modal vive en Messages.js */ },
    ],
}

// Estados always-action (Acciones para hacer ahora desde el segundo cero).
const ALWAYS_ACTION = new Set([
    'REPARADO',
    'PRESUPUESTAR',
    'CONSULTAR A CLIENTE',
    'COMPRAR REPUESTO',
    'NO REPARADO',
])

// Conjunto de estados que entran al home de Atención. Se usa como filtro
// de las órdenes que se muestran: el users_id NO es confiable porque
// algunos estados re-asignan a otros grupos (SOLUCIONA ADMIN → Admin vía
// forces_admin_assignment), pero igual seguimos siendo dueños del flujo.
export const ATENCION_STATES = new Set([
    'REPARADO',
    'PRESUPUESTAR',
    'CONSULTAR A CLIENTE',
    'COMPRAR REPUESTO',
    'NO REPARADO',
    'ESPERANDO RESPUESTA CLIENTE',
    'ESPERANDO REPUESTO',
    'REPARADO CLIENTE AVISADO',
    'SOLUCIONA ADMIN',
    'DEUDOR',
])

// Wait states con plazo de vencimiento. Al vencer pasan a "Acciones ahora".
const WAIT_DEADLINE_DAYS = {
    'ESPERANDO RESPUESTA CLIENTE': 1,
    'ESPERANDO REPUESTO': 1,
    'REPARADO CLIENTE AVISADO': 3,
    'DEUDOR': 7,
}

// Wait state sin deadline (queda al final de "Esperando", siempre visible).
const WAIT_NO_DEADLINE = new Set(['SOLUCIONA ADMIN'])

const MS_POR_DIA = 1000 * 60 * 60 * 24

// Devuelve el anchor del countdown: state_changed_at si existe, sino
// created_at (orders viejas o caminos que aún no bumpean). Mismo helper
// para ambos campos legacy VARCHAR ↔ DATETIME ISO.
export function pickStateChangeAt(order) {
    return pickDate(order, 'state_changed_at') ?? pickDate(order, 'created_at')
}

export function daysInCurrentState(order) {
    const anchor = parseDateDmyOrIso(pickStateChangeAt(order))
    if (!anchor) return 0
    return (Date.now() - anchor.getTime()) / MS_POR_DIA
}

// Categorización para el home de Atención. Devuelve:
//   'action'  ⇒ va a "Acciones para hacer ahora"
//   'wait'    ⇒ va a "Esperando"
//   null      ⇒ no se muestra
export function categorize(order) {
    const state = order.state
    if (ALWAYS_ACTION.has(state)) return 'action'
    if (WAIT_DEADLINE_DAYS[state] !== undefined) {
        const deadline = WAIT_DEADLINE_DAYS[state]
        return daysInCurrentState(order) >= deadline ? 'action' : 'wait'
    }
    if (WAIT_NO_DEADLINE.has(state)) return 'wait'
    return null
}

// Días restantes hasta el deadline (positivo = falta, ≤0 = vencido).
// null si el estado no tiene deadline (SOLUCIONA ADMIN, always-action).
export function daysUntilDeadline(order) {
    const deadline = WAIT_DEADLINE_DAYS[order.state]
    if (deadline === undefined) return null
    return deadline - daysInCurrentState(order)
}

// Cuánto tiempo lleva vencido. Positivo = días desde que venció. null si
// no aplica (no tiene deadline o todavía no venció).
export function daysOverdue(order) {
    const remaining = daysUntilDeadline(order)
    if (remaining === null || remaining > 0) return null
    return -remaining
}

export function formatDuration(days) {
    if (days === null || days === undefined) return ''
    if (days < 0) days = 0
    if (days < 1) {
        const horas = Math.max(0, Math.floor(days * 24))
        return `${horas} h`
    }
    if (days < 30) return `${Math.floor(days)} d`
    const meses = Math.floor(days / 30)
    const resto = Math.floor(days - meses * 30)
    return resto > 0 ? `${meses} m ${resto} d` : `${meses} m`
}

export function findStateIdByName(states, name) {
    const target = (name ?? '').trim().toUpperCase()
    const match = states.find(s => (s.state ?? '').trim().toUpperCase() === target)
    return match ? match.idstates : null
}

export function findGroupIdByName(grupos, name) {
    const target = (name ?? '').trim().toLowerCase()
    const match = grupos.find(g => (g.grupo ?? '').trim().toLowerCase() === target)
    return match ? match.idgrupousuarios : null
}

// Arma el body completo del PUT /orders/:id preservando los campos actuales
// y pisando state_id (y opcionalmente users_id). El backend nullea cualquier
// campo que falte en el body — ver CRUD/orders.js:204.
export function buildUpdatePayload(order, newStateId, newUsersId) {
    return {
        device_id: order.device_id ?? order.iddevices,
        branches_id: order.branches_id ?? order.idbranches,
        state_id: newStateId,
        problem: order.problem ?? '',
        password: order.password ?? '',
        accesorios: order.accesorios ?? '',
        serial: order.serial ?? '',
        users_id: newUsersId ?? order.users_id,
        device_color: order.device_color ?? '',
    }
}

// Beep corto usando Web Audio API. Reutiliza un AudioContext perezoso para
// no crear un nuevo contexto en cada llamada. Falla silencioso si el browser
// bloquea autoplay sin gesto previo.
let _audioCtx = null
export function playBeep() {
    try {
        if (!_audioCtx) {
            const Ctx = window.AudioContext || window.webkitAudioContext
            if (!Ctx) return
            _audioCtx = new Ctx()
        }
        const ctx = _audioCtx
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, ctx.currentTime)
        gain.gain.setValueAtTime(0.0001, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
        osc.connect(gain).connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.55)
    } catch (e) {
        // browser sin Web Audio o autoplay bloqueado — ignorar
    }
}

// Compara para ordenar "Esperando" por deadline ascendente. Estados sin
// deadline (SOLUCIONA ADMIN) van al final.
export function compareByDeadline(a, b) {
    const da = daysUntilDeadline(a)
    const db = daysUntilDeadline(b)
    if (da === null && db === null) return 0
    if (da === null) return 1
    if (db === null) return -1
    return da - db
}
