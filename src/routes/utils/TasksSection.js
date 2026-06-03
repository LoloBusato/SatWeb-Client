import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import axios from 'axios'
import SERVER from '../server'

// TasksSection — bloque dual de tareas reutilizable en los homes.
// Backend /pending devuelve TODAS las instancias no completadas del
// usuario. Acá las separamos en dos buckets según effectiveTime
// (postponed_until ?? scheduled_for) vs NOW:
//   - "Acciones para hacer ahora" (vencidas) → OK + Postergar
//   - "Tareas del día" (futuras)             → solo OK, apagado
// Polling 60s. La transición futuro→vencido la maneja useTaskNotifier
// con un snapshot separado para disparar la alarma.

const POLL_MS = 60 * 1000
const POSTPONE_OPTIONS = [
    { label: '30 min', minutes: 30 },
    { label: '2 horas', minutes: 120 },
    { label: '24 horas', minutes: 1440 },
]

// Parsea el datetime "YYYY-MM-DDTHH:MM:SS.000Z" como wall-clock literal
// (la Z es engañosa por convención del backend, igual que state_changed_at).
function parseScheduledMs(s) {
    if (!s) return null
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):?(\d{2})?/)
    if (!m) return null
    return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0)).getTime()
}

// Tiempo efectivo: postponed_until pisa scheduled_for cuando existe.
export function effectiveMs(inst) {
    return parseScheduledMs(inst.postponed_until) ?? parseScheduledMs(inst.scheduled_for) ?? 0
}

function formatScheduled(s) {
    if (!s) return ''
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/)
    if (!m) return ''
    return `${Number(m[3])}/${Number(m[2])} ${m[4]}:${m[5]}`
}

