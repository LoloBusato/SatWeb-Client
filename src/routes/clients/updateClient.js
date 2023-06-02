import React, { useEffect} from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';

function UpdateClient() {

    const navigate = useNavigate();
    const location = useLocation();
    const clientId = location.pathname.split("/")[2];

    useEffect(() => {
        const fetchClients = async () => {
            await axios.get('http://localhost:3001/clients')
                .then(response => {           
                    for (let i = 0; i < response.data.length; i++) {
                        if (response.data[i].idclients === Number(clientId)) {
                        document.getElementById("name").value = response.data[i].name;
                        document.getElementById("surname").value = response.data[i].surname;
                        document.getElementById("instagram").value = response.data[i].instagram;
                        document.getElementById("email").value = response.data[i].email;
                        document.getElementById("phone").value = response.data[i].phone;
                        document.getElementById("postal").value = response.data[i].postal;
                        }
                    }
                })
                .catch(error => {
                    console.error(error)
                })
        }
        fetchClients()
// eslint-disable-next-line
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        // Aquí es donde enviarías la información de inicio de sesión al servidor
        try {
            const formData = new FormData(event.target);
            const clientData = {
                name: formData.get('name'),
                surname: formData.get('surname'),
                email: formData.get('email'),
                instagram: formData.get('instagram'),
                phone: formData.get('phone'),
                postal: formData.get('postal'),
            };

            console.log(clientData)

            const response = await axios.put(`http://localhost:3001/clients/${clientId}`, clientData);
            if (response.status === 200){
            console.log("cliente modificado")
            navigate('/clients');
            }
        } catch (error) {
            alert(error.response.data);
        }
      }
  
    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className='bg-white my-2 py-8 px-2 max-w-2xl mx-auto'>
                <h1 className="text-5xl text-center">Editar cliente</h1>
                <div className="p-4 max-w-lg mx-auto">
                    <form onSubmit={handleSubmit} className="mb-4">
                        <div className="mb-2">
                            <div className='flex'>
                                <div className='w-full'>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Nombre: *</label>
                                    <input 
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="name"
                                        name="name" 
                                        placeholder="John"
                                    />
                                </div>
                                <div className='w-full'>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="surname">Apellido: *</label>
                                    <input 
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="surname" 
                                        name="surname" 
                                        placeholder="Doe"
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
                                        name="instagram" 
                                        placeholder="thedoniphone"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="email">Telefono:</label>                        
                                    <input 
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="phone" 
                                        name="phone" 
                                        placeholder="xx-xxxx-xxxx"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="email">Email:</label>
                                    <input 
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="email" 
                                        name="email" 
                                        placeholder="xxx@xxx.com"
                                    />  
                                </div>
                            </div>
                            <label className="block text-gray-700 font-bold my-2" htmlFor="email">Codigo Postal: (opcional)</label>                        
                            <input 
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                type="text" 
                                id="postal" 
                                name="postal" 
                                placeholder="1427"
                            />
                        </div>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Guardar
                        </button>
                        <button 
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            onClick={() => { navigate(`/clients`) }} >
                                Volver
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default UpdateClient