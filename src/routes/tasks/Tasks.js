import React, { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import MainNavBar from '../orders/MainNavBar'
import SERVER from '../server'

// Panel admin de tareas (/tasks). Gate por permisos.Administrador en el
// caller. Layout dual: tab "Tareas activas" con tabla limpia + tab
// "Historial" con feed inline por tarea. Formulario en modal centrado.

const REPEAT_OPTIONS = [
    { value: 'none', label: 'No se repite' },
    { value: 'daily', label: 'Diaria' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'biweekly', label: 'Quincenal' },
    { value: 'monthly', label: 'Mensual' },
]
const DAYS_OF_WEEK = [
    { value: 0, label: 'Domingo', short: 'Dom' },
    { value: 1, label: 'Lunes', short: 'Lun' },
    { value: 2, label: 'Martes', short: 'Mar' },
    { value: 3, label: 'Miércoles', short: 'Mié' },
    { value: 4, label: 'Jueves', short: 'Jue' },
    { value: 5, label: 'Viernes', short: 'Vie' },
    { value: 6, label: 'Sábado', short: 'Sáb' },
]

function emptyForm() {
    const now = new Date()
    return {
        title: '', description: '',
        assigned_to_group_id: '',
        for_each_user: false, can_postpone: true,
        repeat_type: 'none', repeat_time: '09:00',
        repeat_day_of_week: 1, repeat_day_of_month: 1,
        is_random_time: false, random_time_from: '12:00', random_time_to: '19:00',
        starts_at: new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    }
}

// ============================================================================
// Modal de formulario — overlay con backdrop semitransparente + card centrada.
// ============================================================================
function TaskFormModal({ initial, grupos, onSubmit, onClose }) {
    const [form, setForm] = useState(initial ?? emptyForm())
    function set(k, v) { setForm(prev => ({ ...prev, [k]: v })) }

    function submit(e) {
        e.preventDefault()
        if (!form.title.trim()) return alert('Título requerido')
        if (!form.assigned_to_group_id) return alert('Asignar a un grupo')
        const payload = {
            title: form.title.trim(),
            description: form.description.trim() || null,
            assigned_to_group_id: Number(form.assigned_to_group_id),
            assigned_to_user_id: null,
            for_each_user: form.for_each_user ? 1 : 0,
            can_postpone: form.can_postpone ? 1 : 0,
            repeat_type: form.repeat_type,
            repeat_time: form.repeat_type !== 'none' && !form.is_random_time ? `${form.repeat_time}:00` : null,
            repeat_day_of_week: (form.repeat_type === 'weekly' || form.repeat_type === 'biweekly') ? Number(form.repeat_day_of_week) : null,
            repeat_day_of_month: form.repeat_type === 'monthly' ? Number(form.repeat_day_of_month) : null,
            is_random_time: form.is_random_time ? 1 : 0,
            random_time_from: form.is_random_time ? `${form.random_time_from}:00` : null,
            random_time_to: form.is_random_time ? `${form.random_time_to}:00` : null,
            starts_at: form.starts_at.replace('T', ' ') + ':00',
            created_by: JSON.parse(localStorage.getItem('userId') ?? 'null'),
        }
        onSubmit(payload)
    }

    const inp = 'shadow-sm border border-gray-300 rounded-lg h-10 box-border px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent'
    const labelCls = 'block text-sm font-semibold text-gray-700 mb-1'

    return (
        <div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'
            onClick={onClose}>
            <form onSubmit={submit}
                onClick={(e) => e.stopPropagation()}
                className='bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
                <div className='flex justify-between items-center px-6 py-4 border-b border-gray-200'>
                    <h2 className='text-xl font-bold text-gray-800'>
                        {initial ? 'Editar tarea' : 'Nueva tarea'}
                    </h2>
                    <button type='button' onClick={onClose}
                        className='text-gray-400 hover:text-gray-700 text-2xl leading-none'>×</button>
                </div>

                <div className='px-6 py-4 space-y-4'>
                    <div>
                        <label className={labelCls}>Título *</label>
                        <input className={`${inp} w-full`} value={form.title}
                            onChange={e => set('title', e.target.value)} required
                            placeholder='Ej: Barrer atención al cliente' />
                    </div>
                    <div>
                        <label className={labelCls}>Descripción</label>
                        <textarea className='shadow-sm border border-gray-300 rounded-lg w-full px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent'
                            rows='3' value={form.description}
                            onChange={e => set('description', e.target.value)}
                            placeholder='Detalle de lo que hay que hacer (opcional)' />
                    </div>
                    <div>
                        <label className={labelCls}>Asignar a grupo *</label>
                        <select className={`${inp} w-full`}
                            value={form.assigned_to_group_id}
                            onChange={e => set('assigned_to_group_id', e.target.value)}
                            required>
                            <option value=''>— Elegí un grupo —</option>
                            {grupos.map(g => (
                                <option key={g.idgrupousuarios} value={g.idgrupousuarios}>{g.grupo}</option>
                            ))}
                        </select>
                    </div>
                    <label className='flex items-start gap-2 cursor-pointer'>
                        <input type='checkbox' className='mt-1 h-4 w-4'
                            checked={form.for_each_user}
                            onChange={e => set('for_each_user', e.target.checked)} />
                        <span className='text-sm text-gray-700'>
                            <span className='font-semibold'>Tarea individual por miembro</span>
                            <span className='block text-xs text-gray-500'>Cada usuario del grupo tiene que completar su propia copia (sino completar una limpia para todos).</span>
                        </span>
                    </label>
                    <label className='flex items-start gap-2 cursor-pointer'>
                        <input type='checkbox' className='mt-1 h-4 w-4'
                            checked={form.can_postpone}
                            onChange={e => set('can_postpone', e.target.checked)} />
                        <span className='text-sm text-gray-700'>
                            <span className='font-semibold'>Se puede postergar</span>
                            <span className='block text-xs text-gray-500'>Si no, sólo se muestra el botón OK (sin "30 min / 2 hs / 24 hs").</span>
                        </span>
                    </label>

                    <div className='border-t border-gray-200 pt-4'>
                        <label className={labelCls}>Repetición</label>
                        <select className={`${inp} w-full`} value={form.repeat_type}
                            onChange={e => set('repeat_type', e.target.value)}>
                            {REPEAT_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                    {form.repeat_type !== 'none' && (
                        <>
                            {(form.repeat_type === 'weekly' || form.repeat_type === 'biweekly') && (
                                <div>
                                    <label className={labelCls}>Día de la semana</label>
                                    <select className={`${inp} w-full`}
                                        value={form.repeat_day_of_week}
                                        onChange={e => set('repeat_day_of_week', e.target.value)}>
                                        {DAYS_OF_WEEK.map(d => (
                                            <option key={d.value} value={d.value}>{d.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {form.repeat_type === 'monthly' && (
                                <div>
                                    <label className={labelCls}>Día del mes</label>
                                    <input type='number' min='1' max='31' className={`${inp} w-full`}
                                        value={form.repeat_day_of_month}
                                        onChange={e => set('repeat_day_of_month', e.target.value)} />
                                </div>
                            )}
                            <label className='flex items-start gap-2 cursor-pointer'>
                                <input type='checkbox' className='mt-1 h-4 w-4'
                                    checked={form.is_random_time}
                                    onChange={e => set('is_random_time', e.target.checked)} />
                                <span className='text-sm text-gray-700'>
                                    <span className='font-semibold'>Hora aleatoria dentro de una ventana</span>
                                    <span className='block text-xs text-gray-500'>Para tareas que no deben parecer un bot (difusiones, mensajes).</span>
                                </span>
                            </label>
                            {!form.is_random_time ? (
                                <div>
                                    <label className={labelCls}>Hora</label>
                                    <input type='time' className={`${inp} w-full max-w-xs`}
                                        value={form.repeat_time}
                                        onChange={e => set('repeat_time', e.target.value)} />
                                </div>
                            ) : (
                                <div className='flex gap-3'>
                                    <div className='flex-1'>
                                        <label className={labelCls}>Desde</label>
                                        <input type='time' className={`${inp} w-full`}
                                            value={form.random_time_from}
                                            onChange={e => set('random_time_from', e.target.value)} />
                                    </div>
                                    <div className='flex-1'>
                                        <label className={labelCls}>Hasta</label>
                                        <input type='time' className={`${inp} w-full`}
                                            value={form.random_time_to}
                                            onChange={e => set('random_time_to', e.target.value)} />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div>
                        <label className={labelCls}>Fecha y hora de inicio *</label>
                        <input type='datetime-local' className={`${inp} w-full max-w-sm`}
                            value={form.starts_at}
                            onChange={e => set('starts_at', e.target.value)} required />
                        <p className='text-xs text-gray-500 mt-1'>
                            La primera ocurrencia se genera desde esta fecha. Para repetidas, esto define cuándo arranca el ciclo.
                        </p>
                    </div>
                </div>

                <div className='px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 rounded-b-xl'>
                    <button type='button' onClick={onClose}
                        className='px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100'>
                        Cancelar
                    </button>
                    <button type='submit'
                        className='px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm'>
                        {initial ? 'Guardar cambios' : 'Crear tarea'}
                    </button>
                </div>
            </form>
        </div>
    )
}

// ============================================================================
// Helpers de display
// ============================================================================
function formatRepetition(task) {
    if (task.repeat_type === 'none') return 'Una sola vez'
    const time = task.is_random_time
        ? `${String(task.random_time_from || '').slice(0, 5)}–${String(task.random_time_to || '').slice(0, 5)}`
        : (task.repeat_time ? String(task.repeat_time).slice(0, 5) : '')
    const dow = DAYS_OF_WEEK.find(d => d.value === Number(task.repeat_day_of_week))?.short
    if (task.repeat_type === 'daily') return `Diaria · ${time}`
    if (task.repeat_type === 'weekly') return `Semanal · ${dow} · ${time}`
    if (task.repeat_type === 'biweekly') return `Quincenal · ${dow} · ${time}`
    if (task.repeat_type === 'monthly') return `Mensual · día ${task.repeat_day_of_month} · ${time}`
    return task.repeat_type
}

// Compute next occurrence date (local AR-ish — usa el calendario del runner).
// Para tareas random, devolvemos sólo el día (no la hora específica).
function nextOccurrence(task) {
    if (task.repeat_type === 'none') return new Date(task.starts_at)
    const now = new Date()
    const starts = new Date(task.starts_at)
    const time = task.is_random_time ? '12:00:00' : (task.repeat_time || '09:00:00')
    const [hh, mm, ss] = time.split(':').map(Number)

    // Helper para construir un Date en una fecha + hora
    function withTime(date) {
        const d = new Date(date)
        d.setHours(hh, mm, ss || 0, 0)
        return d
    }

    if (task.repeat_type === 'daily') {
        const today = withTime(now)
        return today > now ? today : withTime(new Date(now.getTime() + 24 * 3600 * 1000))
    }
    if (task.repeat_type === 'weekly' || task.repeat_type === 'biweekly') {
        const target = Number(task.repeat_day_of_week)
        const candidate = new Date(now)
        for (let i = 0; i < 14; i++) {
            if (candidate.getDay() === target) {
                const c = withTime(candidate)
                if (c >= now && c >= starts) {
                    if (task.repeat_type === 'weekly') return c
                    // biweekly: chequear paridad vs starts
                    const startsDay = new Date(starts); startsDay.setHours(0, 0, 0, 0)
                    const candDay = new Date(c); candDay.setHours(0, 0, 0, 0)
                    const diffWeeks = Math.floor((candDay - startsDay) / (7 * 24 * 3600 * 1000))
                    if (diffWeeks % 2 === 0) return c
                }
            }
            candidate.setDate(candidate.getDate() + 1)
        }
        return null
    }
    if (task.repeat_type === 'monthly') {
        const day = Number(task.repeat_day_of_month)
        const cand = withTime(new Date(now.getFullYear(), now.getMonth(), day))
        if (cand >= now) return cand
        return withTime(new Date(now.getFullYear(), now.getMonth() + 1, day))
    }
    return null
}

function formatNextOccurrence(date) {
    if (!date) return '—'
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const d = new Date(date); d.setHours(0, 0, 0, 0)
    const diffDays = Math.round((d - today) / (24 * 3600 * 1000))
    const hhmm = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    if (diffDays === 0) return `Hoy · ${hhmm}`
    if (diffDays === 1) return `Mañana · ${hhmm}`
    if (diffDays < 7) return `${DAYS_OF_WEEK[date.getDay()].short} · ${hhmm}`
    return `${date.getDate()}/${date.getMonth() + 1} · ${hhmm}`
}

// ============================================================================
// Panel de historial por tarea (expandible)
// ============================================================================
function HistoryPanel({ taskId }) {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    useEffect(() => {
        setLoading(true)
        axios.get(`${SERVER}/tasks/${taskId}/history`)
            .then(r => setItems(r.data || []))
            .catch(e => console.error(e))
            .finally(() => setLoading(false))
    }, [taskId])

    if (loading) return <p className='text-sm text-gray-500 italic px-4 py-3'>Cargando historial...</p>
    if (items.length === 0) return <p className='text-sm text-gray-500 italic px-4 py-3'>Sin historial.</p>

    return (
        <div className='px-4 py-3 space-y-1.5 max-h-72 overflow-y-auto'>
            {items.map(it => {
                const sched = String(it.scheduled_for).slice(0, 16).replace('T', ' ')
                const statusCls = it.status === 'completed' ? 'bg-green-100 text-green-700'
                    : it.status === 'postponed' ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-700'
                return (
                    <div key={it.id} className='text-xs flex items-center gap-2'>
                        <span className='font-mono text-gray-500 w-32'>{sched}</span>
                        <span className={`px-1.5 py-0.5 rounded font-semibold ${statusCls}`}>{it.status}</span>
                        {it.assigned_username && <span className='text-gray-600'>{it.assigned_username}</span>}
                        {it.completed_at && (
                            <span className='text-green-700'>· ✓ por {it.completed_username ?? '?'}</span>
                        )}
                        {it.postpone_count > 0 && (
                            <span className='text-amber-700'>· postergada {it.postpone_count}×</span>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ============================================================================
// Página principal
// ============================================================================
function Tasks() {
    const [tasks, setTasks] = useState([])
    const [grupos, setGrupos] = useState([])
    const [tab, setTab] = useState('activas')
    const [editing, setEditing] = useState(null)   // task | 'new' | null
    const [historyOpen, setHistoryOpen] = useState(null)

    const reload = useCallback(() => {
        axios.get(`${SERVER}/tasks`).then(r => setTasks(r.data || [])).catch(e => console.error(e))
    }, [])

    useEffect(() => {
        reload()
        axios.get(`${SERVER}/grupousuarios`).then(r => setGrupos(r.data || [])).catch(e => console.error(e))
    }, [reload])

    async function submit(payload) {
        try {
            if (editing && editing !== 'new' && editing.id) {
                await axios.put(`${SERVER}/tasks/${editing.id}`, payload)
            } else {
                await axios.post(`${SERVER}/tasks`, payload)
            }
            setEditing(null)
            reload()
        } catch (e) {
            console.error(e)
            alert('No se pudo guardar la tarea')
        }
    }

    async function remove(id) {
        if (!window.confirm('¿Eliminar esta tarea? Las instancias ya completadas se mantienen en el historial.')) return
        try {
            await axios.delete(`${SERVER}/tasks/${id}`)
            reload()
        } catch (e) { alert('No se pudo eliminar') }
    }

    function editInitial(t) {
        return {
            title: t.title ?? '',
            description: t.description ?? '',
            assigned_to_group_id: t.assigned_to_group_id ?? '',
            for_each_user: t.for_each_user === 1,
            can_postpone: t.can_postpone === 1,
            repeat_type: t.repeat_type ?? 'none',
            repeat_time: t.repeat_time ? String(t.repeat_time).slice(0, 5) : '09:00',
            repeat_day_of_week: t.repeat_day_of_week ?? 1,
            repeat_day_of_month: t.repeat_day_of_month ?? 1,
            is_random_time: t.is_random_time === 1,
            random_time_from: t.random_time_from ? String(t.random_time_from).slice(0, 5) : '12:00',
            random_time_to: t.random_time_to ? String(t.random_time_to).slice(0, 5) : '19:00',
            starts_at: t.starts_at
                ? String(t.starts_at).slice(0, 16).replace(' ', 'T')
                : new Date().toISOString().slice(0, 16),
        }
    }

    const sortedTasks = useMemo(() => {
        return [...tasks].sort((a, b) => {
            const na = nextOccurrence(a)?.getTime() ?? Infinity
            const nb = nextOccurrence(b)?.getTime() ?? Infinity
            return na - nb
        })
    }, [tasks])

    return (
        <div className='bg-gray-100 min-h-screen pb-8'>
            <MainNavBar />
            <div className='max-w-6xl mx-auto px-4 py-6'>
                {/* Header */}
                <div className='flex justify-between items-center mb-6'>
                    <div>
                        <h1 className='text-3xl font-bold text-gray-800'>Gestión de Tareas</h1>
                        <p className='text-sm text-gray-500 mt-1'>Programación recurrente para los grupos del sistema</p>
                    </div>
                    <button onClick={() => setEditing('new')}
                        className='bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md flex items-center gap-2'>
                        <span className='text-lg leading-none'>+</span> Nueva tarea
                    </button>
                </div>

                {/* Tabs */}
                <div className='flex border-b border-gray-300 mb-4'>
                    <button onClick={() => setTab('activas')}
                        className={`px-4 py-2 font-semibold border-b-2 -mb-px transition-colors ${tab === 'activas' ? 'border-blue-500 text-blue-700' : 'border-transparent text-gray-600 hover:text-blue-600'}`}>
                        Tareas activas
                        <span className='ml-2 text-xs bg-gray-200 text-gray-700 rounded px-2 py-0.5'>{tasks.length}</span>
                    </button>
                    <button onClick={() => setTab('historial')}
                        className={`px-4 py-2 font-semibold border-b-2 -mb-px transition-colors ${tab === 'historial' ? 'border-blue-500 text-blue-700' : 'border-transparent text-gray-600 hover:text-blue-600'}`}>
                        Historial
                    </button>
                </div>

                {/* Tab Activas */}
                {tab === 'activas' && (
                    <div className='bg-white rounded-xl shadow-md overflow-hidden'>
                        <table className='w-full text-sm'>
                            <thead className='bg-gray-50 border-b border-gray-200'>
                                <tr className='text-left text-xs text-gray-600 uppercase'>
                                    <th className='px-4 py-3'>Título</th>
                                    <th className='px-4 py-3'>Asignado a</th>
                                    <th className='px-4 py-3'>Repetición</th>
                                    <th className='px-4 py-3'>Próxima vez</th>
                                    <th className='px-4 py-3 text-right'>Acciones</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-gray-200'>
                                {sortedTasks.length === 0 && (
                                    <tr><td colSpan='5' className='px-4 py-8 text-center text-gray-500 italic'>
                                        No hay tareas configuradas. Tocá "+ Nueva tarea" para crear la primera.
                                    </td></tr>
                                )}
                                {sortedTasks.map(t => {
                                    const next = nextOccurrence(t)
                                    return (
                                        <React.Fragment key={t.id}>
                                            <tr className='hover:bg-gray-50'>
                                                <td className='px-4 py-3 font-semibold text-gray-800'>
                                                    {t.title}
                                                    {t.description && (
                                                        <p className='text-xs text-gray-500 font-normal mt-0.5 line-clamp-1'>{t.description}</p>
                                                    )}
                                                </td>
                                                <td className='px-4 py-3 text-gray-700'>
                                                    {t.group_name ?? '—'}
                                                    {t.for_each_user === 1 && (
                                                        <span className='ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded'>c/u</span>
                                                    )}
                                                </td>
                                                <td className='px-4 py-3 text-gray-700'>{formatRepetition(t)}</td>
                                                <td className='px-4 py-3 text-gray-700'>{formatNextOccurrence(next)}</td>
                                                <td className='px-4 py-3 text-right whitespace-nowrap'>
                                                    <button onClick={() => setEditing(t)}
                                                        className='text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold px-2.5 py-1 rounded-md mr-1'>
                                                        Editar
                                                    </button>
                                                    <button onClick={() => remove(t.id)}
                                                        className='text-xs bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-2.5 py-1 rounded-md'>
                                                        Eliminar
                                                    </button>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Tab Historial */}
                {tab === 'historial' && (
                    <div className='bg-white rounded-xl shadow-md divide-y divide-gray-200'>
                        {sortedTasks.length === 0 ? (
                            <p className='text-gray-500 italic px-4 py-8 text-center'>No hay tareas configuradas.</p>
                        ) : sortedTasks.map(t => (
                            <div key={t.id}>
                                <button type='button' onClick={() => setHistoryOpen(historyOpen === t.id ? null : t.id)}
                                    className='w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left'>
                                    <div>
                                        <div className='font-semibold text-gray-800'>{t.title}</div>
                                        <div className='text-xs text-gray-500'>{t.group_name ?? '—'} · {formatRepetition(t)}</div>
                                    </div>
                                    <span className='text-gray-400'>{historyOpen === t.id ? '▾' : '▸'}</span>
                                </button>
                                {historyOpen === t.id && (
                                    <div className='bg-gray-50 border-t border-gray-200'>
                                        <HistoryPanel taskId={t.id} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {editing && (
                <TaskFormModal
                    initial={editing === 'new' ? null : editInitial(editing)}
                    grupos={grupos}
                    onSubmit={submit}
                    onClose={() => setEditing(null)} />
            )}
        </div>
    )
}

export default Tasks
