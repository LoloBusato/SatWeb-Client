import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';

function CreateUser() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [listUsers, setListUsers] = useState([])

    const navigate = useNavigate();

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get('http://localhost:3001/users')
                .then(response => {
                    setListUsers(response.data)
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
            const response = await axios.post('http://localhost:3001/users', {
            username,
            password
            });
            if (response.status === 200){
            alert("Usuario agregado")
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
                <div className="flex justify-center mb-10">
                    <table className="table-auto">
                        <thead>
                            <tr>
                                <th className="px-4 py-2">Usuario</th>
                                <th className="px-4 py-2">Contraseña</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listUsers.map((user) => (
                                <tr key={user.idusers}>
                                    <td className="border px-4 py-2" value={user.username}>{user.username}</td>
                                    <td className="border px-4 py-2" value={user.password}>{user.password}</td>
                                    <td>
                                        <button className="bg-green-500 hover:bg-green-700 border px-4 py-2 color"
                                        onClick={() => { navigate(`/updateUser/${user.idusers}`) }} >
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

export default CreateUser