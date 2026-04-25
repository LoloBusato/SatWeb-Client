import React, {useState, useEffect} from 'react'
import axios from 'axios'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'
import { useLocation, useNavigate } from 'react-router-dom';

function EditarOperaciones() {
    const [selectMovname, setSelectMovname] = useState({})
    // operationMovements: TODOS los movements de la operación (cajas + lado P&L).
    // Antes solo se editaban las cajas y el otro lado quedaba con valores
    // viejos → operación desbalanceada. Ahora se reescribe el set completo
    // en una transacción atómica (ver PUT /api/movements/:id, fix pareja).
    const [operationMovements, setOperationMovements] = useState([])
    const [inputs, setInputs] = useState({})

    const [isNotLoading, setIsNotLoading] = useState(true);

    const [dolar, setDolar] = useState(800)

    const navigate = useNavigate();
    const location = useLocation();
    const movnameId = parseInt(location.pathname.split("/")[2]);
    const branchId = JSON.parse(localStorage.getItem("branchId"))

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/movname/${branchId}`)
                .then(response => {
                    const filteredMovname = response.data.filter((item) => item.idmovname === movnameId)[0]
                    setSelectMovname(filteredMovname || {})
                })
                .catch(error => {
                    console.error(error)
                })

            const movementsResponse = await axios.get(`${SERVER}/movements/${branchId}`)
            const all = movementsResponse.data
            const filtered = all.filter((m) => m.movname_id === movnameId)
            setOperationMovements(filtered)
            // Pre-populate inputs con los unidades actuales (decimal → string).
            const initial = {}
            filtered.forEach(m => { initial[m.idmovements] = String(parseFloat(m.unidades)) })
            setInputs(initial)

            await axios.get(`https://api.bluelytics.com.ar/v2/latest`)
                .then(response => {
                    setDolar(response.data.blue.value_sell)
                })
                .catch(error => {
                    console.error(error)
                })
        }
        fetchStates()
    // eslint-disable-next-line
    }, []);

    const handleInputChange = (idmovements, value) => {
        setInputs(prev => ({ ...prev, [idmovements]: value }))
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!isNotLoading) return;
        setIsNotLoading(false)
        try {
            // Reconstruimos el array completo de movements (cajas + lado P&L)
            // con los valores nuevos del form. El backend hace DELETE + INSERT
            // atómico de TODOS los movements de la operación.
            const arrayMovements = []
            let montoTotal = 0
            operationMovements.forEach(m => {
                const raw = inputs[m.idmovements]
                const value = parseFloat(raw)
                if (Number.isNaN(value) || value === 0) return // saltar vacíos / 0
                arrayMovements.push([m.movcategories_id, value, movnameId, branchId])
                // montoTotal: solo cajas (tipo Cuentas), convertidas a pesos.
                // Mantiene el contrato existente con movname.monto.
                if ((m.tipo || '').includes('Cuentas')) {
                    if (m.es_dolar === 1) montoTotal += Math.abs(value) * dolar
                    else montoTotal += Math.abs(value)
                }
            })
            if (arrayMovements.length === 0) {
                setIsNotLoading(true)
                return alert('Insertar valores')
            }

            const responseMovements = await axios.put(`${SERVER}/movements/${movnameId}`, {
                arrayInsert: arrayMovements,
                montoTotal,
            })
            if (responseMovements.status === 200) {
                setIsNotLoading(true)
                alert('Valores actualizados')
                navigate('/librocontable')
            }
        } catch (error) {
            setIsNotLoading(true)
            const msg = error?.response?.data || 'Error al actualizar'
            alert(typeof msg === 'string' ? msg : 'Error al actualizar')
        }
    }

    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className="bg-white my-2 py-4 max-w-7xl mx-auto">
              <div className='text-center'>
                <h1 className="text-5xl font-bold mb-6">Editar operacion</h1>
                {/* Tabla con informacion que se esta cambiando */}
                <table className="mt-4 w-full">
                    <thead>
                        <tr>
                        <th className="px-4 py-2 border border-black">Id</th>
                        <th className="px-4 py-2 border border-black">Operacion</th>
                        <th className="px-4 py-2 border border-black">Monto</th>
                        <th className="px-4 py-2 border border-black">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className='text-center'>
                        <tr className="hover:bg-gray-100 border border-black">
                            <td className="px-4 py-2">{selectMovname.idmovname}</td>
                            <td className="px-4 py-2">{selectMovname.operacion}</td>
                            <td className="px-4 py-2">{selectMovname.monto}</td>
                            <td className="px-4 py-2">{selectMovname.fecha}</td>
                        </tr>
                    </tbody>
                </table>
                {/* Form con TODOS los movements (cajas + lado P&L) */}
                <form onSubmit={handleSubmit}>
                    <div className='w-full text-center'>
                        <label className="block text-gray-700 font-bold my-2 border-b-2">Movimientos (cajas + categorías P&L)</label>
                        <div className='flex flex-wrap'>
                            {operationMovements.map((m) => (
                            <div className='w-1/4 px-2 mb-2' key={m.idmovements}>
                                <label className="block text-gray-700 font-bold mb-1" htmlFor={`mv-${m.idmovements}`}>
                                    {m.categories} {m.es_dolar === 1 ? '(USD)' : '($)'}
                                </label>
                                <input
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    type="number"
                                    step="0.01"
                                    id={`mv-${m.idmovements}`}
                                    value={inputs[m.idmovements] ?? ''}
                                    onChange={(e) => handleInputChange(m.idmovements, e.target.value)}
                                />
                            </div>
                            ))}
                        </div>
                        <p className='text-sm text-gray-600 mt-2'>
                            Tip: el lado P&L (Reparaciones/Venta/CMV/etc.) suele tener signo opuesto al lado caja. Si cambiás el monto, ajustá ambos lados para mantener la operación balanceada.
                        </p>
                    </div>
                    <button type='submit' className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded">
                        Actualizar
                    </button>
                </form>
              </div>
            </div>
        </div>
    );
}

export default EditarOperaciones
