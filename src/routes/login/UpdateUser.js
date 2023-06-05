import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

function UpdateUser() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    
    const location = useLocation();
    const userId = location.pathname.split("/")[2];
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/users`)
                .then(response => {
                    for (let i = 0; i < response.data.length; i++) {
                        if (response.data[i].idusers === Number(userId)) {
                            setUsername(response.data[i].username);
                            setPassword(response.data[i].password);
                        }
                    }
                })
                .catch(error => {
                    console.error(error)
                })
        }
        fetchStates()
    // eslint-disable-next-line
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        // Aquí es donde enviarías la información de inicio de sesión al servidor
        try {
            const response = await axios.put(`${SERVER}/users/${userId}`, {
            username,
            password
            });
            if (response.status === 200){
            alert("Usuario Actualizado")
            navigate('/createUser')
            }
        } catch (error) {
            alert(error.response.data);
        }
    }
  
    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className='bg-white my-2 py-8 px-2 max-w-2xl mx-auto'>
                <h1 className="text-center text-5xl">Agregar usuario</h1>
                <div className="p-4 max-w-lg mx-auto">
                    <form onSubmit={handleSubmit} className="mb-4">
                        <div className="mb-2">
                            <div className='flex'>
                                <div className='w-full'>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Username: *</label>
                                    <input 
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="username" 
                                        value={username} 
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                                <div className='w-full'>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Contraseña: *</label>
                                    <input 
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="password" 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)}
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
            </div>
        </div>
    );
}

export default UpdateUser