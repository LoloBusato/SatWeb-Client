import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from './MainNavBar'
import SERVER from '../server'
import { parseDateTimeDmyOrIso, pickDate } from '../utils/dateFormat'
import { categorize, formatDuration } from './atencionWorkflow'

const ADMIN_GROUP_NAME = 'Admin'
const DISABLED_GROUP_NAME = 'USUARIOS DESHABILITADOS'

// Predicado para identificar grupos que NO deben aparecer en el editor
// de pestañas — ya viven como tab fija (Admin/StockManager) o son bucket
// excluido (USUARIOS DESHABILITADOS). Match exacto por nombre + extra
// .includes('admin') por si en algún momento existe "Administrador" o
// alguna variante.
function isHiddenFromEditor(grupo) {
    const name = (grupo ?? '').trim()
    if (!name) return true
    if (name === 'Admin') return true
    if (name === 'StockManager') return true
    if (name === DISABLED_GROUP_NAME) return true
    if (name.toLowerCase().includes('admin')) return true
    return false
}

// Persistencia de qué grupos aparecen como pestañas. null = "no se decidió
// nunca" → mostrar todos los grupos activos (default). Si el operador toca
// el editor, escribimos un Array<groupId> explícito; cualquier grupo nuevo
// que aparezca después queda destildado por defecto.
const TABS_CONFIG_KEY = 'satweb:admin:tabs-config'
function loadTabsConfig() {
    try {
        const raw = localStorage.getItem(TABS_CONFIG_KEY)
        if (!raw) return null
        const arr = JSON.parse(raw)
        if (!Array.isArray(arr)) return null
        return new Set(arr.map(Number))
    } catch (_) { return null }
}
function saveTabsConfig(set) {
    try { localStorage.setItem(TABS_CONFIG_KEY, JSON.stringify(Array.from(set))) } catch (_) {}
}

function ageInDays(order) {
    // Usamos el parser con hora — para órdenes de hoy se ven horas reales
    // (formatDuration muestra "h" cuando days < 1). El parser legacy
    // (parseDateDmyOrIso) descartaba HH:MM:SS y devolvía medianoche, que
    // hacía que una orden de las 12:00 mostrara "18 h" a las 18:43.
    const d = parseDateTimeDmyOrIso(pickDate(order, 'created_at'))
    if (!d) return 0
    return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)
}

