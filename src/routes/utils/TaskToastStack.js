import React, { useEffect, useState, useCallback, useRef } from 'react'
import TaskToast from './TaskToast'

// Container global de toasts de tareas nuevas. Escucha el CustomEvent
// 'satweb:nueva-tarea' (emitido por useTaskNotifier) y apila un TaskToast
// por evento. Cada toast se auto-cierra a los 10s o cuando el operador
// toca la X. Pensado para montarse 1 sola vez en MainNavBar.
function TaskToastStack() {
    const [toasts, setToasts] = useState([])
    const nextIdRef = useRef(1)

    useEffect(() => {
        function handler(e) {
            const order = e?.detail
            if (!order || !order.order_id) return
            const id = nextIdRef.current++
            setToasts(prev => [...prev, { id, order }])
        }
        window.addEventListener('satweb:nueva-tarea', handler)
        return () => window.removeEventListener('satweb:nueva-tarea', handler)
    }, [])

    const remove = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    if (toasts.length === 0) return null
    return (
        // flex-col-reverse para que los más nuevos aparezcan arriba del stack.
        <div className='fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2'>
            {toasts.map(t => (
                <TaskToast key={t.id} order={t.order} onClose={() => remove(t.id)} />
            ))}
        </div>
    )
}

export default TaskToastStack
