import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from './MainNavBar'
import SERVER from '../server'
import { parseDateDmyOrIso, pickDate } from '../utils/dateFormat'
import { categorize, formatAge } from './atencionWorkflow'

const ATENCION_GROUP_ID = 14
const LAB_GROUP_NAME = 'Laboratorio Principal Belgrano'
const INCUCAI_MAX_DAYS = 90

const TABS = [
    { id: 'general', label: 'General' },
    { id: 'laboratorio', label: 'Laboratorio' },
    { id: 'atencion', label: 'Atención al cliente' },
    { id: 'stock', label: 'StockManager' },
]

function ageInDays(order) {
    const d = parseDateDmyOrIso(pickDate(order, 'created_at'))
    if (!d) return 0
    return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)
}

function OrdersTable({ orders }) {
    const navigate = useNavigate()
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
                    {orders.map(order => (
                        <tr key={order.order_id} className='hover:bg-gray-50 cursor-pointer'
                            onClick={() => navigate(`/messages/${order.order_id}`)}>
                            <td className='border px-2 py-2 text-center'>{order.order_id}</td>
                            <td className='border px-2 py-2'>{order.name} {order.surname}</td>
                            <td className='border px-2 py-2'>{order.brand} {order.type} {order.model} - SN: {order.serial}</td>
                            <td className='border px-2 py-2'>{order.problem}</td>
                            <td className='border px-2 py-2 text-center'>{order.state}</td>
                            <td className='border px-2 py-2 text-center'>{formatAge(order)}</td>
                        </tr>
                    ))}
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
    const [incucaiOrders, setIncucaiOrders] = useState([])
    const [grupos, setGrupos] = useState([])

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [ordersRes, incucaiRes, gruposRes] = await Promise.all([
                    axios.get(`${SERVER}/orders`),
                    axios.get(`${SERVER}/orders/incucai`),
                    axios.get(`${SERVER}/grupousuarios`),
                ])
                setInProgressOrders(ordersRes.data)
                setIncucaiOrders(incucaiRes.data)
                setGrupos(gruposRes.data)
            } catch (error) {
                console.error(error)
            }
        }
        fetchAll()
    }, [])

    const generalOrders = useMemo(() => {
        // GET /orders ya excluye ENTREGADO, PARA RETIRAR e INCUCAI (los 3
        // estados especiales de branch_settings). Le sumamos los INCUCAI con
        // menos de 90 días — así el admin ve los recientes pero no los que
        // ya pasaron al archivo natural.
        const recentIncucai = incucaiOrders.filter(o => ageInDays(o) < INCUCAI_MAX_DAYS)
        return [...inProgressOrders, ...recentIncucai]
    }, [inProgressOrders, incucaiOrders])

    const labGroupId = useMemo(() => {
        const g = grupos.find(x => (x.grupo ?? '').trim().toLowerCase() === LAB_GROUP_NAME.toLowerCase())
        return g ? g.idgrupousuarios : null
    }, [grupos])

    const labOrders = useMemo(() => {
        if (!labGroupId) return []
        return inProgressOrders.filter(o => o.users_id === labGroupId)
    }, [inProgressOrders, labGroupId])

    const labCountersByState = useMemo(() => {
        const counters = new Map()
        for (const o of labOrders) {
            counters.set(o.state, (counters.get(o.state) ?? 0) + 1)
        }
        return Array.from(counters.entries()).sort((a, b) => b[1] - a[1])
    }, [labOrders])

    const atencionOrders = useMemo(() => {
        return inProgressOrders.filter(o => o.users_id === ATENCION_GROUP_ID)
    }, [inProgressOrders])

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

    return (
        <div className='bg-gray-300 min-h-screen'>
            <MainNavBar />
            <div className='mt-2 w-full md:w-5/6 mx-auto bg-white px-4 py-4 md:py-8 shadow-lg'>
                <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2'>
                    <h1 className='text-3xl'>{username}</h1>
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
                    {TABS.map(tab => (
                        <button key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 font-bold border-b-2 -mb-px transition-colors ${activeTab === tab.id ? 'border-blue-500 text-blue-700' : 'border-transparent text-gray-600 hover:text-blue-600'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'general' && (
                    <div>
                        <p className='text-sm text-gray-600 mb-2'>
                            Mostrando <span className='font-bold'>{generalOrders.length}</span> órdenes activas
                            (excluye Entregado e INCUCAI con más de {INCUCAI_MAX_DAYS} días).
                        </p>
                        <OrdersTable orders={generalOrders} />
                    </div>
                )}

                {activeTab === 'laboratorio' && (
                    <div>
                        {!labGroupId ? (
                            <p className='text-red-600'>
                                No se encontró el grupo "{LAB_GROUP_NAME}" en el catálogo de grupos.
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
                        <OrdersTable orders={atencionOrders} />
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
