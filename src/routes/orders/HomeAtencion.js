import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from './MainNavBar'
import SERVER from '../server'
import TasksSection, { effectiveMs } from '../utils/TasksSection'
import {
    ACCIONES_POR_ESTADO,
    isAtencionOrder,
    categorize,
    compareByDeadline,
    daysInCurrentState,
    daysUntilDeadline,
    daysOverdue,
    formatDuration,
    findStateIdByName,
    findGroupIdByName,
    buildUpdatePayload,
    playBeep,
    computeRealert,
} from './atencionWorkflow'

const ALERT_INTERVAL_MS = 30 * 60 * 1000
const TOAST_UNDO_MS = 5000

// "Visto a la X" por orden — la barra de progreso mide minutos desde
// que la orden APARECIÓ en "Acciones ahora", no desde state_changed_at
// (que suele ser de hace días y haría la barra siempre roja). Persistido
// en localStorage para sobrevivir reloads/navegaciones; se limpia cuando
// la orden sale del bucket de acciones (operador la atendió o entró en
// cooldown de realert).
const SEEN_PREFIX = 'satweb:action-seen:'
function readSeenAt(orderId) {
    const raw = localStorage.getItem(SEEN_PREFIX + orderId)
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : null
}
function writeSeenAt(orderId, ts) {
    try { localStorage.setItem(SEEN_PREFIX + orderId, String(ts)) } catch (_) {}
}
function removeSeenAt(orderId) {
    try { localStorage.removeItem(SEEN_PREFIX + orderId) } catch (_) {}
}

