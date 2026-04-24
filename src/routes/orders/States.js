/*
    Rojo:
        REPARAR
        LLEGO REPUESTO
        COMPRAR REPUESTO
        REPARADO
        PRESUPUESTO ACEPTADO
        PRESUPUESTAR

    Verde:
        DIAGNOSTICAR
        CONSULTAR A CLIENTE
        RESPUESTA CLIENTE

    Azul:
        PRESUPUESTADO (ESPERANDO REPUESTA)
        ESPERANDO REPUESTO
        ESPERANDO RESPUESTA CLIENTE

    Sin color:
        NO REPARADO
        PRESUPUESTO RECHAZADO
        ENTREGADO

*/
import React, {useState, useEffect} from 'react'
import { useNavigate } from 'react-router-dom'
import { v2Get, v2Post, v2Delete } from '../utils/api'

function OrderStates() {
    const [state, setState] = useState('');
    const [color, setColor] = useState('');
    const [listStates, setListStates] = useState([])
    const [loadError, setLoadError] = useState('')

    const navigate = useNavigate();

    useEffect(() => {
        const fetchStates = async () => {
            try {
                const response = await v2Get('/states')
                setListStates(response.data.items ?? [])
                setLoadError('')
            } catch (error) {
                const status = error?.response?.status;
                const msg = error?.response?.data?.error?.message;
                console.error('GET /v2/states failed:', status, error?.response?.data ?? error?.message);
                if (status === 401) {
                    setLoadError('Sesión expirada. Volvé a iniciar sesión para gestionar estados.');
                } else {
                    setLoadError(`No se pudieron cargar los estados${msg ? ': ' + msg : ''}.`);
                }
            }
        }
        fetchStates()
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        try {
            const response = await v2Post('/states', { name: state, color });
            if (response.status === 201) {
                alert("estado agregado")
                window.location.reload();
            }
        } catch (error) {
            const msg = error?.response?.data?.error?.message
                ?? error?.response?.data
                ?? 'No se pudo guardar el estado';
            alert(typeof msg === 'string' ? msg : 'No se pudo guardar el estado');
        }
    }

    const eliminarElemento = async (id) => {
        try {
            await v2Delete(`/states/${id}`)
            alert("Estado eliminado correctamente")
            window.location.reload();
        } catch (error) {
            // 409 con details.activeOrders => el backend nos pide confirmación
            // para reasignar las órdenes activas al estado interno "Sin estado"
            // y después borrar. Si el admin confirma, reintentamos con force=true.
            const status = error?.response?.status;
            const activeOrders = error?.response?.data?.error?.details?.activeOrders;
            if (status === 409 && typeof activeOrders === 'number') {
                const ok = window.confirm(
                    `Este estado tiene ${activeOrders} orden(es) activa(s). ` +
                    `Al eliminarlo, todas pasarán a "Sin estado". ¿Confirmar?`
                );
                if (!ok) return;
                try {
                    await v2Delete(`/states/${id}?force=true`);
                    alert("Estado eliminado correctamente");
                    window.location.reload();
                } catch (err2) {
                    const msg2 = err2?.response?.data?.error?.message
                        ?? 'No se pudo eliminar el estado';
                    alert(typeof msg2 === 'string' ? msg2 : 'No se pudo eliminar el estado');
                }
                return;
            }
            const msg = error?.response?.data?.error?.message
                ?? 'No se pudo eliminar el estado';
            alert(typeof msg === 'string' ? msg : 'No se pudo eliminar el estado');
        }
    }

    return (
        <div>
            <div className="flex justify-center my-5">
                <h1 className="text-5xl">Agregar estado</h1>
            </div>
            <div className="p-4 max-w-lg mx-auto">
                <form onSubmit={handleSubmit} className="mb-4">
                    <div className="mb-2">
                        <div className='flex'>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Estado: *</label>
                                <input
                                    required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    type="text"
                                    id="state"
                                    placeholder="DIAGNOSTICAR"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className='flex'>
                            <div>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="email">Color:</label>
                                <input
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    type="text"
                                    id="color"
                                    placeholder="Rojo"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        Guardar
                    </button>
                    <button
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        onClick={() => { navigate(`/home`) }} >
                            Volver
                    </button>
                </form>
            </div>
            {loadError && (
                <div className="flex justify-center mb-4">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">{loadError}</div>
                </div>
            )}
            <div className="flex justify-center mb-10">
                <table className="table-auto">
                    <thead>
                        <tr>
                            <th className="px-4 py-2">Estado</th>
                            <th className="px-4 py-2">Color</th>
                            <th className="px-4 py-2">Órdenes activas</th>
                        </tr>
                    </thead>
                    <tbody>
                        {listStates.map((s) => (
                            <tr key={s.id}>
                                <td className="border px-4 py-2">{s.name}</td>
                                <td className="border px-4 py-2">{s.color}</td>
                                <td className="border px-4 py-2 text-center">{s.activeOrdersCount ?? 0}</td>
                                <td>
                                    <button className="bg-green-500 hover:bg-green-700 border px-4 py-2 color"
                                    onClick={() => { navigate(`/updateStates/${s.id}`) }} >
                                    Editar
                                    </button>
                                </td>
                                <td>
                                    <button className="bg-red-500 hover:bg-red-700 border px-4 py-2 color"
                                    onClick={() => eliminarElemento(s.id)} >
                                    Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default OrderStates
