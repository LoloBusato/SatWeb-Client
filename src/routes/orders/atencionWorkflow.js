// Helpers compartidos entre el home de Atención al Cliente (grupoId === 14)
// y la pestaña "Atención al cliente" del home admin. Centralizan:
//   - Las transiciones de estado disparadas por cada botón de acción.
//   - Los umbrales de antigüedad que mueven una orden de "en espera" a
//     "requiere acción" (1 día para ESPERANDO RESPUESTA CLIENTE / ESPERANDO
//     REPUESTO).
//   - El payload que arma el PUT /orders/:id preservando el resto de los
//     campos (el backend espera el body completo y nullea lo que falte).

import { parseDateDmyOrIso, pickDate } from '../utils/dateFormat'

// Nombre del estado actual → lista de acciones disponibles. `target` es el
// nombre del próximo estado (el id se resuelve en runtime contra GET /states
// para no acoplar la UI a ids puntuales del catálogo). `targetGroup`, si
// está presente, indica que al ejecutar la acción la orden tiene que
// reasignarse a ese grupo (se resuelve contra GET /grupousuarios por nombre).
// Si no está, la orden mantiene el users_id actual — salvo que el estado
// destino tenga forces_admin_assignment=1 en la DB, en cuyo caso el backend
// la pisa con el grupo Admin (regla en CRUD/orders.js:204; aplica a INCUCAI
// hoy).
export const LAB_GROUP_NAME = 'Laboratorio Principal Belgrano'

export const ACCIONES_POR_ESTADO = {
    'REPARADO': [
        // Queda en Atención al Cliente (cliente avisado, esperando que retire).
        { label: 'Avisar cliente', target: 'REPARADO CLIENTE AVISADO' },
    ],
    'PRESUPUESTAR': [
        // Queda en Atención al Cliente (esperando respuesta del cliente).
        { label: 'Enviar presupuesto', target: 'ESPERANDO RESPUESTA CLIENTE' },
    ],
    'ESPERANDO RESPUESTA CLIENTE': [
        { label: '¿Aceptó?', target: 'REPARAR', targetGroup: LAB_GROUP_NAME, confirm: '¿Confirmar que el cliente aceptó el presupuesto?' },
        { label: '¿Rechazó?', target: 'CERRAR Y DEVOLVER', targetGroup: LAB_GROUP_NAME, confirm: '¿Confirmar que el cliente rechazó el presupuesto? La orden vuelve a laboratorio para cerrar el equipo.' },
    ],
    'CONSULTAR A CLIENTE': [
        { label: 'Consulté', target: 'REPARAR', targetGroup: LAB_GROUP_NAME },
    ],
    'COMPRAR REPUESTO': [
        // Queda en Atención al Cliente (esperando que llegue el repuesto).
        { label: 'Compré / Pedí', target: 'ESPERANDO REPUESTO' },
    ],
    'ESPERANDO REPUESTO': [
        { label: 'Envié a laboratorio', target: 'REPARAR', targetGroup: LAB_GROUP_NAME },
    ],
    'NO REPARADO': [
        // El backend reasigna a Admin automáticamente porque INCUCAI tiene
        // forces_admin_assignment=1 — no hace falta mandar users_id.
        { label: 'Avisé al cliente', target: 'INCUCAI' },
    ],
}

// Estados que primero pasan por una ventana "en espera" y recién aparecen
// como acción cuando vence el umbral. Valor: días que tienen que pasar.
const UMBRAL_DIAS_PARA_ACCION = {
    'ESPERANDO RESPUESTA CLIENTE': 1,
    'ESPERANDO REPUESTO': 1,
}

// Estados que se muestran únicamente en "en espera" (sin botón) y desaparecen
// del home cuando superan estos días. Valor: máximo de días visible.
const VISIBLE_EN_ESPERA_HASTA = {
    'REPARADO CLIENTE AVISADO': 3,
    'ESPERANDO RESPUESTA CLIENTE': 1,
    'ESPERANDO REPUESTO': 1,
}

const MS_POR_DIA = 1000 * 60 * 60 * 24

export function ageInDays(order) {
    const created = parseDateDmyOrIso(pickDate(order, 'created_at'))
    if (!created) return 0
    return (Date.now() - created.getTime()) / MS_POR_DIA
}

// Categoriza una orden en 'action' (botón visible), 'wait' (solo lectura) o
// null (no debería aparecer en el home de Atención).
export function categorize(order) {
    const state = order.state
    const age = ageInDays(order)
    const umbralAccion = UMBRAL_DIAS_PARA_ACCION[state]
    if (umbralAccion !== undefined) {
        return age >= umbralAccion ? 'action' : 'wait'
    }
    if (ACCIONES_POR_ESTADO[state]) return 'action'
    if (VISIBLE_EN_ESPERA_HASTA[state] !== undefined) {
        return age < VISIBLE_EN_ESPERA_HASTA[state] ? 'wait' : null
    }
    return null
}

// Para los estados con re-alerta, devolvemos cuántos días faltan para que
// "venza el plazo" (umbral de pasaje a acción o de desaparición del home).
// Se renderiza como cuenta regresiva en la fila.
export function daysUntilDeadline(order) {
    const state = order.state
    const age = ageInDays(order)
    const umbralAccion = UMBRAL_DIAS_PARA_ACCION[state]
    if (umbralAccion !== undefined && age < umbralAccion) {
        return umbralAccion - age
    }
    const limiteEspera = VISIBLE_EN_ESPERA_HASTA[state]
    if (limiteEspera !== undefined && umbralAccion === undefined) {
        return limiteEspera - age
    }
    return null
}

export function formatAge(order) {
    const days = ageInDays(order)
    if (days < 1) {
        const horas = Math.max(0, Math.floor(days * 24))
        return `${horas} h`
    }
    if (days < 30) return `${Math.floor(days)} días`
    const meses = Math.floor(days / 30)
    const resto = Math.floor(days - meses * 30)
    return `${meses} m ${resto} d`
}

export function formatCountdown(days) {
    if (days === null || days === undefined) return ''
    if (days <= 0) return 'vencido'
    if (days < 1) {
        const horas = Math.ceil(days * 24)
        return `en ${horas} h`
    }
    return `en ${Math.ceil(days)} d`
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
// y pisando state_id (el backend nullea cualquier campo que falte en el body
// — ver CRUD/orders.js:204). Si la acción incluye reasignación de grupo,
// pasar `newUsersId` para sobrescribir el users_id; sino se mantiene el
// actual (el backend igual puede pisarlo si el nuevo estado tiene
// forces_admin_assignment=1, ej. INCUCAI).
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
// no crear un nuevo contexto en cada llamada (los navegadores limitan la
// cantidad de contexts activos). Falla silencioso si el browser bloquea
// audio sin gesto previo del usuario.
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