// upcoming=true → futura, apariencia apagada + sin botón Postergar.
function TaskRow({ instance, onCompleted, upcoming }) {
    const [expanded, setExpanded] = useState(false)
    const [postponeOpen, setPostponeOpen] = useState(false)
    const [working, setWorking] = useState(false)
    const userId = JSON.parse(localStorage.getItem('userId') ?? 'null')

    const overdueDeep = !upcoming && effectiveMs(instance) < Date.now() - 5 * 60 * 1000

    async function complete() {
        if (working) return
        setWorking(true)
        try {
            await axios.post(`${SERVER}/task-instances/${instance.id}/complete`, {
                completed_by: userId,
            })
            onCompleted()
        } catch (e) {
            alert('No se pudo completar la tarea')
            setWorking(false)
        }
    }

    async function postpone(minutes) {
        if (working) return
        setWorking(true)
        setPostponeOpen(false)
        try {
            await axios.post(`${SERVER}/task-instances/${instance.id}/postpone`, { minutes })
            onCompleted()
        } catch (e) {
            alert('No se pudo postergar')
            setWorking(false)
        }
    }

    const containerCls = upcoming
        ? 'bg-white border-gray-200 opacity-75'
        : (overdueDeep ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200')

    // En la sección de Acciones mostramos la hora original; en la de
    // futuras mostramos el postponed_until cuando aplica (más útil para
    // que el operador sepa cuándo va a subir).
    const timeLabel = upcoming
        ? formatScheduled(instance.postponed_until ?? instance.scheduled_for)
        : formatScheduled(instance.scheduled_for)

    return (
        <div className={`border rounded mb-2 p-3 ${containerCls}`}>
            <div className='flex justify-between items-start gap-3'>
                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 flex-wrap'>
                        <span className='font-semibold'>{instance.title}</span>
                        <span className='text-xs text-gray-500'>{timeLabel}</span>
                        {instance.postpone_count > 0 && (
                            <span className='text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded'>
                                Postergada {instance.postpone_count}x
                            </span>
                        )}
                    </div>
                    {instance.description && (
                        <button type='button'
                            className='text-xs text-blue-600 hover:text-blue-800 mt-1'
                            onClick={() => setExpanded(e => !e)}>
                            {expanded ? '▾ Ocultar detalle' : '▸ Ver detalle'}
                        </button>
                    )}
                    {expanded && instance.description && (
                        <p className='text-sm text-gray-700 mt-1 whitespace-pre-wrap'>{instance.description}</p>
                    )}
                </div>
                <div className='flex flex-col gap-1 items-end'>
                    <button type='button' disabled={working}
                        className={`px-3 py-1 rounded text-sm font-semibold text-white ${working ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                        onClick={complete}>
                        ✓ OK
                    </button>
                    {/* Postergar sólo en la sección vencidas (las futuras
                        no se pueden postergar antes de hora). */}
                    {!upcoming && instance.can_postpone === 1 && (
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
        </div>
    )
}

function TasksSection() {
    const [instances, setInstances] = useState([])
    const [tick, setTick] = useState(0)
    const userId = JSON.parse(localStorage.getItem('userId') ?? 'null')
    const mountedRef = useRef(true)

    const refresh = useCallback(async () => {
        if (!userId) return
        try {
            const r = await axios.get(`${SERVER}/task-instances/pending`, {
                params: { userId },
            })
            if (mountedRef.current) setInstances(r.data || [])
        } catch (e) {
            console.error('task-instances/pending', e)
        }
    }, [userId])

    useEffect(() => {
        mountedRef.current = true
        refresh()
        const t = setInterval(refresh, POLL_MS)
        // tick para re-renderizar la separación due/upcoming sin re-fetch:
        // una tarea futura cruza la hora y debe pasar a "Acciones ahora"
        // visualmente aunque la lista del backend no haya cambiado.
        const tickI = setInterval(() => setTick(t => t + 1), 30 * 1000)
        function handler() { refresh() }
        window.addEventListener('satweb:nuevas-tareas', handler)
        return () => {
            mountedRef.current = false
            clearInterval(t)
            clearInterval(tickI)
            window.removeEventListener('satweb:nuevas-tareas', handler)
        }
    }, [refresh])

    const { due, upcoming } = useMemo(() => {
        const now = Date.now()
        const d = [], u = []
        for (const inst of instances) {
            if (effectiveMs(inst) <= now) d.push(inst)
            else u.push(inst)
        }
        d.sort((a, b) => effectiveMs(a) - effectiveMs(b))
        u.sort((a, b) => effectiveMs(a) - effectiveMs(b))
        return { due: d, upcoming: u }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [instances, tick])

    return (
        <div className='mb-4'>
            {/* Acciones para hacer ahora */}
            <section className='mb-4'>
                <div className='flex items-center justify-between mb-2'>
                    <h2 className='text-xl font-bold'>Acciones para hacer ahora</h2>
                    <span className={`px-2 py-1 rounded text-white text-sm font-bold ${due.length > 0 ? 'bg-red-500' : 'bg-gray-400'}`}>
                        {due.length}
                    </span>
                </div>
                {due.length === 0 ? (
                    <p className='text-gray-600 italic py-2'>No hay acciones pendientes.</p>
                ) : (
                    <div>
                        {due.map(inst => (
                            <TaskRow key={inst.id} instance={inst} onCompleted={refresh} upcoming={false} />
                        ))}
                    </div>
                )}
            </section>

            {/* Tareas del día */}
            <section className='mb-4'>
                <div className='flex items-center justify-between mb-2'>
                    <h2 className='text-xl font-bold'>Tareas del día</h2>
                    <span className={`px-2 py-1 rounded text-white text-sm font-bold ${upcoming.length > 0 ? 'bg-blue-500' : 'bg-gray-400'}`}>
                        {upcoming.length}
                    </span>
                </div>
                {upcoming.length === 0 ? (
                    <p className='text-gray-600 italic py-2'>No hay tareas programadas.</p>
                ) : (
                    <div>
                        {upcoming.map(inst => (
                            <TaskRow key={inst.id} instance={inst} onCompleted={refresh} upcoming={true} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

export default TasksSection
