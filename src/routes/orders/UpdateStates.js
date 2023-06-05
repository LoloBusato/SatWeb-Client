import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import SERVER from '../server'

function UpdateStates() {
    const [state, setState] = useState('');
    const [color, setColor] = useState('');

    const navigate = useNavigate();
    const location = useLocation();
    const stateId = location.pathname.split("/")[2];

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/states`)
                .then(response => {
                    for (let i = 0; i < response.data.length; i++) {
                        if (response.data[i].idstates === Number(stateId)) {
                            setState(response.data[i].state);
                            setColor(response.data[i].color);
                        }
                    }
                })
                .catch(error => {
                    alert(error.response.data)
                })
        }
        fetchStates()
// eslint-disable-next-line
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        // Aquí es donde enviarías la información de inicio de sesión al servidor
        try {
            const response = await axios.put(`${SERVER}/states/${stateId}`, {
            state,
            color
            });
            if (response.status === 200){
            console.log("estado actualizado")
            navigate('/orderStates')
            }
        } catch (error) {
            console.log(error.response.data);
        }
      }
  
    return (
        <div>
            <div className="flex justify-center my-5">
                <h1 className="text-5xl">Actualizar estado</h1>
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
                        onClick={() => { navigate(`/orderStates`) }} >
                            Volver
                    </button>
                </form>
            </div>
        </div>
    );
}

export default UpdateStates