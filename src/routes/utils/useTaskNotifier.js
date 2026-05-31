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
// - Gate por grupoId === 14 (Atención al Cliente). Admins y otros grupos
//   tienen acceso al flujo pero NO reciben alarmas — el polling sólo lo
//   carga el usuario que efectivamente atiende.

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

function isEnabled() {
    const grupoId = JSON.parse(localStorage.getItem('grupoId') ?? 'null')
    return grupoId === 14
}

export default function useTaskNotifier() {
    const enabled = isEnabled()

    // Pedir permiso de Notification al montar (gateado por enabled).
    useEffect(() => {
        if (!enabled) return
        if ('Notification' in window && Notification.permission === 'default') {
            try { Notification.requestPermission() } catch (_) {}
        }
    }, [enabled])

    const prevActionIdsRef = useRef(readStoredIds())

    useEffect(() => {
        if (!enabled) return
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
                const actionIds = merged
                    .filter(o => categorize(o) === 'action')
                    .map(o => o.order_id)
                detectAndNotify(new Set(actionIds))
            } catch (_) {}
        }

        function detectAndNotify(currentIds) {
            const prev = prevActionIdsRef.current
            let newCount = 0
            if (prev === null) {
                // Primer arranque de la sesión — todo cuenta como nuevo.
                newCount = currentIds.size
            } else {
                for (const id of currentIds) {
                    if (!prev.has(id)) newCount += 1
                }
            }
            if (newCount > 0) {
                playAlarm()
                if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
                    try {
                        const body = newCount === 1
                            ? 'Hay una nueva acción para realizar'
                            : `Hay ${newCount} nuevas acciones para realizar`
                        const n = new Notification('Nueva tarea - SatWeb', {
                            body, icon: '/favicon.ico', requireInteraction: true,
                        })
                        n.onclick = () => { window.focus(); n.close() }
                    } catch (_) {}
                }
            }
            prevActionIdsRef.current = currentIds
            writeStoredIds(currentIds)
        }

        poll()
        const id = setInterval(poll, POLL_MS)
        return () => { cancelled = true; clearInterval(id) }
    }, [enabled])
}