// ============================================================================
// Modal de presupuesto — reusable para "Enviar presupuesto" (PRESUPUESTAR →
// ESPERANDO RESPUESTA CLIENTE) y "Sí aceptó" (ESPERANDO RESPUESTA CLIENTE →
// REPARAR). Guarda un mensaje server-side y después ejecuta la transición.
// ============================================================================
function PresupuestoModal({ open, order, action, onClose, onConfirm }) {
    const [text, setText] = useState('')
    useEffect(() => {
        if (open) setText('')
    }, [open])
    if (!open || !action) return null
    const placeholder = action.presupuestoPrefix === 'PRESUPUESTO ACEPTADO'
        ? 'Monto aceptado + detalle (ej: $25.000 + cambio de pantalla y batería)'
        : 'Monto + detalle del presupuesto (ej: $25.000 + cambio de pantalla)'
    return (
        <div className='fixed inset-0 z-40 bg-black bg-opacity-40 flex items-center justify-center px-4'>
            <div className='bg-white rounded-lg shadow-xl w-full max-w-lg p-5'>
                <h3 className='text-xl font-bold mb-1'>{action.presupuestoTitle}</h3>
                <p className='text-sm text-gray-600 mb-3'>
                    Orden #{order.order_id} — {order.name} {order.surname}
                </p>
                <textarea
                    autoFocus
                    rows={4}
                    className='w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-300'
                    placeholder={placeholder}
                    value={text}
                    onChange={(e) => setText(e.target.value)} />
                <p className='text-xs text-gray-500 mt-1'>
                    Se guarda como mensaje "{action.presupuestoPrefix}: ..." en la orden.
                </p>
                <div className='flex justify-end gap-2 mt-4'>
                    <button className='px-3 py-1 rounded border hover:bg-gray-100'
                        onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        disabled={!text.trim()}
                        className={`px-3 py-1 rounded text-white font-bold ${text.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}
                        onClick={() => onConfirm(text.trim())}>
                        Confirmar y enviar
                    </button>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// Modal de confirmación genérico — para acciones con consecuencia material
// (No aceptó, No consigo, Cerrar y devolver).
// ============================================================================
function ConfirmModal({ open, order, action, onClose, onConfirm }) {
    if (!open || !action) return null
    return (
        <div className='fixed inset-0 z-40 bg-black bg-opacity-40 flex items-center justify-center px-4'>
            <div className='bg-white rounded-lg shadow-xl w-full max-w-md p-5'>
                <h3 className='text-xl font-bold mb-1'>{action.modalTitle}</h3>
                <p className='text-sm text-gray-600 mb-3'>
                    Orden #{order.order_id} — {order.name} {order.surname}
                </p>
                <p className='text-sm'>{action.modalBody}</p>
                <div className='flex justify-end gap-2 mt-4'>
                    <button className='px-3 py-1 rounded border hover:bg-gray-100'
                        onClick={onClose}>
                        Cancelar
                    </button>
                    <button
                        className='px-3 py-1 rounded text-white font-bold bg-red-600 hover:bg-red-700'
                        onClick={onConfirm}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// Toast con barra de progreso 5s + botón Deshacer. La acción se ejecuta al
// vencer la cuenta, NO inmediatamente — Deshacer la cancela limpio.
// Apilamos toasts: el array vive en el padre, cada toast tiene su propio
// timer interno y se auto-remueve cuando termina.
// ============================================================================
function ToastStack({ toasts, onUndo, onFire }) {
    return (
        <div className='fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm'>
            {toasts.map(t => (
                <ToastItem key={t.id} toast={t} onUndo={() => onUndo(t.id)} onFire={() => onFire(t.id)} />
            ))}
        </div>
    )
}

function ToastItem({ toast, onUndo, onFire }) {
    const [progress, setProgress] = useState(100)
    useEffect(() => {
        const start = Date.now()
        const tick = setInterval(() => {
            const elapsed = Date.now() - start
            const pct = Math.max(0, 100 - (elapsed / TOAST_UNDO_MS) * 100)
            setProgress(pct)
            if (elapsed >= TOAST_UNDO_MS) {
                clearInterval(tick)
                onFire()
            }
        }, 100)
        return () => clearInterval(tick)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toast.id])
    return (
        <div className='bg-gray-900 text-white rounded-lg shadow-xl px-4 py-3 flex flex-col gap-1'>
            <div className='flex items-center justify-between gap-3'>
                <div className='text-sm'>
                    <div className='font-bold'>{toast.title}</div>
                    <div className='text-xs text-gray-300'>{toast.subtitle}</div>
                </div>
                <button
                    onClick={onUndo}
                    className='px-2 py-1 text-xs font-bold bg-white text-gray-900 rounded hover:bg-gray-200'>
                    Deshacer
                </button>
            </div>
            <div className='h-1 bg-gray-700 rounded overflow-hidden'>
                <div className='h-full bg-blue-400 transition-all' style={{ width: `${progress}%` }} />
            </div>
        </div>
    )
}

// ============================================================================
// Botones de acción de una fila — comparte la lógica entre "Acciones ahora"
// y "Esperando" (las wait con plazo tienen los mismos botones en ambas
// secciones).
// ============================================================================
function RowActions({ order, isSubmitting, onAction }) {
    const acciones = ACCIONES_POR_ESTADO[order.state] ?? []
    if (acciones.length === 0) return null
    return (
        <div className='flex flex-col md:flex-row gap-1 justify-center'>
            {acciones.map(a => (
                <button
                    key={a.id}
                    disabled={isSubmitting}
                    onClick={(e) => { e.stopPropagation(); onAction(order, a) }}
                    className={`px-2 py-1 rounded text-white font-bold text-xs ${isSubmitting ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-700'}`}>
                    {a.label}
                </button>
            ))}
        </div>
    )
}

