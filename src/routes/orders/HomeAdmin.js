import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from './MainNavBar'
import SERVER from '../server'
import { parseDateTimeDmyOrIso, pickDate } from '../utils/dateFormat'
import { ATENCION_STATES, categorize, daysInCurrentState, formatDuration } from './atencionWorkflow'

const LAB_GROUP_NAME = 'Laboratorio Principal Belgrano'
const ATENCION_GROUP_NAME = 'Atencion al cliente Belgrano'
const ADMIN_GROUP_NAME = 'Admin'
const ORPHAN_LABEL = 'Propiedad de TheDoniPhone'

const TABS = [
    { id: 'general', label: 'General' },
    { id: 'laboratorio', label: 'Laboratorio' },
    { id: 'atencion', label: 'Atención al cliente' },
    { id: 'incucai', label: 'INCUCAI' },
    { id: 'stock', label: 'StockManager' },
]

function ageInDays(order) {
    // Usamos el parser con hora — para órdenes de hoy se ven horas reales
    // (formatDuration muestra "h" cuando days < 1). El parser legacy
    // (parseDateDmyOrIso) descartaba HH:MM:SS y devolvía medianoche, que
    // hacía que una orden de las 12:00 mostrara "18 h" a las 18:43.
    const d = parseDateTimeDmyOrIso(pickDate(order, 'created_at'))
    if (!d) return 0
    return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)
}

