import { useEffect, useRef } from 'react'
import axios from 'axios'
import SERVER from '../server'
import { isAtencionOrder, categorize, playAlarm } from '../orders/atencionWorkflow'

// Hook reutilizable que monitorea órdenes con acción "ahora" y alerta cuando
// entran nuevas. Pensado para vivir en MainNavBar — así corre en cualquier
// pantalla del flujo de Atención, no sólo en /home.
//
// - Pide permiso de Notification al montar (sólo si nunca se decidió; si fue
//   denegado no insiste).
// - Cada POLL_MS hace GET /orders + /orders/para-retirar (mismo conjunto que
//   refreshOrders en HomeAtencion) y filtra por ATENCION_STATES + categorize.
// - Compara los order_ids contra el snapshot anterior (persistido en
//   sessionStorage para que sobreviva a las re-mounts de MainNavBar entre
//   navegaciones — si no, cada Link dispararía la alarma para "todo lo
//   pendiente").
// - Si hay nuevos: playAlarm() + (si document.hidden y permission granted)
//   Notification del sistema con onclick → focus + close.
// - Dos gates independientes:
//   * Notifier de ÓRDENES: sólo grupoId === 14 (Atención al Cliente). Es
//     el flujo que ese grupo maneja; admins y otros grupos no necesitan.
//   * Notifier de TASK INSTANCES: cualquier usuario logueado. Funciona
//     automáticamente para cualquier grupo al que se le asignen tareas
//     en el futuro — sin tocar el código.

const POLL_MS = 30 * 1000
const STORAGE_KEY = 'satweb:atencion:lastActionIds'

function readStoredIds() {
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        const arr = JSON.parse(raw)
        if (!Array.isArray(arr)) return null
        return new Set(arr.map(Number))
    } catch (_) { return null }
}

function writeStoredIds(set) {
    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)))
    } catch (_) {}
}

function isOrderNotifierEnabled() {
    const grupoId = JSON.parse(localStorage.getItem('grupoId') ?? 'null')
    return grupoId === 14
}

function isTaskNotifierEnabled() {
    const userId = JSON.parse(localStorage.getItem('userId') ?? 'null')
    const grupoId = JSON.parse(localStorage.getItem('grupoId') ?? 'null')
    return userId != null || grupoId != null
}

// Snapshot separado para task_instances — convive con el de órdenes.
const TASKS_STORAGE_KEY = 'satweb:atencion:lastTaskInstanceIds'
function readStoredTaskIds() {
    try {
        const raw = sessionStorage.getItem(TASKS_STORAGE_KEY)
        if (!raw) return null
        const arr = JSON.parse(raw)
        if (!Array.isArray(arr)) return null
        return new Set(arr.map(Number))
    } catch (_) { return null }
}
function writeStoredTaskIds(set) {
    try {
        sessionStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(Array.from(set)))
    } catch (_) {}
}

