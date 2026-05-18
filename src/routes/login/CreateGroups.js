import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'
import { v2Delete } from '../utils/api'

// Lista canónica de permisos. Antes el form usaba checkboxes con id fijo
// (checkbox1..6) y leía los labels via querySelector — funcional pero
// no permitía precargarlos al editar. Ahora son state controlado.
const PERMISOS = [
    'ManipularOrdenes',
    'Contabilidad',
    'ManipularStock',
    'AsignarRepuestos',
    'Administrador',
    'VerTodasLasOrdenes',
]

// Convierte el string "ManipularOrdenes Contabilidad" guardado en DB a
// un set de permisos activos para precargar checkboxes. Acepta NULL/empty.
function parsePermisos(str) {
    const set = new Set()
    if (!str) return set
    str.split(/\s+/).filter(Boolean).forEach(p => set.add(p))
    return set
}

function CreateGroups() {
    const [grupo, setGrupo] = useState('')
    const [permisos, setPermisos] = useState(new Set())
    const [editingId, setEditingId] = useState(null)
    const [listGrupos, setListGrupos] = useState([])

    const navigate = useNavigate()
    const isEditing = editingId !== null

    useEffect(() => {
        axios.get(`${SERVER}/grupousuarios`)
            .then(r => setListGrupos(r.data))
            .catch(e => console.error(e))
    }, [])

    function togglePermiso(p) {
        setPermisos(prev => {
            const next = new Set(prev)
            if (next.has(p)) next.delete(p)
            else next.add(p)
            return next
        })
    }

    function resetForm() {
        setEditingId(null)
        setGrupo('')
        setPermisos(new Set())
    }

    function startEdit(g) {
        setEditingId(g.idgrupousuarios)
        setGrupo(g.grupo)
        setPermisos(parsePermisos(g.permisos))
        // Scroll al form arriba — el listado puede estar fuera de viewport.
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    async function handleSubmit(event) {
        event.preventDefault()
        const permisosStr = Array.from(permisos).join(' ')
        try {
            if (isEditing) {
                const r = await axios.put(`${SERVER}/grupousuarios/${editingId}`, {
                    grupo,
                    permisos: permisosStr,
                })
                if (r.status === 200) {
                    alert('Grupo actualizado')
                    window.location.reload()
                }
            } else {
                const r = await axios.post(`${SERVER}/grupousuarios`, {
                    grupo,
                    permisos: permisosStr,
                })
                if (r.status === 200) {
                    alert('Grupo de usuarios agregado')
                    window.location.reload()
                }
            }
        } catch (error) {
            const msg = error?.response?.data ?? error?.message ?? 'Error desconocido'
            alert(typeof msg === 'string' ? msg : 'No se pudo guardar el grupo')
        }
    }

    const eliminarElemento = async (id) => {
        try {
            await v2Delete(`/groups/${id}`)
            alert('Grupo de usuarios eliminado')
            window.location.reload()
        } catch (error) {
            const status = error?.response?.status
            const msg = error?.response?.data?.error?.message
            if (status === 409 && msg) { alert(msg); return }
            alert(typeof msg === 'string' ? msg : 'No se pudo eliminar el grupo')
        }
    }

    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className='bg-white my-2 py-8 px-2 max-w-2xl mx-auto'>
                <h1 className='text-center text-5xl'>
                    {isEditing ? 'Editar grupo de usuarios' : 'Agregar grupo de usuarios'}
                </h1>
                <div className='p-4 max-w-lg mx-auto'>
                    <form onSubmit={handleSubmit} className='mb-4'>
                        <div className='mb-2'>
                            <div className='flex flex-col'>
                                <div className='w-full'>
                                    <label className='block text-gray-700 font-bold mb-2'>Grupo: *</label>
                                    <input
                                        className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                                        type='text'
                                        required
                                        value={grupo}
                                        onChange={(e) => setGrupo(e.target.value)} />
                                </div>
                                <div>
                                    <h2 className='block text-gray-700 font-bold mb-2 mt-3'>Permisos:</h2>
                                    <div className='flex flex-wrap'>
                                        {PERMISOS.map(p => (
                                            <label key={p} className='w-1/2 flex items-center gap-1 py-1 cursor-pointer'>
                                                <input
                                                    type='checkbox'
                                                    checked={permisos.has(p)}
                                                    onChange={() => togglePermiso(p)} />
                                                <span>{p}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='flex gap-2 mt-3'>
                            <button
                                type='submit'
                                className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'>
                                {isEditing ? 'Actualizar' : 'Guardar'}
                            </button>
                            {isEditing && (
                                <button
                                    type='button'
                                    className='bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded'
                                    onClick={resetForm}>
                                    Cancelar
                                </button>
                            )}
                            <button
                                type='button'
                                className='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline'
                                onClick={() => navigate('/home')}>
                                Volver
                            </button>
                        </div>
                    </form>
                </div>
                <div className='flex justify-center mb-10'>
                    <table className='table-auto'>
                        <thead>
                            <tr>
                                <th className='px-4 py-2'>Grupo</th>
                                <th className='px-4 py-2'>Permisos</th>
                                <th className='px-4 py-2'>Usuarios activos</th>
                                <th className='px-4 py-2'></th>
                                <th className='px-4 py-2'></th>
                            </tr>
                        </thead>
                        <tbody>
                            {listGrupos.map((g) => {
                                const isDisabledBucket = g.grupo === 'USUARIOS DESHABILITADOS'
                                const count = isDisabledBucket
                                    ? (g.totalUsersCount ?? 0)
                                    : (g.activeUsersCount ?? 0)
                                const rowCls = isDisabledBucket
                                    ? 'bg-gray-700 text-white border-2 border-red-500'
                                    : ''
                                const numCls = isDisabledBucket
                                    ? 'border px-4 py-2 text-center font-bold text-red-400'
                                    : 'border px-4 py-2 text-center'
                                const isRowEditing = editingId === g.idgrupousuarios
                                return (
                                    <tr key={g.idgrupousuarios}
                                        className={`${rowCls} ${isRowEditing ? 'bg-yellow-100' : ''}`}>
                                        <td className='border px-4 py-2'>{g.grupo}</td>
                                        <td className='border px-4 py-2'>{g.permisos}</td>
                                        <td className={numCls}>{count}</td>
                                        <td className='border px-2 py-2'>
                                            <button
                                                className='bg-blue-500 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded'
                                                onClick={() => startEdit(g)}>
                                                Editar
                                            </button>
                                        </td>
                                        <td className='border px-2 py-2'>
                                            {!isDisabledBucket && (
                                                <button
                                                    className='bg-red-500 hover:bg-red-700 text-white font-bold px-3 py-1 rounded'
                                                    onClick={() => eliminarElemento(g.idgrupousuarios)}>
                                                    Eliminar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default CreateGroups
