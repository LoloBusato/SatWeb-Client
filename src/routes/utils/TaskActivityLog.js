import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import SERVER from '../server'

// Feed de actividad de tareas para el panel admin. Trae las últimas
// N días de task_instances de un grupo y las renderea por día con
// emoji según el status. Backend hace el cleanup de las viejas
// (>5d completed/postponed) en el cron diario.

const DAYS = 5

function parseSched(s) {
    const m = String(s ?? '').match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/)
    if (!m) return null
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]))
}

function formatHHmm(d) {
    if (!d) return '--:--'
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
function formatDayHeader(d) {
    if (!d) return ''
    return `${DAY_NAMES[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
}

function postponeLabel(minutes) {
    if (minutes == null) return ''
    if (minutes >= 1440 && minutes % 1440 === 0) return `${minutes / 1440} día${minutes / 1440 > 1 ? 's' : ''}`
    if (minutes >= 60) {
        const h = Math.round(minutes / 60)
        return `${h}h${h > 1 ? 's' : ''}`
    }
    return `${minutes}min`
}

function TaskActivityLog({ groupId }) {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!groupId) return
        setLoading(true)
        axios.get(`${SERVER}/task-instances/log`, { params: { group_id: groupId, days: DAYS } })
            .then(r => setItems(r.data || []))
            .catch(e => { console.error(e); setItems([]) })
            .finally(() => setLoading(false))
    }, [groupId])

    // Dedupe: para tareas for_each_user=0, todas las filas del mismo
    // (task_id, scheduled_for) son la misma "ocurrencia" (se completan
    // juntas). Quedarnos con una sola — la que tenga estado más
    // informativo (completed > postponed > pending).
    const events = useMemo(() => {
        const STATUS_RANK = { completed: 3, postponed: 2, pending: 1 }
        const map = new Map()
        for (const r of items) {
            const key = r.for_each_user === 1
                ? `${r.task_id}|${r.scheduled_for}|${r.assigned_to_user_id}`
                : `${r.task_id}|${r.scheduled_for}`
            const prev = map.get(key)
            if (!prev || (STATUS_RANK[r.status] || 0) > (STATUS_RANK[prev.status] || 0)) {
                map.set(key, r)
            }
        }
        return Array.from(map.values()).sort((a, b) => {
            const da = parseSched(a.scheduled_for)?.getTime() ?? 0
            const db = parseSched(b.scheduled_for)?.getTime() ?? 0
            return db - da
        })
    }, [items])

    // Agrupar por día (DESC). Cada grupo tiene su header.
    const groupedByDay = useMemo(() => {
        const groups = []
        let lastKey = null
        for (const ev of events) {
            const d = parseSched(ev.scheduled_for)
            const key = d ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` : 'invalid'
            if (key !== lastKey) {
                groups.push({ key, date: d, items: [] })
                lastKey = key
            }
            groups[groups.length - 1].items.push(ev)
        }
        return groups
    }, [events])

    return (
        <section className='mt-4 bg-gray-50 border rounded p-3'>
            <h3 className='text-sm font-bold text-gray-700 mb-2'>
                📋 Actividad de tareas <span className='text-xs font-normal text-gray-500'>(últimos {DAYS} días)</span>
            </h3>
            {loading && <p className='text-xs text-gray-500 italic'>Cargando...</p>}
            {!loading && groupedByDay.length === 0 && (
                <p className='text-xs text-gray-500 italic'>Sin actividad registrada esta semana.</p>
            )}
            {groupedByDay.map(g => (
                <div key={g.key} className='mb-2'>
                    <div className='text-xs font-semibold text-gray-600 border-b border-gray-200 mb-1'>
                        ── {formatDayHeader(g.date)} ──
                    </div>
                    {g.items.map(ev => {
                        const d = parseSched(ev.scheduled_for)
                        const hhmm = formatHHmm(d)
                        if (ev.status === 'completed') {
                            return (
                                <div key={ev.id} className='text-xs text-gray-700 py-0.5'>
                                    <span className='font-mono text-gray-500 mr-2'>{hhmm}</span>
                                    <span>— {ev.username ?? '?'} completó '<b>{ev.title}</b>' ✅</span>
                                </div>
                            )
                        }
                        if (ev.status === 'postponed') {
                            return (
                                <div key={ev.id} className='text-xs text-amber-800 py-0.5'>
                                    <span className='font-mono text-gray-500 mr-2'>{hhmm}</span>
                                    <span>— {ev.username ?? '?'} postergó '<b>{ev.title}</b>'
                                        {ev.postpone_count > 1 ? ` (${ev.postpone_count}x)` : ''} ⏰</span>
                                </div>
                            )
                        }
                        return (
                            <div key={ev.id} className='text-xs text-gray-600 py-0.5'>
                                <span className='font-mono text-gray-500 mr-2'>{hhmm}</span>
                                <span>— '<b>{ev.title}</b>' ⏳ <span className='italic'>pendiente</span></span>
                            </div>
                        )
                    })}
                </div>
            ))}
        </section>
    )
}

export default TaskActivityLog