// ============================================================================
function HomeAtencion() {
    const navigate = useNavigate()
    const username = localStorage.getItem('username') ?? ''
    const permisos = localStorage.getItem('permisos') ?? ''
    const grupoId = JSON.parse(localStorage.getItem('grupoId') ?? 'null')

    const [orders, setOrders] = useState([])
    // Tareas del usuario — se intercalan en "Acciones ahora" cuando están
    // due (effectiveMs <= now). Las futuras viven debajo en TasksSection.
    const [taskInstances, setTaskInstances] = useState([])
    const [states, setStates] = useState([])
    const [grupos, setGrupos] = useState([])
    const [submitting, setSubmitting] = useState(null)
    // tick: re-render cada 60s para que el countdown se actualice y las
    // órdenes vencidas migren a "Acciones ahora" sin esperar un refetch.
    const [tick, setTick] = useState(0)

    // Modales: una orden + acción activas a la vez.
    const [presupuestoModal, setPresupuestoModal] = useState(null)
    const [confirmModal, setConfirmModal] = useState(null)
    // Toasts apilados (deshacer 5s). Cada uno con un { id, order, action,
    // title, subtitle }. El timer interno del ToastItem dispara onFire.
    const [toasts, setToasts] = useState([])
    const toastIdRef = useRef(0)

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    // /orders excluye los 3 estados especiales (delivered/ready/incucai),
    // pero REPARADO CLIENTE AVISADO = ready_state_id (id 25) cae en
    // /orders/para-retirar. Concatenamos los dos endpoints para que todas
    // las órdenes del flujo de Atención queden visibles.
    const refreshOrders = useCallback(async () => {
        const [active, paraRetirar] = await Promise.all([
            axios.get(`${SERVER}/orders`).then(r => r.data).catch(() => []),
            axios.get(`${SERVER}/orders/para-retirar`).then(r => r.data).catch(() => []),
        ])
        const merged = [...active, ...paraRetirar].filter(isAtencionOrder)
        setOrders(merged)
    }, [])

    useEffect(() => {
        // Cada fetch independiente: si falla uno (ej. /grupousuarios 5xx),
        // no nuke los otros tres. Antes usaba Promise.all → un error tiraba
        // todo y la página quedaba vacía (BUG 3 del informe).
        const fetchAll = async () => {
            try {
                const [active, paraRetirar] = await Promise.all([
                    axios.get(`${SERVER}/orders`).then(r => r.data).catch(e => { console.error(e); return [] }),
                    axios.get(`${SERVER}/orders/para-retirar`).then(r => r.data).catch(e => { console.error(e); return [] }),
                ])
                setOrders([...active, ...paraRetirar].filter(isAtencionOrder))
            } catch (e) { console.error(e) }
            axios.get(`${SERVER}/states`)
                .then(r => setStates(r.data))
                .catch(e => console.error(e))
            axios.get(`${SERVER}/grupousuarios`)
                .then(r => setGrupos(r.data))
                .catch(e => console.error(e))
        }
        fetchAll()
    }, [])

    const { actions, waiting } = useMemo(() => {
        const a = []
        const w = []
        for (const order of orders) {
            const bucket = categorize(order)
            if (bucket === 'action') a.push(order)
            else if (bucket === 'wait') w.push(order)
        }
        w.sort(compareByDeadline)
        return { actions: a, waiting: w }
        // tick refuerza el recompute para que las órdenes que cruzan el
        // deadline se muevan de sección sin esperar un refetch.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orders, tick])

    // La detección de tareas nuevas + alarma + notificación vive ahora en
    // useTaskNotifier (montado en MainNavBar) — corre en cualquier pantalla,
    // no sólo en /home. Acá sólo mantenemos el beep ambiental cada 30min
    // mientras haya pendientes en la vista activa, como recordatorio suave.
    const pendingRef = useRef(0)
    pendingRef.current = actions.length
    useEffect(() => {
        const interval = setInterval(() => {
            if (pendingRef.current > 0) playBeep()
        }, ALERT_INTERVAL_MS)
        return () => clearInterval(interval)
    }, [])

    // Fetch de task instances del usuario (todas las no completadas).
    // Se mezclan luego con las órdenes en "Acciones ahora".
    const refreshTasks = useCallback(async () => {
        const userId = JSON.parse(localStorage.getItem('userId') ?? 'null')
        if (!userId) return
        try {
            const r = await axios.get(`${SERVER}/task-instances/pending`, { params: { userId } })
            setTaskInstances(r.data || [])
        } catch (e) { console.error('task-instances/pending', e) }
    }, [])

    useEffect(() => {
        refreshTasks()
        const id = setInterval(refreshTasks, 60 * 1000)
        return () => clearInterval(id)
    }, [refreshTasks])

    // Cuando useTaskNotifier detecta cambios, refrescamos órdenes Y tareas.
    useEffect(() => {
        function handler() { refreshOrders(); refreshTasks() }
        window.addEventListener('satweb:nuevas-tareas', handler)
        return () => window.removeEventListener('satweb:nuevas-tareas', handler)
    }, [refreshOrders, refreshTasks])

    // Split de tareas — due se intercala con actions, upcoming va a TasksSection.
    const { dueTasks, upcomingTasks } = useMemo(() => {
        const now = Date.now()
        const due = [], up = []
        for (const t of taskInstances) {
            if (effectiveMs(t) <= now) due.push(t)
            else up.push(t)
        }
        return { dueTasks: due, upcomingTasks: up }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [taskInstances, tick])

    async function completeTaskInstance(inst) {
        const userId = JSON.parse(localStorage.getItem('userId') ?? 'null')
        try {
            await axios.post(`${SERVER}/task-instances/${inst.id}/complete`, { completed_by: userId })
            refreshTasks()
        } catch (e) { alert('No se pudo completar la tarea') }
    }
    async function postponeTaskInstance(inst, minutes) {
        try {
            await axios.post(`${SERVER}/task-instances/${inst.id}/postpone`, { minutes })
            refreshTasks()
        } catch (e) { alert('No se pudo postergar') }
    }

    // Tracking "first seen in actions" para la barra de progreso. Inicializa
    // el timestamp en localStorage la primera vez que un order_id aparece
    // en actions; lo limpia cuando sale (operador atendió o pasó a wait).
    const prevSeenIdsRef = useRef(new Set())
    useEffect(() => {
        const current = new Set(actions.map(o => o.order_id))
        const now = Date.now()
        for (const id of current) {
            if (!prevSeenIdsRef.current.has(id) && readSeenAt(id) === null) {
                writeSeenAt(id, now)
            }
        }
        for (const id of prevSeenIdsRef.current) {
            if (!current.has(id)) removeSeenAt(id)
        }
        prevSeenIdsRef.current = current
    }, [actions])

    // ========================================================================
    // Ejecución de acciones (modal-confirm, toast-confirm, presupuesto-modal,
    // finalizar). Todos terminan acá: executePut hace la llamada al backend.
    // ========================================================================

    async function executePut(order, action, presupuestoText) {
        setSubmitting(order.order_id)
        try {
            if (action.finalizar) {
                // PUT /orders/finalizar/:id — el backend setea state_id,
                // users_id=18, returned_at y state_changed_at.
                await axios.put(`${SERVER}/orders/finalizar/${order.order_id}`)
            } else {
                // Si la acción incluye texto de presupuesto, lo grabamos
                // ANTES de cambiar el estado: si el PUT falla, al menos
                // queda traza del intento. El message endpoint setea
                // created_at server-side.
                if (presupuestoText) {
                    // Mount real es /api/orders/messages (ver index.js:52).
                    await axios.post(`${SERVER}/orders/messages`, {
                        username,
                        message: `${action.presupuestoPrefix}: ${presupuestoText}`,
                        orderId: order.order_id,
                    })
                }
                // Resolver state_id por nombre. `reset: true` usa el id del
                // estado actual del order — el backend igual bumpea
                // state_changed_at.
                const newStateId = action.reset
                    ? order.state_id ?? order.idstates
                    : findStateIdByName(states, action.target)
                if (!newStateId) {
                    alert(`No se encontró el estado "${action.target}" en el catálogo. Avisar al admin.`)
                    return
                }
                let newUsersId
                if (action.targetGroup) {
                    newUsersId = findGroupIdByName(grupos, action.targetGroup)
                    if (!newUsersId) {
                        alert(`No se encontró el grupo "${action.targetGroup}". Avisar al admin.`)
                        return
                    }
                }
                // Acción "mismo estado" → escalón de re-alerta. Transición a
                // otro estado → opts vacío → backend resetea realert_count=0 +
                // realert_until=NULL (no silencio en estado nuevo).
                const realertOpts = action.reset
                    ? computeRealert(order.state, order.realert_count)
                    : {}
                const payload = buildUpdatePayload(order, newStateId, newUsersId, realertOpts)
                await axios.put(`${SERVER}/orders/${order.order_id}`, payload)
                // Al enviar presupuesto abrimos la orden en otra pestaña para
                // que el operador pueda usar el link de WhatsApp del cliente
                // sin perder la grilla del home.
                if (action.presupuestoPrefix === 'PRESUPUESTO') {
                    window.open(`/messages/${order.order_id}`, '_blank', 'noopener,noreferrer')
                }
            }
            await refreshOrders()
        } catch (error) {
            const msg = error?.response?.data?.message || error?.response?.data || error.message
            alert(`No se pudo actualizar la orden: ${typeof msg === 'string' ? msg : 'error desconocido'}`)
        } finally {
            setSubmitting(null)
        }
    }

    async function handleAction(order, action) {
        // Pre-check INCUCAI: si la orden tiene repuestos asignados, no se
        // puede enviar a INCUCAI (mismo bloqueo está en backend como safety
        // net, pero acá evitamos UI rara — toast de 5s que termina en error).
        if (action.target === 'INCUCAI') {
            try {
                const res = await axios.get(`${SERVER}/reduceStock/${order.order_id}`)
                const repuestos = (res.data || []).filter(r => r.orderid === order.order_id)
                if (repuestos.length > 0) {
                    alert(`No se puede enviar a INCUCAI: la orden tiene ${repuestos.length} repuesto(s) asignado(s). Retirá los repuestos antes de continuar.`)
                    return
                }
            } catch (err) {
                // Si /reduceStock falla por algún motivo, dejamos pasar — el
                // backend tiene el bloqueo y devolverá el error correcto.
                console.error('Pre-check de repuestos falló, delego al backend:', err?.message)
            }
        }
        if (action.kind === 'presupuesto') {
            setPresupuestoModal({ order, action })
            return
        }
        if (action.kind === 'modal') {
            setConfirmModal({ order, action })
            return
        }
        if (action.kind === 'navigate') {
            // Acciones que delegan a otra pantalla — sin POST acá. El
            // action.targetPath puede terminar en '/' (le appendamos el
            // order_id) o ser una URL fija.
            const path = action.targetPath?.endsWith('/')
                ? `${action.targetPath}${order.order_id}`
                : action.targetPath
            if (path) navigate(path)
            return
        }
        // kind 'toast' (y finalizar también va por toast): apilamos un toast
        // con timer interno. Si el usuario no toca Deshacer en 5s, executePut.
        const id = ++toastIdRef.current
        const subtitle = `Orden #${order.order_id} — ${order.name} ${order.surname}`
        setToasts(prev => [...prev, { id, order, action, title: action.label, subtitle }])
    }

    function dismissToast(id) {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    function fireToast(id) {
        const toast = toasts.find(t => t.id === id)
        dismissToast(id)
        if (toast) executePut(toast.order, toast.action)
    }

    function confirmPresupuesto(text) {
        const { order, action } = presupuestoModal
        setPresupuestoModal(null)
        executePut(order, action, text)
    }

    function confirmConfirmModal() {
        const { order, action } = confirmModal
        setConfirmModal(null)
        executePut(order, action)
    }

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <div className='bg-gray-300 min-h-screen'>
            <MainNavBar />
            <div className='mt-2 w-full md:w-5/6 mx-auto bg-white px-4 py-4 md:py-8 shadow-lg'>
                <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2'>
                    <div>
                        <h1 className='text-3xl'>{username}</h1>
                        <p className='text-sm text-gray-600'>Atención al cliente — Belgrano</p>
                    </div>
                    <div className='flex gap-2 flex-wrap'>
                        {(grupoId === 14 || permisos.includes('Administrador')) && (
                            <button
                                className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded'
                                onClick={() => window.open('/lista-precios.html', '_blank')}>
                                Crear lista de precios
                            </button>
                        )}
                        {permisos.includes('ManipularOrdenes') && (
                            <button
                                className='bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded'
                                onClick={() => navigate('/orders')}>
                                Agregar orden
                            </button>
                        )}
                    </div>
                </div>

                {/* === Acciones para hacer ahora — órdenes + tareas due intercaladas === */}
                <section className='mb-8'>
                    <div className='flex justify-between items-center mb-2'>
                        <h2 className='text-xl font-bold'>Acciones para hacer ahora</h2>
                        <span className={`px-2 py-1 rounded text-white font-bold ${(actions.length + dueTasks.length) > 0 ? 'bg-red-500' : 'bg-gray-400'}`}>
                            {actions.length + dueTasks.length}
                        </span>
                    </div>
                    {(actions.length + dueTasks.length) === 0 ? (
                        <p className='text-gray-600 italic py-3'>No hay acciones pendientes.</p>
                    ) : (
                        <ActionTable
                            orders={actions}
                            tasks={dueTasks}
                            navigate={navigate}
                            submitting={submitting}
                            onAction={handleAction}
                            onTaskComplete={completeTaskInstance}
                            onTaskPostpone={postponeTaskInstance}
                            showOverdueBadge />
                    )}
                </section>

                {/* === Esperando === */}
                <section className='mb-8'>
                    <div className='flex justify-between items-center mb-2'>
                        <h2 className='text-xl font-bold'>Esperando</h2>
                        <span className='px-2 py-1 rounded bg-blue-400 text-white font-bold'>{waiting.length}</span>
                    </div>
                    {waiting.length === 0 ? (
                        <p className='text-gray-600 italic py-3'>No hay órdenes en espera.</p>
                    ) : (
                        <ActionTable
                            orders={waiting}
                            navigate={navigate}
                            submitting={submitting}
                            onAction={handleAction} />
                    )}
                </section>

                {/* === Tareas del día (futuras) ===
                    Las due ya están intercaladas arriba — TasksSection con
                    hideDue sólo renderea las upcoming. */}
                <TasksSection hideDue />
            </div>

            <PresupuestoModal
                open={!!presupuestoModal}
                order={presupuestoModal?.order}
                action={presupuestoModal?.action}
                onClose={() => setPresupuestoModal(null)}
                onConfirm={confirmPresupuesto} />
            <ConfirmModal
                open={!!confirmModal}
                order={confirmModal?.order}
                action={confirmModal?.action}
                onClose={() => setConfirmModal(null)}
                onConfirm={confirmConfirmModal} />
            <ToastStack toasts={toasts} onUndo={dismissToast} onFire={fireToast} />
        </div>
    )
}

// ============================================================================
// Tabla compartida entre "Acciones ahora" y "Esperando".
//   - showOverdueBadge marca con un badge rojo las filas que llegaron a
//     "Acciones ahora" por vencimiento (no por estado always-action).
//   - tasks (opcional): task_instances DUE para intercalar con las órdenes.
//     Cada task render como una <tr> con colSpan=8, fondo azulado y un
//     badge "TAREA" para distinguirla a la vista. El orden mezclado sale
//     por anchor time: para órdenes seenAt (cuándo entró a "Acciones");
//     para tareas effectiveMs (postponed_until ?? scheduled_for).
// ============================================================================
function ActionTable({
    orders, tasks = [], navigate, submitting, onAction,
    onTaskComplete, onTaskPostpone,
    showOverdueBadge = false,
}) {
    const merged = useMemo(() => {
        const orderItems = orders.map(o => ({
            kind: 'order',
            key: `o-${o.order_id}`,
            anchor: readSeenAt(o.order_id) ?? Date.now(),
            data: o,
        }))
        const taskItems = tasks.map(t => ({
            kind: 'task',
            key: `t-${t.id}`,
            anchor: effectiveMs(t),
            data: t,
        }))
        return [...orderItems, ...taskItems].sort((a, b) => a.anchor - b.anchor)
    }, [orders, tasks])

    return (
        <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
                <thead>
                    <tr className='bg-lime-400'>
                        <th className='border px-2 py-1'>#</th>
                        <th className='border px-2 py-1'>Cliente</th>
                        <th className='border px-2 py-1'>Modelo</th>
                        <th className='border px-2 py-1'>Problema</th>
                        <th className='border px-2 py-1'>Estado</th>
                        <th className='border px-2 py-1'>En estado</th>
                        <th className='border px-2 py-1'>Vence</th>
                        <th className='border px-2 py-1'>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {merged.map(item => {
                        if (item.kind === 'task') {
                            return <TaskActionRow key={item.key} instance={item.data}
                                onComplete={onTaskComplete} onPostpone={onTaskPostpone} />
                        }
                        const order = item.data
                        const dInState = daysInCurrentState(order)
                        const overdue = daysOverdue(order)
                        const remaining = daysUntilDeadline(order)
                        const isSubmitting = submitting === order.order_id
                        // Barra de progreso: minutos desde que la orden ENTRÓ
                        // a "Acciones ahora" (no desde state_changed_at, que
                        // suele ser de hace días). El anchor lo persiste el
                        // useEffect del padre en localStorage; acá leemos —
                        // si no existe (fallback), arrancamos verde recién
                        // pintado.
                        const seenAt = readSeenAt(order.order_id) ?? Date.now()
                        const mins = Math.max(0, (Date.now() - seenAt) / 60000)
                        let barColor = 'bg-green-500'
                        let barPct = Math.min(100, (mins / 30) * 100)
                        if (mins >= 50) { barColor = 'bg-red-500'; barPct = 100 }
                        else if (mins >= 30) { barColor = 'bg-yellow-500'; barPct = Math.min(100, ((mins - 30) / 20) * 100) }
                        return (
                            <React.Fragment key={item.key}>
                                <tr className='hover:bg-gray-50'>
                                    <td className='border px-2 py-2 text-center cursor-pointer'
                                        onClick={() => window.open(`/messages/${order.order_id}`, '_blank')}>
                                        {order.order_id}
                                    </td>
                                    <td className='border px-2 py-2 cursor-pointer'
                                        onClick={() => window.open(`/messages/${order.order_id}`, '_blank')}>
                                        {order.name} {order.surname}
                                    </td>
                                    <td className='border px-2 py-2 cursor-pointer'
                                        onClick={() => window.open(`/messages/${order.order_id}`, '_blank')}>
                                        {order.brand} {order.type} {order.model}
                                    </td>
                                    <td className='border px-2 py-2'>{order.problem}</td>
                                    <td className='border px-2 py-2 text-center'>
                                        <div className='flex flex-col items-center gap-1'>
                                            <span>{order.state}</span>
                                            {showOverdueBadge && overdue !== null && (
                                                <span className='inline-block bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded'>
                                                    Vencido hace {formatDuration(overdue)}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className='border px-2 py-2 text-center'>{formatDuration(dInState)}</td>
                                    <td className='border px-2 py-2 text-center'>
                                        {remaining === null
                                            ? '—'
                                            : remaining <= 0
                                                ? <span className='text-red-700 font-bold'>vencido</span>
                                                : `en ${formatDuration(remaining)}`}
                                    </td>
                                    <td className='border px-2 py-2'>
                                        <RowActions order={order} isSubmitting={isSubmitting} onAction={onAction} />
                                    </td>
                                </tr>
                                {showOverdueBadge && (
                                    <tr>
                                        <td colSpan='8' className='p-0 border-0'>
                                            <div className='h-1.5 bg-gray-200'>
                                                <div className={`h-1.5 ${barColor} transition-all`} style={{ width: `${barPct}%` }} />
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

// ============================================================================
// TaskActionRow — fila estilo task en la tabla mezclada. Usa colSpan=8
// para ocupar todo el ancho con un layout flex propio, fondo azulado y
// badge "TAREA" para distinguirla a la vista de las filas de órdenes.
// Acciones inline: ✓ OK + ⏰ Postergar (sólo si can_postpone=1).
// ============================================================================
const POSTPONE_OPTIONS = [
    { label: '30 min', minutes: 30 },
    { label: '2 horas', minutes: 120 },
    { label: '24 horas', minutes: 1440 },
]
function formatTaskTime(s) {
    if (!s) return ''
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/)
    if (!m) return ''
    return `${Number(m[3])}/${Number(m[2])} ${m[4]}:${m[5]}`
}
function TaskActionRow({ instance, onComplete, onPostpone }) {
    const [postponeOpen, setPostponeOpen] = useState(false)
    const [working, setWorking] = useState(false)
    async function complete() {
        if (working) return
        setWorking(true)
        await onComplete(instance)
        setWorking(false)
    }
    async function postpone(minutes) {
        if (working) return
        setWorking(true)
        setPostponeOpen(false)
        await onPostpone(instance, minutes)
        setWorking(false)
    }
    const timeStr = formatTaskTime(instance.postponed_until ?? instance.scheduled_for)
    return (
        <tr className='bg-blue-50 hover:bg-blue-100'>
            <td colSpan='8' className='border px-2 py-2'>
                <div className='flex justify-between items-start gap-3'>
                    <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 flex-wrap'>
                            <span className='inline-block bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded'>TAREA</span>
                            <span className='font-semibold'>{instance.title}</span>
                            <span className='text-xs text-gray-500'>{timeStr}</span>
                            {instance.postpone_count > 0 && (
                                <span className='text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded'>
                                    Postergada {instance.postpone_count}x
                                </span>
                            )}
                        </div>
                        {instance.description && (
                            <p className='text-xs text-gray-700 mt-1 line-clamp-2'>{instance.description}</p>
                        )}
                    </div>
                    <div className='flex gap-1 items-start'>
                        <button type='button' disabled={working}
                            className={`px-3 py-1 rounded text-sm font-semibold text-white ${working ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                            onClick={complete}>
                            ✓ OK
                        </button>
                        {instance.can_postpone === 1 && (
                            <div className='relative'>
                                <button type='button' disabled={working}
                                    className={`px-3 py-1 rounded text-sm font-semibold ${working ? 'bg-gray-100 text-gray-400' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'}`}
                                    onClick={() => setPostponeOpen(p => !p)}>
                                    ⏰ Postergar
                                </button>
                                {postponeOpen && (
                                    <div className='absolute right-0 mt-1 bg-white border shadow-lg rounded z-10 min-w-[120px]'>
                                        {POSTPONE_OPTIONS.map(opt => (
                                            <button key={opt.minutes} type='button'
                                                className='block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100'
                                                onClick={() => postpone(opt.minutes)}>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </td>
        </tr>
    )
}

export default HomeAtencion
