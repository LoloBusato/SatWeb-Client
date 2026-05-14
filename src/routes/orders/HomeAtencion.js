import React, { useState, useEffect, useMemo, useRef } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from './MainNavBar'
import SERVER from '../server'
import {
    ACCIONES_POR_ESTADO,
    categorize,
    daysUntilDeadline,
    formatAge,
    formatCountdown,
    findStateIdByName,
    findGroupIdByName,
    buildUpdatePayload,
    playBeep,
} from './atencionWorkflow'

const ATENCION_GROUP_ID = 14
// 30 minutos entre re-alertas según spec del producto.
const ALERT_INTERVAL_MS = 30 * 60 * 1000

function HomeAtencion() {
    const navigate = useNavigate()
    const username = localStorage.getItem('username') ?? ''

    const [orders, setOrders] = useState([])
    const [states, setStates] = useState([])
    const [grupos, setGrupos] = useState([])
    const [submitting, setSubmitting] = useState(null)
    // tick fuerza re-render cada 60s para que la cuenta regresiva avance sin
    // depender de un refetch al backend.
    const [tick, setTick] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 60 * 1000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ordersRes, statesRes, gruposRes] = await Promise.all([
                    axios.get(`${SERVER}/orders`),
                    axios.get(`${SERVER}/states`),
                    axios.get(`${SERVER}/grupousuarios`),
                ])
                const mine = ordersRes.data.filter(o => o.users_id === ATENCION_GROUP_ID)
                setOrders(mine)
                setStates(statesRes.data)
                setGrupos(gruposRes.data)
            } catch (error) {
                console.error(error)
            }
        }
        fetchData()
    }, [])

    const { actions, waiting } = useMemo(() => {
        const a = []
        const w = []
        for (const order of orders) {
            const bucket = categorize(order)
            if (bucket === 'action') a.push(order)
            else if (bucket === 'wait') w.push(order)
        }
        return { actions: a, waiting: w }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orders, tick])

    // Alerta sonora: 1) al cargar el home si hay acciones pendientes, 2) cada
    // 30 min mientras la página esté abierta y siga habiendo pendientes. El
    // ref nos da el conteo más reciente sin reinstalar el interval cuando
    // cambia la lista (eso reiniciaría el reloj de re-alerta).
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

    async function handleAction(order, action) {
        if (action.confirm && !window.confirm(action.confirm)) return
        const newStateId = findStateIdByName(states, action.target)
        if (!newStateId) {
            alert(`No se encontró el estado "${action.target}" en el catálogo. Avisar al admin.`)
            return
        }
        // Reasignación de grupo: si la acción lo pide, resolvemos el id por
        // nombre. Si el grupo no existe, frenamos antes de pegarle al backend
        // para no dejar la orden con users_id incorrecto.
        let newUsersId
        if (action.targetGroup) {
            newUsersId = findGroupIdByName(grupos, action.targetGroup)
            if (!newUsersId) {
                alert(`No se encontró el grupo "${action.targetGroup}". Avisar al admin.`)
                return
            }
        }
        setSubmitting(order.order_id)
        try {
            const payload = buildUpdatePayload(order, newStateId, newUsersId)
            await axios.put(`${SERVER}/orders/${order.order_id}`, payload)
            // Refrescamos la lista sin recargar toda la página.
            const refreshed = await axios.get(`${SERVER}/orders`)
            setOrders(refreshed.data.filter(o => o.users_id === ATENCION_GROUP_ID))
        } catch (error) {
            const msg = error?.response?.data?.message || error?.response?.data || error.message
            alert(`No se pudo actualizar la orden: ${typeof msg === 'string' ? msg : 'error desconocido'}`)
        } finally {
            setSubmitting(null)
        }
    }

    return (
        <div className='bg-gray-300 min-h-screen'>
            <MainNavBar />
            <div className='mt-2 w-full md:w-5/6 mx-auto bg-white px-4 py-4 md:py-8 shadow-lg'>
                <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2'>
                    <div>
                        <h1 className='text-3xl'>{username}</h1>
                        <p className='text-sm text-gray-600'>Atención al cliente — Belgrano</p>
                    </div>
                    <div className='flex gap-2'>
                        <button
                            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded'
                            onClick={() => window.open('/lista-precios.html', '_blank')}>
                            Crear lista de precios
                        </button>
                    </div>
                </div>

                {/* Sección superior: acciones para hacer ahora */}
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
                                        <th className='border px-2 py-1'>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {actions.map(order => {
                                        const acciones = ACCIONES_POR_ESTADO[order.state] ?? []
                                        const isSubmitting = submitting === order.order_id
                                        return (
                                            <tr key={order.order_id} className='hover:bg-gray-50'>
                                                <td className='border px-2 py-2 text-center cursor-pointer'
                                                    onClick={() => navigate(`/messages/${order.order_id}`)}>
                                                    {order.order_id}
                                                </td>
                                                <td className='border px-2 py-2 cursor-pointer'
                                                    onClick={() => navigate(`/messages/${order.order_id}`)}>
                                                    {order.name} {order.surname}
                                                </td>
                                                <td className='border px-2 py-2 cursor-pointer'
                                                    onClick={() => navigate(`/messages/${order.order_id}`)}>
                                                    {order.brand} {order.type} {order.model}
                                                </td>
                                                <td className='border px-2 py-2'>{order.problem}</td>
                                                <td className='border px-2 py-2 text-center'>{order.state}</td>
                                                <td className='border px-2 py-2 text-center'>{formatAge(order)}</td>
                                                <td className='border px-2 py-2'>
                                                    <div className='flex flex-col md:flex-row gap-1 justify-center'>
                                                        {acciones.map(a => (
                                                            <button
                                                                key={a.label}
                                                                disabled={isSubmitting}
                                                                onClick={() => handleAction(order, a)}
                                                                className={`px-2 py-1 rounded text-white font-bold ${isSubmitting ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-700'}`}>
                                                                {a.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Sección inferior: en espera */}
                <section className='mb-8'>
                    <div className='flex justify-between items-center mb-2'>
                        <h2 className='text-xl font-bold'>En espera</h2>
                        <span className='px-2 py-1 rounded bg-blue-400 text-white font-bold'>{waiting.length}</span>
                    </div>
                    {waiting.length === 0 ? (
                        <p className='text-gray-600 italic py-3'>No hay órdenes en espera.</p>
                    ) : (
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
                                        <th className='border px-2 py-1'>Vence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {waiting.map(order => {
                                        const deadline = daysUntilDeadline(order)
                                        return (
                                            <tr key={order.order_id}
                                                className='hover:bg-gray-50 cursor-pointer'
                                                onClick={() => navigate(`/messages/${order.order_id}`)}>
                                                <td className='border px-2 py-2 text-center'>{order.order_id}</td>
                                                <td className='border px-2 py-2'>{order.name} {order.surname}</td>
                                                <td className='border px-2 py-2'>{order.brand} {order.type} {order.model}</td>
                                                <td className='border px-2 py-2'>{order.problem}</td>
                                                <td className='border px-2 py-2 text-center'>{order.state}</td>
                                                <td className='border px-2 py-2 text-center'>{formatAge(order)}</td>
                                                <td className='border px-2 py-2 text-center'>{formatCountdown(deadline)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                {/* Sección de tareas del calendario (placeholder) */}
                <section>
                    <h2 className='text-xl font-bold mb-2'>Tareas del día</h2>
                    <div className='border-2 border-dashed border-gray-400 rounded p-6 text-center text-gray-500'>
                        Tareas del día — próximamente
                    </div>
                </section>
            </div>
        </div>
    )
}

export default HomeAtencion
