import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';

function Branches() {
    const [branch, setBranch] = useState('');
    const [contact, setContact] = useState('');
    const [info, setInfo] = useState('');
    const [listBranches, setListBranches] = useState([])

    const navigate = useNavigate();

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get('http://localhost:3001/branches')
                .then(response => {
                    setListBranches(response.data)
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
            const response = await axios.post('http://localhost:3001/branches', {
            branch,
            contact,
            info
            });
            if (response.status === 200){
            alert("Sucursal agregada")
            window.location.reload();
            // navigate('/home')
            }
        } catch (error) {
            alert(error.response.data);
        }
    }

  
    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className='bg-white my-2 py-8 px-2 max-w-3xl mx-auto'>
                <h1 className="text-center text-5xl">Agregar sucursal</h1>
                <div className="p-4 max-w-xl mx-auto">
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
                            onClick={() => { navigate(`/home`) }} >
                                Volver
                        </button>
                    </form>
                </div>
                <div className="flex justify-center mb-10">
                    <table className="table-auto">
                        <thead>
                            <tr>
                                <th className="px-4 py-2">Sucursal</th>
                                <th className="px-4 py-2">Contacto</th>
                                <th className="px-4 py-2">Ubicación</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listBranches.map((branch) => (
                                <tr key={branch.idbranches}>
                                    <td className="border px-4 py-2" value={branch.branch}>{branch.branch}</td>
                                    <td className="border px-4 py-2" value={branch.contact}>{branch.contact}</td>
                                    <td className="border px-4 py-2" value={branch.info}>{branch.info}</td>
                                    <td>
                                        <button className="bg-green-500 hover:bg-green-700 border px-4 py-2 color"
                                        onClick={() => { navigate(`/updateBranches/${branch.idbranches}`) }} >
                                        Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Branches