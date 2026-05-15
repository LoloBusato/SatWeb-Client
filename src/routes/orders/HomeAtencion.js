import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from './MainNavBar'
import SERVER from '../server'
import {
    ACCIONES_POR_ESTADO,
    ATENCION_STATES,
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
} from './atencionWorkflow'

const ALERT_INTERVAL_MS = 30 * 60 * 1000
const TOAST_UNDO_MS = 5000

// Filtra órdenes que muestra Atención: por nombre del estado, no por
// users_id. Algunos estados re-asignan a Admin (SOLUCIONA ADMIN vía
// forces_admin_assignment) pero el flujo lo sigue manejando Atención.
function isAtencionOrder(o) {
    return ATENCION_STATES.has(o.state)
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

    // Alerta sonora: al cargar si hay acciones pendientes + cada 30 min.
    const pendingRef = useRef(0)
    pendingRef.current = actions.length
    useEffect(() => {
        if (actions.length > 0) playBeep()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [actions.length > 0])
    useEffect(() => {
        const interval = setInterval(() => {
            if (pendingRef.current > 0) playBeep()
        }, ALERT_INTERVAL_MS)
        return () => clearInterval(interval)
    }, [])

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
                const payload = buildUpdatePayload(order, newStateId, newUsersId)
                await axios.put(`${SERVER}/orders/${order.order_id}`, payload)
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

                {/* === Acciones para hacer ahora === */}
                <section className='mb-8'>
                    <div className='flex justify-between items-center mb-2'>
                        <h2 className='text-xl font-bold'>Acciones para hacer ahora</h2>
                        <span className={`px-2 py-1 rounded text-white font-bold ${actions.length > 0 ? 'bg-red-500' : 'bg-gray-400'}`}>
                            {actions.length}
                        </span>
                    </div>
                    {actions.length === 0 ? (
                        <p className='text-gray-600 italic py-3'>No hay acciones pendientes.</p>
                    ) : (
                        <ActionTable
                            orders={actions}
                            navigate={navigate}
                            submitting={submitting}
                            onAction={handleAction}
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

                {/* === Placeholder calendario === */}
                <section>
                    <h2 className='text-xl font-bold mb-2'>Tareas del día</h2>
                    <div className='border-2 border-dashed border-gray-400 rounded p-6 text-center text-gray-500'>
                        Tareas del día — próximamente
                    </div>
                </section>
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
// Tabla compartida entre "Acciones ahora" y "Esperando". Diferencia mínima:
// showOverdueBadge marca con un badge rojo las filas que llegaron a "Acciones
// ahora" por vencimiento (no por estado always-action).
// ============================================================================
function ActionTable({ orders, navigate, submitting, onAction, showOverdueBadge = false }) {
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
                    {orders.map(order => {
                        const dInState = daysInCurrentState(order)
                        const overdue = daysOverdue(order)
                        const remaining = daysUntilDeadline(order)
                        const isSubmitting = submitting === order.order_id
                        return (
                            <tr key={order.order_id} className='hover:bg-gray-50'>
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
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

export default HomeAtencion
