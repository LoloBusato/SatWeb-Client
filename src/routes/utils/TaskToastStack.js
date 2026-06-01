import React, { useEffect, useState, useCallback, useRef } from 'react'
import TaskToast from './TaskToast'

// Container global de toasts. Escucha dos CustomEvents emitidos por
// useTaskNotifier:
//   - 'satweb:nueva-tarea'         → entity es una orden (legacy nombre)
//   - 'satweb:nueva-task-instance' → entity es una task instance
// Apila un TaskToast por evento. Auto-cierre 10s o X. Montado 1 vez
// en MainNavBar.
function TaskToastStack() {
    const [toasts, setToasts] = useState([])
    const nextIdRef = useRef(1)

    useEffect(() => {
        function handleOrder(e) {
            const order = e?.detail
            if (!order || !order.order_id) return
            const id = nextIdRef.current++
            setToasts(prev => [...prev, { id, entity: { ...order, kind: 'order' } }])
        }
        function handleTask(e) {
            const inst = e?.detail
            if (!inst || !inst.task_id) return
            const id = nextIdRef.current++
            setToasts(prev => [...prev, { id, entity: { ...inst, kind: 'task' } }])
        }
        window.addEventListener('satweb:nueva-tarea', handleOrder)
        window.addEventListener('satweb:nueva-task-instance', handleTask)
        return () => {
            window.removeEventListener('satweb:nueva-tarea', handleOrder)
            window.removeEventListener('satweb:nueva-task-instance', handleTask)
        }
    }, [])

    const remove = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    if (toasts.length === 0) return null
    return (
        <div className='fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2'>
            {toasts.map(t => (
                <TaskToast key={t.id} entity={t.entity} onClose={() => remove(t.id)} />
            ))}
        </div>
    )
}

export default TaskToastStack
