import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server.js'

function UpdateBranch() {
    const [branch, setBranch] = useState('');
    const [contact, setContact] = useState('');
    const [info, setInfo] = useState('');

    const navigate = useNavigate();
    const location = useLocation();
    const branchId = location.pathname.split("/")[2];

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/branches`)
                .then(response => {
                    for (let i = 0; i < response.data.length; i++) {
                        if (response.data[i].idbranches === Number(branchId)) {
                            setBranch(response.data[i].branch);
                            setContact(response.data[i].contact);
                            setInfo(response.data[i].info);
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
            const response = await axios.put(`${SERVER}/branches/${branchId}`, {
            branch,
            contact,
            info
            });
            if (response.status === 200){
            console.log("branch actualizado")
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
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Sucursal: *</label>
                                    <input 
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="branch" 
                                        placeholder="Belgrano"
                                        value={branch} 
                                        onChange={(e) => setBranch(e.target.value)}
                                    />
                                </div>
                                <div className='w-full'>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Contacto: *</label>
                                    <input 
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="contact" 
                                        placeholder="11-6528-8853 - doniphoneinc@gmail.com"
                                        value={contact} 
                                        onChange={(e) => setContact(e.target.value)}
                                    />
                                </div>
                                <div className='w-full'>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Ubicación: *</label>
                                    <textarea 
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="info" 
                                        placeholder="14 de Julio 1454 - Belgrano, Capital Federal - Ciudad Autónoma de Buenos Aires"
                                        value={info} 
                                        onChange={(e) => setInfo(e.target.value)}
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