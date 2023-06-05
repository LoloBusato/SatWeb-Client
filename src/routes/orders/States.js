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
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import SERVER from '../server'

function OrderStates() {
    const [state, setState] = useState('');
    const [color, setColor] = useState('');
    const [listStates, setListStates] = useState([])

    const navigate = useNavigate();

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/states`)
                .then(response => {
                    setListStates(response.data)
                })
                .catch(error => {
                    console.error(error)
                })
        }
        fetchStates()
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        // Aquí es donde enviarías la información de inicio de sesión al servidor
        try {
            const response = await axios.post(`${SERVER}/states`, {
            state,
            color
            });
            if (response.status === 200){
            console.log("estado agregado")
            window.location.reload();
            // navigate('/home')
            }
        } catch (error) {
            alert(error.response.data);
        }
      }

      const eliminarElemento = async (id) => {
        try {        
            await axios.delete(`${SERVER}/states/${id}`)
            alert("Estado eliminado correctamente")
            window.location.reload();
        } catch (error) {
            console.error(error)
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
            <div className="flex justify-center mb-10">
                <table className="table-auto">
                    <thead>
                        <tr>
                            <th className="px-4 py-2">Estado</th>
                            <th className="px-4 py-2">Color</th>
                        </tr>
                    </thead>
                    <tbody>
                        {listStates.map((state) => (
                            <tr key={state.idstates}>
                                <td className="border px-4 py-2" value={state.state}>{state.state}</td>
                                <td className="border px-4 py-2" value={state.color}>{state.color}</td>
                                <td>
                                    <button className="bg-green-500 hover:bg-green-700 border px-4 py-2 color"
                                    onClick={() => { navigate(`/updateStates/${state.idstates}`) }} >
                                    Editar
                                    </button>
                                </td>
                                <td>
                                    <button className="bg-red-500 hover:bg-red-700 border px-4 py-2 color"
                                    onClick={() => eliminarElemento(state.idstates)} >
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