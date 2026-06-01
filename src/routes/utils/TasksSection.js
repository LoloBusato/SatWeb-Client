import React, { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import SERVER from '../server'

// TasksSection — bloque de "Tareas del día" reutilizable en los homes.
// Polea cada 60s task-instances/pending filtradas por usuario + grupo del
// localStorage. Botones OK (complete) y Postergar (30m / 2h / 24h).
//
// Las tareas no postergables (can_postpone=0) solo muestran botón OK.

const POLL_MS = 60 * 1000
const POSTPONE_OPTIONS = [
    { label: '30 min', minutes: 30 },
    { label: '2 horas', minutes: 120 },
    { label: '24 horas', minutes: 1440 },
]

function formatScheduled(s) {
    if (!s) return ''
    // s viene como ISO "YYYY-MM-DDTHH:MM:SS.000Z" — esa Z es engañosa
    // (wall-clock AR), igual que para state_changed_at. Mostramos el
    // prefijo literal.
    const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/)
    if (!m) return ''
    return `${Number(m[3])}/${Number(m[2])} ${m[4]}:${m[5]}`
}

function TaskRow({ instance, onCompleted }) {
    const [expanded, setExpanded] = useState(false)
    const [postponeOpen, setPostponeOpen] = useState(false)
    const [working, setWorking] = useState(false)
    const userId = JSON.parse(localStorage.getItem('userId') ?? 'null')

    const overdue = (() => {
        const m = String(instance.scheduled_for ?? '').match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):?(\d{2})?/)
        if (!m) return false
        const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0))
        return d.getTime() < Date.now() - 5 * 60 * 1000
    })()

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

    return (
        <div className={`border rounded mb-2 p-3 ${overdue ? 'bg-red-50 border-red-300' : 'bg-white border-gray-200'}`}>
            <div className='flex justify-between items-start gap-3'>
                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                        <span className='font-semibold'>{instance.title}</span>
                        <span className='text-xs text-gray-500'>{formatScheduled(instance.scheduled_for)}</span>
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
        </div>
    )
}

function TasksSection() {
    const [instances, setInstances] = useState([])
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
        // Refresh cuando useTaskNotifier emite — comparte el ciclo.
        function handler() { refresh() }
        window.addEventListener('satweb:nuevas-tareas', handler)
        return () => {
            mountedRef.current = false
            clearInterval(t)
            window.removeEventListener('satweb:nuevas-tareas', handler)
        }
    }, [refresh])

    // Orden: vencidas primero, luego próximas; secundario por scheduled_for asc.
    const sorted = [...instances].sort((a, b) => {
        const ta = new Date(a.scheduled_for).getTime()
        const tb = new Date(b.scheduled_for).getTime()
        return ta - tb
    })

    return (
        <section className='mb-4'>
            <div className='flex items-center justify-between mb-2'>
                <h2 className='text-xl font-bold'>Tareas del día</h2>
                <span className={`px-2 py-1 rounded text-white text-sm font-bold ${sorted.length > 0 ? 'bg-blue-500' : 'bg-gray-400'}`}>
                    {sorted.length}
                </span>
            </div>
            {sorted.length === 0 ? (
                <p className='text-gray-600 italic py-2'>No hay tareas pendientes.</p>
            ) : (
                <div>
                    {sorted.map(inst => (
                        <TaskRow key={inst.id} instance={inst} onCompleted={refresh} />
                    ))}
                </div>
            )}
        </section>
    )
}

export default TasksSection
