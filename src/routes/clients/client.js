import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';

function Client() {
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [instagram, setInstagram] = useState('');
    const [phone, setPhone] = useState('');
    const [postal, setPostal] = useState('');
    const [clients, setClients] = useState([])

    const navigate = useNavigate();

    useEffect(() => {
        const fetchClients = async () => {
            await axios.get('http://localhost:3001/clients')
                .then(response => {
                    setClients(response.data)
                })
                .catch(error => {
                    console.error(error)
                })
        }
        fetchClients()
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        // Aquí es donde enviarías la información de inicio de sesión al servidor
        try {
            const response = await axios.post('http://localhost:3001/clients', {
            name,
            surname,
            email,
            instagram,
            phone,
            postal
            });
            if (response.status === 200){
                console.log("cliente agregado")
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
            <div className='bg-white my-2 py-8 px-2 max-w-4xl mx-auto'>
                <h1 className="text-5xl text-center">Agregar cliente</h1>
                <div className="p-4 max-w-xl mx-auto">
                    <form onSubmit={handleSubmit} className="mb-4">
                        <div className="mb-2">
                            <div className='flex'>
                                <div className='w-full'>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Nombre: *</label>
                                    <input 
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="name" 
                                        placeholder="John"
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div className='w-full'>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="surname">Apellido: *</label>
                                    <input 
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="name" 
                                        placeholder="Doe"
                                        value={surname} 
                                        onChange={(e) => setSurname(e.target.value)}
                                    />
                                </div>
                            </div>
                            <label className="flex justify-center text-gray-700 font-bold mt-2" htmlFor="contacto">Contacto *</label>
                            <div className='flex'>
                                <div>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="email">Instagram:</label>
                                    <input 
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="instagram" 
                                        placeholder="thedoniphone"
                                        value={instagram} 
                                        onChange={(e) => setInstagram(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="email">Telefono:</label>                        
                                    <input 
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="phone" 
                                        placeholder="xx-xxxx-xxxx"
                                        value={phone} 
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="email">Email:</label>
                                    <input 
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="email" 
                                        placeholder="xxx@xxx.com"
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)}
                                    />  
                                </div>
                            </div>
                            <label className="block text-gray-700 font-bold my-2" htmlFor="email">Codigo Postal: (opcional)</label>                        
                            <input 
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                type="text" 
                                id="postal" 
                                placeholder="1427"
                                value={postal} 
                                onChange={(e) => setPostal(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Guardar
                        </button>
                        <button 
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            onClick={() => { navigate(`/device`) }} >
                                Volver
                        </button>
                    </form>
                </div>
                <div className="mb-10">
                    <table className="table-auto mx-auto">
                        <thead>
                            <tr>
                                <th className="px-4 py-2">Nombre</th>
                                <th className="px-4 py-2">Apellido</th>
                                <th className="px-4 py-2">Email</th>
                                <th className="px-4 py-2">Instagram</th>
                                <th className="px-4 py-2">Telefono</th>
                                <th className="px-4 py-2">Codigo Postal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(client => (
                            <tr key={client.idclients}>
                                <td className="border px-4 py-2" value={client.name}>{client.name}</td>
                                <td className="border px-4 py-2" value={client.surname}>{client.surname}</td>
                                <td className="border px-4 py-2" value={client.email}>{client.email}</td>
                                <td className="border px-4 py-2" value={client.instagram}>{client.instagram}</td>
                                <td className="border px-4 py-2" value={client.phone}>{client.phone}</td>
                                <td className="border px-4 py-2" value={client.postal}>{client.postal}</td>
                                <td>
                                    <button className="bg-green-500 border px-4 py-2 color"
                                    onClick={() => { navigate(`/updateClient/${client.idclients}`) }} >
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

export default Client