// Renderiza una tabla de órdenes. Pinta filas con categorize()==='action'
// en bg-red-100 — para grupos que no manejan estados del flujo de Atención
// es un no-op (categorize devuelve null).
function OrdersTable({ orders }) {
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
                        <th className='border px-2 py-1'>Antigüedad</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => {
                        const isAction = categorize(order) === 'action'
                        return (
                            <tr key={order.order_id}
                                className={`cursor-pointer ${isAction ? 'bg-red-100 hover:bg-red-200' : 'hover:bg-gray-50'}`}
                                onClick={() => window.open(`/messages/${order.order_id}`, '_blank')}>
                                <td className='border px-2 py-2 text-center'>{order.order_id}</td>
                                <td className='border px-2 py-2'>{order.name} {order.surname}</td>
                                <td className='border px-2 py-2'>{order.brand} {order.type} {order.model} - SN: {order.serial}</td>
                                <td className='border px-2 py-2'>{order.problem}</td>
                                <td className='border px-2 py-2 text-center'>{order.state}</td>
                                <td className='border px-2 py-2 text-center'>{formatDuration(ageInDays(order))}</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

// Tarjetitas de contadores por estado — usadas dentro de cada tab.
function StateCounters({ orders, totalLabel = 'Total' }) {
    const counters = useMemo(() => {
        const m = new Map()
        for (const o of orders) m.set(o.state, (m.get(o.state) ?? 0) + 1)
        return Array.from(m.entries()).sort((a, b) => b[1] - a[1])
    }, [orders])
    if (orders.length === 0) return null
    return (
        <div className='flex flex-wrap gap-2 mb-3'>
            <div className='bg-gray-100 border px-3 py-2 rounded'>
                <span className='text-xs text-gray-600 block'>{totalLabel}</span>
                <span className='font-bold text-xl'>{orders.length}</span>
            </div>
            {counters.map(([state, count]) => (
                <div key={state} className='bg-gray-100 border px-3 py-2 rounded'>
                    <span className='text-xs text-gray-600 block'>{state}</span>
                    <span className='font-bold text-xl'>{count}</span>
                </div>
            ))}
        </div>
    )
}

function HomeAdmin() {
    const navigate = useNavigate()
    const username = localStorage.getItem('username') ?? ''
    const permisos = localStorage.getItem('permisos') ?? ''

    const [activeTab, setActiveTab] = useState('admin')
    const [inProgressOrders, setInProgressOrders] = useState([])
    const [paraRetirarOrders, setParaRetirarOrders] = useState([])
    const [grupos, setGrupos] = useState([])
    // null = nunca se configuró → todos los grupos activos visibles.
    // Set<number> = allowlist explícita. Cuando aparece un grupo nuevo
    // (no estaba en la lista guardada), queda destildado por defecto.
    const [tabsConfig, setTabsConfig] = useState(() => loadTabsConfig())
    const [editorOpen, setEditorOpen] = useState(false)

    useEffect(() => {
        // Fetches independientes — un fallo no nuke los otros 2.
        axios.get(`${SERVER}/orders`).then(r => setInProgressOrders(r.data)).catch(e => console.error('GET /orders', e))
        axios.get(`${SERVER}/orders/para-retirar`).then(r => setParaRetirarOrders(r.data)).catch(e => console.error('GET /orders/para-retirar', e))
        axios.get(`${SERVER}/grupousuarios`).then(r => setGrupos(r.data)).catch(e => console.error('GET /grupousuarios', e))
    }, [])

    const adminId = useMemo(() => {
        const g = grupos.find(x => (x.grupo ?? '').trim().toLowerCase() === ADMIN_GROUP_NAME.toLowerCase())
        return g?.idgrupousuarios ?? null
    }, [grupos])

    // Grupos editables (todos los activos EXCEPTO Admin/StockManager que
    // ya son tabs fijas, y USUARIOS DESHABILITADOS). Ordenados alfabético.
    // Esta lista alimenta tanto las tabs editables como el modal de edición.
    const activeGroups = useMemo(() => {
        return grupos
            .filter(g => !isHiddenFromEditor(g.grupo))
            .sort((a, b) => (a.grupo ?? '').localeCompare(b.grupo ?? ''))
    }, [grupos])

    // ids visibles: tabsConfig (si existe) intersección con grupos activos;
    // sino todos activos.
    const visibleGroupIds = useMemo(() => {
        const ids = activeGroups.map(g => g.idgrupousuarios)
        if (tabsConfig === null) return new Set(ids)
        return new Set(ids.filter(id => tabsConfig.has(id)))
    }, [activeGroups, tabsConfig])

    // Tabs en orden: Admin (fija) + un tab por grupo editable visible +
    // StockManager (fija). Admin y StockManager NO aparecen entre los
    // editables — viven sólo como tabs fijas.
    const tabs = useMemo(() => {
        const groupTabs = activeGroups
            .filter(g => visibleGroupIds.has(g.idgrupousuarios))
            .map(g => ({ id: `group:${g.idgrupousuarios}`, label: g.grupo, groupId: g.idgrupousuarios }))
        return [
            { id: 'admin', label: 'Admin' },
            ...groupTabs,
            { id: 'stock', label: 'StockManager' },
        ]
    }, [activeGroups, visibleGroupIds])

    // Si el tab activo deja de existir (operador lo destildó) → volver a Admin.
    useEffect(() => {
        if (!tabs.some(t => t.id === activeTab)) setActiveTab('admin')
    }, [tabs, activeTab])

    const allActive = useMemo(
        () => [...inProgressOrders, ...paraRetirarOrders],
        [inProgressOrders, paraRetirarOrders],
    )

    // Tab Admin: grupo Admin + sin grupo asignado (users_id NULL). Incluye
    // SOLUCIONA ADMIN que el backend force-asigna a Admin.
    const adminOrders = useMemo(() => {
        return allActive.filter(o => o.users_id == null || (adminId != null && o.users_id === adminId))
    }, [allActive, adminId])

    function ordersForGroup(groupId) {
        return allActive.filter(o => o.users_id === groupId)
    }

    const countByTab = useMemo(() => {
        const m = new Map()
        m.set('admin', adminOrders.length)
        for (const t of tabs) {
            if (t.groupId != null) m.set(t.id, ordersForGroup(t.groupId).length)
        }
        return m
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tabs, adminOrders, allActive])

    const totalActive = allActive.length

    function toggleGroup(groupId) {
        // Si nunca se editó (tabsConfig === null), partimos de "todos activos"
        // y des-tildamos el que tocó el operador.
        const base = tabsConfig === null
            ? new Set(activeGroups.map(g => g.idgrupousuarios))
            : new Set(tabsConfig)
        if (base.has(groupId)) base.delete(groupId)
        else base.add(groupId)
        setTabsConfig(base)
        saveTabsConfig(base)
    }

    const activeGroupTab = tabs.find(t => t.id === activeTab && t.groupId != null)
    const activeGroupOrders = activeGroupTab ? ordersForGroup(activeGroupTab.groupId) : []

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
                        <button className='bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1 px-3 rounded'
                            onClick={() => setEditorOpen(true)}>
                            ⚙ Editar pestañas
                        </button>
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
                    {tabs.map(tab => {
                        const count = countByTab.get(tab.id) ?? null
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

                {activeTab === 'admin' && (
                    <div>
                        <p className='text-sm text-gray-600 mb-2'>
                            Órdenes del grupo Admin + sin grupo asignado (incluye SOLUCIONA ADMIN).
                        </p>
                        <StateCounters orders={adminOrders} />
                        <OrdersTable orders={adminOrders} />
                    </div>
                )}

                {activeGroupTab && (
                    <div>
                        <StateCounters orders={activeGroupOrders} />
                        <OrdersTable orders={activeGroupOrders} />
                    </div>
                )}

                {activeTab === 'stock' && (
                    <div className='border-2 border-dashed border-gray-400 rounded p-10 text-center text-gray-500'>
                        StockManager — Próximamente
                    </div>
                )}
            </div>

            {editorOpen && (
                <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'
                    onClick={() => setEditorOpen(false)}>
                    <div className='bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto'
                        onClick={(e) => e.stopPropagation()}>
                        <div className='p-4 border-b'>
                            <h3 className='text-lg font-bold'>Editar pestañas</h3>
                            <p className='text-xs text-gray-600 mt-1'>
                                Tildá los grupos que querés ver como pestaña. "Admin" y "StockManager"
                                son fijas y no aparecen acá. Los grupos nuevos aparecen destildados.
                            </p>
                        </div>
                        <div className='p-4 space-y-2'>
                            {activeGroups.length === 0 && (
                                <p className='text-sm text-gray-500 italic'>Cargando grupos...</p>
                            )}
                            {activeGroups.map(g => (
                                <label key={g.idgrupousuarios} className='flex items-center gap-2 cursor-pointer select-none'>
                                    <input
                                        type='checkbox'
                                        className='h-4 w-4'
                                        checked={visibleGroupIds.has(g.idgrupousuarios)}
                                        onChange={() => toggleGroup(g.idgrupousuarios)} />
                                    <span className='text-sm'>{g.grupo}</span>
                                </label>
                            ))}
                        </div>
                        <div className='p-4 border-t flex justify-end'>
                            <button className='bg-blue-500 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded'
                                onClick={() => setEditorOpen(false)}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default HomeAdmin
