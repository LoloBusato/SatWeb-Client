import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import MainNavBar from '../orders/MainNavBar'
import SERVER from '../server'

// Panel admin de tareas. Lista + alta + edición + eliminación + historial.
// Gate por permisos.Administrador en el caller (link en MainNavBar).

const REPEAT_OPTIONS = [
    { value: 'none', label: 'No' },
    { value: 'daily', label: 'Diaria' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' },
]
const DAYS_OF_WEEK = [
    { value: 0, label: 'Dom' }, { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' }, { value: 3, label: 'Mié' },
    { value: 4, label: 'Jue' }, { value: 5, label: 'Vie' },
    { value: 6, label: 'Sáb' },
]

function emptyForm() {
    return {
        title: '', description: '',
        assigned_to_group_id: '', assigned_to_user_id: '',
        for_each_user: false, can_postpone: true,
        repeat_type: 'none', repeat_time: '09:00',
        repeat_day_of_week: 1, repeat_day_of_month: 1,
        starts_at: new Date().toISOString().slice(0, 16),
    }
}

function TaskForm({ initial, grupos, users, onSubmit, onCancel }) {
    const [form, setForm] = useState(initial ?? emptyForm())
    function set(k, v) { setForm(prev => ({ ...prev, [k]: v })) }
    function submit(e) {
        e.preventDefault()
        if (!form.title.trim()) return alert('Título requerido')
        if (!form.assigned_to_group_id && !form.assigned_to_user_id) {
            return alert('Asignar a un grupo o a un usuario')
        }
        const payload = {
            title: form.title.trim(),
            description: form.description.trim() || null,
            assigned_to_group_id: form.assigned_to_group_id ? Number(form.assigned_to_group_id) : null,
            assigned_to_user_id: form.assigned_to_user_id ? Number(form.assigned_to_user_id) : null,
            for_each_user: form.for_each_user ? 1 : 0,
            can_postpone: form.can_postpone ? 1 : 0,
            repeat_type: form.repeat_type,
            repeat_time: form.repeat_type !== 'none' ? `${form.repeat_time}:00` : null,
            repeat_day_of_week: form.repeat_type === 'weekly' ? Number(form.repeat_day_of_week) : null,
            repeat_day_of_month: form.repeat_type === 'monthly' ? Number(form.repeat_day_of_month) : null,
            // starts_at viene de <input type='datetime-local'> → 'YYYY-MM-DDTHH:MM' (local).
            // Lo mandamos como 'YYYY-MM-DD HH:MM:00' wall-clock AR.
            starts_at: form.starts_at.replace('T', ' ') + ':00',
            created_by: JSON.parse(localStorage.getItem('userId') ?? 'null'),
        }
        onSubmit(payload)
    }
    const inp = 'shadow border rounded h-10 box-border px-3 text-gray-700'
    return (
        <form onSubmit={submit} className='bg-blue-50 border p-3 rounded mb-4 space-y-2'>
            <div>
                <label className='block font-bold text-sm mb-1'>Título *</label>
                <input className={`${inp} w-full`} value={form.title}
                    onChange={e => set('title', e.target.value)} required />
            </div>
            <div>
                <label className='block font-bold text-sm mb-1'>Descripción</label>
                <textarea className='shadow border rounded w-full px-3 py-2 text-gray-700' rows='3'
                    value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div className='flex gap-2'>
                <div className='flex-1'>
                    <label className='block font-bold text-sm mb-1'>Asignar a grupo</label>
                    <select className={`${inp} w-full`} value={form.assigned_to_group_id}
                        onChange={e => set('assigned_to_group_id', e.target.value)}>
                        <option value=''>—</option>
                        {grupos.map(g => (
                            <option key={g.idgrupousuarios} value={g.idgrupousuarios}>{g.grupo}</option>
                        ))}
                    </select>
                </div>
                <div className='flex-1'>
                    <label className='block font-bold text-sm mb-1'>O usuario específico</label>
                    <select className={`${inp} w-full`} value={form.assigned_to_user_id}
                        onChange={e => set('assigned_to_user_id', e.target.value)}>
                        <option value=''>—</option>
                        {users.map(u => (
                            <option key={u.idusers} value={u.idusers}>{u.username}</option>
                        ))}
                    </select>
                </div>
            </div>
            {form.assigned_to_group_id && (
                <label className='flex items-center gap-2'>
                    <input type='checkbox' checked={form.for_each_user}
                        onChange={e => set('for_each_user', e.target.checked)} />
                    <span className='text-sm'>Crear tarea individual para cada miembro del grupo</span>
                </label>
            )}
            <label className='flex items-center gap-2'>
                <input type='checkbox' checked={form.can_postpone}
                    onChange={e => set('can_postpone', e.target.checked)} />
                <span className='text-sm'>Puede postergarse (si no, solo botón OK)</span>
            </label>
            <div className='flex gap-2'>
                <div className='flex-1'>
                    <label className='block font-bold text-sm mb-1'>Repetición</label>
                    <select className={`${inp} w-full`} value={form.repeat_type}
                        onChange={e => set('repeat_type', e.target.value)}>
                        {REPEAT_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
                {form.repeat_type !== 'none' && (
                    <div className='flex-1'>
                        <label className='block font-bold text-sm mb-1'>Hora</label>
                        <input type='time' className={`${inp} w-full`}
                            value={form.repeat_time}
                            onChange={e => set('repeat_time', e.target.value)} />
                    </div>
                )}
                {form.repeat_type === 'weekly' && (
                    <div className='flex-1'>
                        <label className='block font-bold text-sm mb-1'>Día semana</label>
                        <select className={`${inp} w-full`} value={form.repeat_day_of_week}
                            onChange={e => set('repeat_day_of_week', e.target.value)}>
                            {DAYS_OF_WEEK.map(d => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                        </select>
                    </div>
                )}
                {form.repeat_type === 'monthly' && (
                    <div className='flex-1'>
                        <label className='block font-bold text-sm mb-1'>Día mes</label>
                        <input type='number' min='1' max='31' className={`${inp} w-full`}
                            value={form.repeat_day_of_month}
                            onChange={e => set('repeat_day_of_month', e.target.value)} />
                    </div>
                )}
            </div>
            <div>
                <label className='block font-bold text-sm mb-1'>Fecha/hora de inicio *</label>
                <input type='datetime-local' className={`${inp} w-full`}
                    value={form.starts_at} onChange={e => set('starts_at', e.target.value)} required />
            </div>
            <div className='flex justify-end gap-2'>
                <button type='button' onClick={onCancel}
                    className='bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded'>
                    Cancelar
                </button>
                <button type='submit'
                    className='bg-blue-500 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded'>
                    Guardar
                </button>
            </div>
        </form>
    )
}

function HistoryPanel({ taskId }) {
    const [items, setItems] = useState([])
    useEffect(() => {
        axios.get(`${SERVER}/tasks/${taskId}/history`)
            .then(r => setItems(r.data || []))
            .catch(e => console.error(e))
    }, [taskId])
    if (items.length === 0) return <p className='text-xs text-gray-500 italic p-2'>Sin historial.</p>
    return (
        <div className='border-l-2 border-blue-300 pl-3 ml-3 my-2'>
            {items.map(it => (
                <div key={it.id} className='text-xs text-gray-700 mb-1'>
                    <span className='font-mono'>{String(it.scheduled_for).slice(0, 16).replace('T', ' ')}</span>
                    {' — '}
                    <span className={`font-semibold ${it.status === 'completed' ? 'text-green-700' : it.status === 'postponed' ? 'text-amber-700' : 'text-gray-700'}`}>
                        {it.status}
                    </span>
                    {' '}
                    {it.assigned_username && `(${it.assigned_username})`}
                    {it.completed_at && ` · ✓ por ${it.completed_username ?? '?'}`}
                    {it.postpone_count > 0 && ` · postergada ${it.postpone_count}x`}
                </div>
            ))}
        </div>
    )
}

function Tasks() {
    const [tasks, setTasks] = useState([])
    const [grupos, setGrupos] = useState([])
    const [users, setUsers] = useState([])
    const [editing, setEditing] = useState(null)  // task object or 'new'
    const [historyOpen, setHistoryOpen] = useState(null)  // task id

    const reload = useCallback(() => {
        axios.get(`${SERVER}/tasks`).then(r => setTasks(r.data || [])).catch(e => console.error(e))
    }, [])

    useEffect(() => {
        reload()
        axios.get(`${SERVER}/grupousuarios`).then(r => setGrupos(r.data || [])).catch(e => console.error(e))
        axios.get(`${SERVER}/users`).then(r => setUsers(r.data || [])).catch(e => console.error(e))
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
        if (!window.confirm('¿Eliminar esta tarea? (no afecta instancias ya completadas)')) return
        try {
            await axios.delete(`${SERVER}/tasks/${id}`)
            reload()
        } catch (e) { alert('No se pudo eliminar') }
    }

    function editInitial(t) {
        // Convierte el task de DB al shape del form.
        return {
            title: t.title ?? '',
            description: t.description ?? '',
            assigned_to_group_id: t.assigned_to_group_id ?? '',
            assigned_to_user_id: t.assigned_to_user_id ?? '',
            for_each_user: t.for_each_user === 1,
            can_postpone: t.can_postpone === 1,
            repeat_type: t.repeat_type ?? 'none',
            repeat_time: t.repeat_time ? String(t.repeat_time).slice(0, 5) : '09:00',
            repeat_day_of_week: t.repeat_day_of_week ?? 1,
            repeat_day_of_month: t.repeat_day_of_month ?? 1,
            starts_at: t.starts_at
                ? String(t.starts_at).slice(0, 16).replace(' ', 'T')
                : new Date().toISOString().slice(0, 16),
        }
    }

    return (
        <div className='bg-gray-100 min-h-screen'>
            <MainNavBar />
            <div className='max-w-5xl mx-auto p-4'>
                <div className='flex justify-between items-center mb-4'>
                    <h1 className='text-2xl font-bold'>Tareas</h1>
                    {editing == null && (
                        <button className='bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 rounded'
                            onClick={() => setEditing('new')}>
                            + Nueva tarea
                        </button>
                    )}
                </div>

                {editing != null && (
                    <TaskForm
                        initial={editing === 'new' ? undefined : editInitial(editing)}
                        grupos={grupos}
                        users={users}
                        onSubmit={submit}
                        onCancel={() => setEditing(null)} />
                )}

                <div className='bg-white border rounded'>
                    <table className='w-full text-sm'>
                        <thead className='bg-gray-200'>
                            <tr>
                                <th className='px-3 py-2 text-left'>Título</th>
                                <th className='px-3 py-2 text-left'>Asignado a</th>
                                <th className='px-3 py-2 text-left'>Repetición</th>
                                <th className='px-3 py-2 text-left'>Inicio</th>
                                <th className='px-3 py-2'></th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.length === 0 && (
                                <tr><td colSpan='5' className='px-3 py-4 text-center text-gray-500 italic'>
                                    No hay tareas configuradas.
                                </td></tr>
                            )}
                            {tasks.map(t => (
                                <React.Fragment key={t.id}>
                                    <tr className='border-t'>
                                        <td className='px-3 py-2 font-semibold'>{t.title}</td>
                                        <td className='px-3 py-2'>
                                            {t.group_name ? `Grupo: ${t.group_name}${t.for_each_user ? ' (c/u)' : ''}` : ''}
                                            {t.user_name ? `Usuario: ${t.user_name}` : ''}
                                        </td>
                                        <td className='px-3 py-2'>{t.repeat_type}{t.repeat_time ? ` · ${String(t.repeat_time).slice(0, 5)}` : ''}</td>
                                        <td className='px-3 py-2 text-xs'>{String(t.starts_at).slice(0, 16).replace('T', ' ')}</td>
                                        <td className='px-3 py-2 text-right space-x-1'>
                                            <button className='text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded'
                                                onClick={() => setHistoryOpen(historyOpen === t.id ? null : t.id)}>
                                                Historial
                                            </button>
                                            <button className='text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded'
                                                onClick={() => setEditing(t)}>
                                                Editar
                                            </button>
                                            <button className='text-xs bg-red-100 text-red-800 px-2 py-1 rounded'
                                                onClick={() => remove(t.id)}>
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                    {historyOpen === t.id && (
                                        <tr>
                                            <td colSpan='5' className='bg-gray-50'>
                                                <HistoryPanel taskId={t.id} />
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default Tasks
