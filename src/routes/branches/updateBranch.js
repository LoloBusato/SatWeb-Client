import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server.js'

function UpdateBranch() {
    const [branch, setBranch] = useState('');
    const [ganancia, setGanancia] = useState('');
    const [contact, setContact] = useState('');
    const [info, setInfo] = useState('');

    const navigate = useNavigate();
    const location = useLocation();
    const branchId = location.pathname.split("/")[2];

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/branches`)
                .then(response => {
                    const sucursal = response.data.filter((sucursal) => sucursal.idbranches === Number(branchId))[0]
                    setBranch(sucursal.branch);
                    setContact(sucursal.contact);
                    setInfo(sucursal.info);
                    setGanancia(sucursal.ganancia);
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
            const response = await axios.put(`${SERVER}/branches/${branchId}`, {
            branch,
            contact,
            info,
            ganancia
            });
            if (response.status === 200){
                alert("Sucursal actualizada")
                navigate('/branches')
            }
        } catch (error) {
            console.log(error.response.data);
        }
      }
  
    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className='bg-white my-2 py-8 px-2 max-w-2xl mx-auto'>
                <h1 className="text-5xl text-center">Actualizar sucursal</h1>
                <div className="p-4 max-w-lg mx-auto">
                    <form onSubmit={handleSubmit} className="mb-4">
                        <div className="mb-2">
                            <div>
                                <div className='w-full'>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="branch">Sucursal: *</label>
                                    <input 
                                        required
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="branch" 
                                        placeholder="Belgrano"
                                        value={branch} 
                                        onChange={(e) => setBranch(e.target.value)}
                                    />
                                </div>
                                <div className='w-full'>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="contact">Contacto: *</label>
                                    <input 
                                        required
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="contact" 
                                        placeholder="11-6528-8853 - doniphoneinc@gmail.com"
                                        value={contact} 
                                        onChange={(e) => setContact(e.target.value)}
                                    />
                                </div>
                                <div className='w-full'>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="info">Ubicación: *</label>
                                    <textarea 
                                        required
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="info" 
                                        placeholder="14 de Julio 1454 - Belgrano, Capital Federal - Ciudad Autónoma de Buenos Aires"
                                        value={info} 
                                        onChange={(e) => setInfo(e.target.value)}
                                    />
                                </div>   
                                <div className='w-full'>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="ganancia">Ganancia: * Elegir un número entre el 0 y 1 para representar cuanto se queda la sucursal principal. Ej: Si la sucursal se lleva el 25% de la ganancia el número tiene que ser 0.75.</label>
                                    <input 
                                        required
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="number" 
                                        id="ganancia" 
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        placeholder="0-1"
                                        value={ganancia} 
                                        onChange={(e) => setGanancia(e.target.value)}
                                    />
                                </div>                                
                            </div>
                        </div>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Guardar
                        </button>
                        <button 
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            onClick={() => { navigate(`/branches`) }} >
                                Volver
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default UpdateBranch