export default function useTaskNotifier() {
    const orderEnabled = isOrderNotifierEnabled()
    const taskEnabled = isTaskNotifierEnabled()

    // Pedir permiso de Notification si alguno de los dos notifiers está
    // activo. Si fue denegado, no se reintenta (gate Notification.permission).
    useEffect(() => {
        if (!orderEnabled && !taskEnabled) return
        if ('Notification' in window && Notification.permission === 'default') {
            try { Notification.requestPermission() } catch (_) {}
        }
    }, [orderEnabled, taskEnabled])

    const prevActionIdsRef = useRef(readStoredIds())
    const prevTaskIdsRef = useRef(readStoredTaskIds())

    // Notifier de órdenes — sólo grupoId === 14.
    useEffect(() => {
        if (!orderEnabled) return
        let cancelled = false

        async function poll() {
            try {
                const [active, paraRetirar] = await Promise.all([
                    axios.get(`${SERVER}/orders`).then(r => r.data).catch(() => []),
                    axios.get(`${SERVER}/orders/para-retirar`).then(r => r.data).catch(() => []),
                ])
                if (cancelled) return
                const merged = [...(active || []), ...(paraRetirar || [])]
                    .filter(isAtencionOrder)
                const actionOrders = merged.filter(o => categorize(o) === 'action')
                detectAndNotify(actionOrders)
            } catch (_) {}
        }

        function detectAndNotify(currentOrders) {
            const currentIds = new Set(currentOrders.map(o => o.order_id))
            const prev = prevActionIdsRef.current
            const isFirstPoll = prev === null

            // Detectar órdenes nuevas. En el primer poll de la sesión todo
            // cuenta como "nuevo" para fines de alarma + notificación, pero
            // NO emitimos un TaskToast por cada — sería spam (operador acaba
            // de abrir la app y va a mirar el home igual). Los toasts sólo
            // disparan en polls posteriores.
            const newOrders = isFirstPoll
                ? currentOrders.slice()
                : currentOrders.filter(o => !prev.has(o.order_id))

            if (newOrders.length > 0) {
                playAlarm()
                if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                    try {
                        const body = newOrders.length === 1
                            ? 'Hay una nueva acción para realizar'
                            : `Hay ${newOrders.length} nuevas acciones para realizar`
                        const n = new Notification('Nueva tarea - SatWeb', {
                            body, icon: '/favicon.ico', requireInteraction: true,
                        })
                        n.onclick = () => { window.focus(); n.close() }
                    } catch (_) {}
                }
                // Evento agregado para que HomeAtencion (si está montado)
                // refresque su lista sin tener que pollear por su cuenta.
                try {
                    window.dispatchEvent(new CustomEvent('satweb:nuevas-tareas', {
                        detail: { count: newOrders.length },
                    }))
                } catch (_) {}
                // Toasts: skip en el primer poll para no inundar.
                if (!isFirstPoll) {
                    for (const o of newOrders) {
                        try {
                            window.dispatchEvent(new CustomEvent('satweb:nueva-tarea', { detail: o }))
                        } catch (_) {}
                    }
                }
            }
            prevActionIdsRef.current = currentIds
            writeStoredIds(currentIds)
        }

        poll()
        const id = setInterval(poll, POLL_MS)
        return () => { cancelled = true; clearInterval(id) }
    }, [orderEnabled])

    // Notifier de task_instances — corre para cualquier usuario logueado
    // (no requiere grupoId === 14). Polling separado del de órdenes para
    // que un admin/laboratorio reciba sus tareas sin meterse en el flujo
    // de Atención. Si en el futuro se asignan tareas a otros grupos,
    // funciona automáticamente sin tocar código.
    useEffect(() => {
        if (!taskEnabled) return
        let cancelled = false

        async function poll() {
            try {
                const userId = JSON.parse(localStorage.getItem('userId') ?? 'null')
                const grupoId = JSON.parse(localStorage.getItem('grupoId') ?? 'null')
                const r = await axios.get(`${SERVER}/task-instances/pending`, {
                    params: { userId: userId ?? '', grupoId: grupoId ?? '' },
                }).catch(() => ({ data: [] }))
                if (cancelled) return
                detectAndNotifyTasks(r.data || [])
            } catch (_) {}
        }

        function detectAndNotifyTasks(items) {
            const currentIds = new Set(items.map(i => i.id))
            const prev = prevTaskIdsRef.current
            const isFirst = prev === null
            const newCount = isFirst
                ? currentIds.size
                : Array.from(currentIds).filter(id => !prev.has(id)).length
            if (newCount > 0) {
                playAlarm()
                if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                    try {
                        const body = newCount === 1
                            ? 'Hay una nueva tarea para realizar'
                            : `Hay ${newCount} nuevas tareas para realizar`
                        const n = new Notification('Nueva tarea - SatWeb', {
                            body, icon: '/favicon.ico', requireInteraction: true,
                        })
                        n.onclick = () => { window.focus(); n.close() }
                    } catch (_) {}
                }
                try {
                    window.dispatchEvent(new CustomEvent('satweb:nuevas-tareas', {
                        detail: { count: newCount },
                    }))
                } catch (_) {}
            }
            prevTaskIdsRef.current = currentIds
            writeStoredTaskIds(currentIds)
        }

        poll()
        const id = setInterval(poll, POLL_MS)
        return () => { cancelled = true; clearInterval(id) }
    }, [taskEnabled])
}