// Renderiza una tabla de órdenes con columnas opcionales:
//   - showAsignadaA: agrega columna "Asignada a" (fallback ORPHAN_LABEL si
//     users_id viene NULL). Se usa solo en el tab INCUCAI.
//   - highlightAction: pinta de bg-red-100 las filas categorize()==='action'.
//     Usado en el tab Atención (no se separan por sección, se distinguen
//     por color — más simple y cubre el caso de "wait que vence mientras
//     mirás la página").
function OrdersTable({ orders, showAsignadaA = false, highlightAction = false }) {
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
                        {showAsignadaA && <th className='border px-2 py-1'>Asignada a</th>}
                        <th className='border px-2 py-1'>Antigüedad</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => {
                        const isAction = highlightAction && categorize(order) === 'action'
                        return (
                            <tr key={order.order_id}
                                className={`cursor-pointer ${isAction ? 'bg-red-100 hover:bg-red-200' : 'hover:bg-gray-50'}`}
                                onClick={() => window.open(`/messages/${order.order_id}`, '_blank')}>
                                <td className='border px-2 py-2 text-center'>{order.order_id}</td>
                                <td className='border px-2 py-2'>{order.name} {order.surname}</td>
                                <td className='border px-2 py-2'>{order.brand} {order.type} {order.model} - SN: {order.serial}</td>
                                <td className='border px-2 py-2'>{order.problem}</td>
                                <td className='border px-2 py-2 text-center'>{order.state}</td>
                                {showAsignadaA && (
                                    <td className='border px-2 py-2 text-center'>
                                        {order.users_id == null
                                            ? <span className='italic text-gray-600'>{ORPHAN_LABEL}</span>
                                            : (order.grupo ?? '—')}
                                    </td>
                                )}
                                <td className='border px-2 py-2 text-center'>{formatDuration(ageInDays(order))}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

function HomeAdmin() {
    const navigate = useNavigate()
    const username = localStorage.getItem('username') ?? ''
    const permisos = localStorage.getItem('permisos') ?? ''

    const [activeTab, setActiveTab] = useState('general')
    const [inProgressOrders, setInProgressOrders] = useState([])
    const [paraRetirarOrders, setParaRetirarOrders] = useState([])
    const [incucaiOrders, setIncucaiOrders] = useState([])
    const [grupos, setGrupos] = useState([])

    useEffect(() => {
        // Fetches independientes — un fallo no nuke los otros 3.
        axios.get(`${SERVER}/orders`).then(r => setInProgressOrders(r.data)).catch(e => console.error('GET /orders', e))
        axios.get(`${SERVER}/orders/para-retirar`).then(r => setParaRetirarOrders(r.data)).catch(e => console.error('GET /orders/para-retirar', e))
        axios.get(`${SERVER}/orders/incucai`).then(r => setIncucaiOrders(r.data)).catch(e => console.error('GET /orders/incucai', e))
        axios.get(`${SERVER}/grupousuarios`).then(r => setGrupos(r.data)).catch(e => console.error('GET /grupousuarios', e))
    }, [])

    // Resolvemos los 3 group ids relevantes dinámicamente por nombre. Si
    // alguno no se encuentra (admin renombró el grupo, p.ej.) los tabs
    // muestran un warning en vez de crashear.
    const groupIds = useMemo(() => {
        const find = (name) => grupos.find(g => (g.grupo ?? '').trim().toLowerCase() === name.toLowerCase())
        return {
            lab: find(LAB_GROUP_NAME)?.idgrupousuarios ?? null,
            atencion: find(ATENCION_GROUP_NAME)?.idgrupousuarios ?? null,
            admin: find(ADMIN_GROUP_NAME)?.idgrupousuarios ?? null,
        }
    }, [grupos])

    // === Tab "Laboratorio" ===
    // users_id = grupo Lab. Lab no maneja REPARADO CLIENTE AVISADO ni
    // INCUCAI, alcanza con /orders.
    const labOrders = useMemo(() => {
        if (groupIds.lab == null) return []
        return inProgressOrders.filter(o => o.users_id === groupIds.lab)
    }, [inProgressOrders, groupIds.lab])

    const labCountersByState = useMemo(() => {
        const counters = new Map()
        for (const o of labOrders) counters.set(o.state, (counters.get(o.state) ?? 0) + 1)
        return Array.from(counters.entries()).sort((a, b) => b[1] - a[1])
    }, [labOrders])

    // === Tab "Atención al cliente" ===
    // users_id = grupo Atención, excluyendo SOLUCIONA ADMIN (esos ya migraron
    // a Admin por forces_admin_assignment y los maneja General/Admin).
    // Incluimos /orders/para-retirar porque REPARADO CLIENTE AVISADO vive ahí.
    const atencionOrders = useMemo(() => {
        if (groupIds.atencion == null) return []
        return [...inProgressOrders, ...paraRetirarOrders]
            .filter(o => o.users_id === groupIds.atencion && o.state !== 'SOLUCIONA ADMIN')
    }, [inProgressOrders, paraRetirarOrders, groupIds.atencion])

    const atencionCounts = useMemo(() => {
        let action = 0
        let wait = 0
        for (const o of atencionOrders) {
            const bucket = categorize(o)
            if (bucket === 'action') action++
            else if (bucket === 'wait') wait++
        }
        return { action, wait }
    }, [atencionOrders])

    // === Tab "INCUCAI" ===
    // Todas las INCUCAI. < 90d siguen asignadas a Admin; ≥ 90d quedan con
    // users_id=NULL tras el orfanado por cron — la columna "Asignada a"
    // muestra "Propiedad de TheDoniPhone" en ese caso.
    const incucaiSorted = useMemo(() => {
        // state_changed_at = momento de archivado (migration 0023+cron). Las
        // más recientes arriba.
        return [...incucaiOrders].sort((a, b) => daysInCurrentState(a) - daysInCurrentState(b))
    }, [incucaiOrders])

    // === Tab "General" ===
    // Todo lo que no es Lab, Atención o INCUCAI. Incluye:
    //   - Grupo Admin (users_id = adminGroupId)
    //   - SOLUCIONA ADMIN (cualquier grupo)
    //   - Huérfanos de cualquier otro grupo (Limbo, deshabilitados, etc.)
    // ENTREGADO ya está fuera de /orders. INCUCAI tampoco está en /orders.
    const generalOrders = useMemo(() => {
        return [...inProgressOrders, ...paraRetirarOrders].filter(o => {
            if (groupIds.lab != null && o.users_id === groupIds.lab) return false
            if (groupIds.atencion != null && o.users_id === groupIds.atencion && o.state !== 'SOLUCIONA ADMIN') return false
            return true
        })
    }, [inProgressOrders, paraRetirarOrders, groupIds.lab, groupIds.atencion])

    const totalActive = labOrders.length + atencionOrders.length + incucaiSorted.length + generalOrders.length

    return (
        <div className='bg-gray-300 min-h-screen'>
            <MainNavBar />
            <div className='mt-2 w-full md:w-5/6 mx-auto bg-white px-4 py-4 md:py-8 shadow-lg'>
                <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2'>
                    <div>
                        <h1 className='text-3xl'>{username}</h1>
                        <p className='text-sm text-gray-600'>Total activas: <span className='font-bold'>{totalActive}</span></p>
                    </div>
                    <div className='flex gap-2'>
                        <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded'
                            onClick={() => window.open('/lista-precios.html', '_blank')}>
                            Crear lista de precios
                        </button>
                        {permisos.includes('ManipularOrdenes') && (
                            <button className='bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded'
                                onClick={() => navigate('/orders')}>
                                Agregar orden
                            </button>
                        )}
                    </div>
                </div>

                <div className='flex flex-wrap border-b border-gray-300 mb-4'>
                    {TABS.map(tab => {
                        const count = tab.id === 'general' ? generalOrders.length
                            : tab.id === 'laboratorio' ? labOrders.length
                            : tab.id === 'atencion' ? atencionOrders.length
                            : tab.id === 'incucai' ? incucaiSorted.length
                            : null
                        return (
                            <button key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 font-bold border-b-2 -mb-px transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-700' : 'border-transparent text-gray-600 hover:text-blue-600'}`}>
                                {tab.label}
                                {count !== null && <span className='ml-2 text-xs bg-gray-200 text-gray-700 rounded px-2 py-0.5'>{count}</span>}
                            </button>
                        )
                    })}
                </div>

                {activeTab === 'general' && (
                    <div>
                        <p className='text-sm text-gray-600 mb-2'>
                            Órdenes que no están en Laboratorio, Atención ni INCUCAI: grupo Admin,
                            SOLUCIONA ADMIN, y cualquier otra asignación.
                        </p>
                        <OrdersTable orders={generalOrders} />
                    </div>
                )}

                {activeTab === 'laboratorio' && (
                    <div>
                        {groupIds.lab == null ? (
                            <p className='text-red-600'>
                                No se encontró el grupo "{LAB_GROUP_NAME}" en el catálogo.
                            </p>
                        ) : (
                            <>
                                <div className='flex flex-wrap gap-2 mb-3'>
                                    <div className='bg-gray-100 border px-3 py-2 rounded'>
                                        <span className='text-xs text-gray-600 block'>Total</span>
                                        <span className='font-bold text-xl'>{labOrders.length}</span>
                                    </div>
                                    {labCountersByState.map(([state, count]) => (
                                        <div key={state} className='bg-gray-100 border px-3 py-2 rounded'>
                                            <span className='text-xs text-gray-600 block'>{state}</span>
                                            <span className='font-bold text-xl'>{count}</span>
                                        </div>
                                    ))}
                                </div>
                                <OrdersTable orders={labOrders} />
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'atencion' && (
                    <div>
                        {groupIds.atencion == null ? (
                            <p className='text-red-600'>
                                No se encontró el grupo "{ATENCION_GROUP_NAME}" en el catálogo.
                            </p>
                        ) : (
                            <>
                                <div className='flex flex-wrap gap-2 mb-3'>
                                    <div className='bg-red-100 border-2 border-red-400 px-3 py-2 rounded'>
                                        <span className='text-xs text-red-700 block'>Requieren acción ahora</span>
                                        <span className='font-bold text-xl'>{atencionCounts.action}</span>
                                    </div>
                                    <div className='bg-blue-100 border-2 border-blue-400 px-3 py-2 rounded'>
                                        <span className='text-xs text-blue-700 block'>En espera</span>
                                        <span className='font-bold text-xl'>{atencionCounts.wait}</span>
                                    </div>
                                    <div className='bg-gray-100 border px-3 py-2 rounded'>
                                        <span className='text-xs text-gray-600 block'>Total asignadas</span>
                                        <span className='font-bold text-xl'>{atencionOrders.length}</span>
                                    </div>
                                </div>
                                <OrdersTable orders={atencionOrders} highlightAction />
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'incucai' && (
                    <div>
                        <p className='text-sm text-gray-600 mb-2'>
                            Mostrando <span className='font-bold'>{incucaiSorted.length}</span> órdenes en INCUCAI.
                            Las que llevan ≥ 90 días son propiedad de la empresa.
                        </p>
                        <OrdersTable orders={incucaiSorted} showAsignadaA />
                    </div>
                )}

                {activeTab === 'stock' && (
                    <div className='border-2 border-dashed border-gray-400 rounded p-10 text-center text-gray-500'>
                        StockManager — Próximamente
                    </div>
                )}
            </div>
        </div>
    )
}

export default HomeAdmin
