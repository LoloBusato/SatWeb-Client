import React, { useEffect, useState } from 'react'

// Color del badge de estado. Verde = listo / cliente, rojo = acción ya
// (always-action), azul = en espera o administración.
const STATE_BADGE = {
    'REPARADO':                   'bg-green-100 text-green-800',
    'REPARADO CLIENTE AVISADO':   'bg-green-100 text-green-800',
    'PRESUPUESTAR':               'bg-red-100 text-red-800',
    'CONSULTAR A CLIENTE':        'bg-red-100 text-red-800',
    'COMPRAR REPUESTO':           'bg-red-100 text-red-800',
    'NO REPARADO':                'bg-red-100 text-red-800',
    'ESPERANDO RESPUESTA CLIENTE':'bg-blue-100 text-blue-800',
    'ESPERANDO REPUESTO':         'bg-blue-100 text-blue-800',
    'DEUDOR':                     'bg-blue-100 text-blue-800',
    'SOLUCIONA ADMIN':            'bg-blue-100 text-blue-800',
}

const AUTO_CLOSE_MS = 10_000

function TaskToast({ order, onClose }) {
    // visible=false en el primer render para que la transition slide-in
    // funcione (translate-x-full → translate-x-0).
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 10)
        return () => clearTimeout(t)
    }, [])

    useEffect(() => {
        const t = setTimeout(() => onClose(), AUTO_CLOSE_MS)
        return () => clearTimeout(t)
    }, [onClose])

    const stateClass = STATE_BADGE[order.state] ?? 'bg-gray-100 text-gray-800'
    const modelo = [order.brand, order.type, order.model, order.device_color]
        .filter(Boolean).join(' ').trim()

    return (
        <div
            className={`w-80 bg-white border-l-4 border-blue-500 shadow-xl rounded p-3 transform transition-transform duration-300 ${visible ? 'translate-x-0' : 'translate-x-full'}`}
        >
            <div className='flex justify-between items-start mb-1'>
                <span className='text-sm font-bold text-blue-600'>Nueva tarea</span>
                <button
                    type='button'
                    onClick={onClose}
                    className='text-gray-400 hover:text-gray-700 text-xl leading-none px-1'
                    aria-label='Cerrar'>
                    ×
                </button>
            </div>
            <div className='text-sm font-semibold text-gray-900'>
                #{order.order_id} — {order.name} {order.surname}
            </div>
            {modelo && (
                <div className='text-xs text-gray-500 mt-0.5'>{modelo}</div>
            )}
            <div className='flex items-center justify-between mt-2'>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${stateClass}`}>
                    {order.state}
                </span>
                <a
                    href={`/messages/${order.order_id}`}
                    target='_blank' rel='noreferrer noopener'
                    className='text-sm font-semibold text-blue-600 hover:text-blue-800'>
                    Ver orden →
                </a>
            </div>
        </div>
    )
}

export default TaskToast
