import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from './MainNavBar';
import SERVER from '../server'
import Select from 'react-select';

function Orders() {
    const [clients, setClients] = useState([])
    const [listaDevice, setListaDevice] = useState([])
    const [grupos, setGrupos] = useState([])
    const [listaEstados, setStates] = useState([])
    const [branches, setBranches] = useState([])

    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')
    
    const [estadoId, setEstadoId] = useState([])
    const [sucursalId, setSucursalId] = useState([])
    const [grupoId, setGrupoId] = useState([])

    const navigate = useNavigate();

    const defaultBranchId = JSON.parse(localStorage.getItem("branchId"))

    useEffect(() => {
        const fetchClients = async () => {
            await axios.get(`${SERVER}/clients`)
                .then(response => {
                    setClients(response.data)
                })
                .catch(error => {
                    console.error(error)
                })

            await axios.get(`${SERVER}/devices`)
                .then(response => {
                    setListaDevice(response.data);
                })
                .catch(error => {
                    console.error(error);
                });

            await axios.get(`${SERVER}/states`)
                .then(response => {
                    setStates(response.data);
                })
                .catch(error => {
                    console.error(error);
                });

            await axios.get(`${SERVER}/grupousuarios`)
                .then(response => {
                    setGrupos(response.data);
                })
                .catch(error => {
                    console.error(error);
                });

            await axios.get(`${SERVER}/branches`)
                .then(response => {
                    setBranches(response.data);
                })
                .catch(error => {
                    console.error(error);
                });
        }
        fetchClients()
    }, []);
    useEffect(() => {
        setSucursalId(branches
            .filter(sucursal => sucursal.idbranches === defaultBranchId)
            .map((sucursal) => ({label: sucursal.branch, value: sucursal.idbranches})))
    }, [branches, defaultBranchId])

    const [isNotLoading, setIsNotLoading] = useState(true);
    const [deviceId, setDeviceId] = useState('')

    async function handleSubmit(event) {
        event.preventDefault();
        if (isNotLoading) {
            setIsNotLoading(false)
            let clientId = "";
            // Aquí es donde enviarías la información de inicio de sesión al servidor
            try {
                const formData = new FormData(event.target);
                const clientData = {
                    name: formData.get('name').trim(),
                    surname: formData.get('surname').trim(),
                    email: formData.get('email').trim(),
                    instagram: formData.get('instagram').trim(),
                    phone: formData.get('phone').trim(),
                    postal: formData.get('postal').trim(),
                };
                if(clientData.email === "" && clientData.instagram === "" && clientData.phone === "") {
                    setIsNotLoading(true)
                    return alert("Agregar algun metodo de contacto al cliente")
                } else{
                    const responseClient = await axios.post(`${SERVER}/clients`, clientData);
                    if (responseClient.status === 200){
                        clientId = responseClient.data[0].idclients
                        // navigate('/home')
                    } 
                }
    
                const fechaHoraBuenosAires = new Date().toLocaleString("en-IN", {timeZone: "America/Argentina/Buenos_Aires", hour12: false}).replace(',', '');
    
                const orderData = {
                    client_id: parseInt(clientId),
                    device_id: parseInt(deviceId),
                    branches_id: sucursalId.value,
                    state_id: estadoId,
                    problem: formData.get('problem').trim(),
                    password: formData.get('password').trim(),
                    accesorios: formData.get('accesorios').trim(),
                    serial: formData.get('serial').trim(),
                    device_color: formData.get('color').trim(),
                    users_id: grupoId,
                    created_at: fechaHoraBuenosAires.split(' ')[0]
                }
    
                let insertedId
                const responseOrders = await axios.post(`${SERVER}/orders`, orderData);
                if (responseOrders.status === 200){
                    insertedId = responseOrders.data.insertId
                    setIsNotLoading(true)
                    navigate(`/printOrder/${insertedId}`) 
                } 
    
            } catch (error) {
                alert(error.response.data);
            }
        }
    }

    const handleClienteSeleccionado = (cliente) => {
        setNombre(cliente.name);
        setApellido(cliente.surname);
        document.getElementById("instagram").value = cliente.instagram;
        document.getElementById("email").value = cliente.email;
        document.getElementById("phone").value = cliente.phone;
        document.getElementById("postal").value = cliente.postal;
        // aquí puedes utilizar los datos del cliente seleccionado para autocompletar otros inputs
    };
  
    return (
        <div className='bg-gray-300 min-h-screen'>
            <MainNavBar />
            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="bg-gray-100 p-2 mt-1">
                    <div className="flex justify-between px-2 bg-blue-400">
                        <h1 className="text-xl text-white">Agregando reparacion</h1>
                        <div>
                            <button 
                                className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                                onClick={() => { navigate(`/home`) }} >
                                    Volver
                            </button>
                            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline">
                                Guardar
                            </button>
                        </div>
                    </div>
                    {/* Cliente */}
                    <div className="mb-1 bg-blue-100 p-2">
                        <label>Cliente</label>
                        <div className='flex'>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Nombre: *</label>
                                <input 
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                    type="text" 
                                    id="name" 
                                    name="name" 
                                    placeholder="John"
                                    required
                                    value={nombre}
                                    onChange={(event) => setNombre(event.target.value)}
                                />  
                            </div>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="surname">Apellido: *</label>
                                <input 
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                    type="text" 
                                    id="surname" 
                                    name="surname" 
                                    required
                                    placeholder="Doe"
                                    value={apellido}
                                    onChange={(event) => setApellido(event.target.value)}
                                />
                            </div>
                        </div>
                        {nombre &&  (
                            <ul className='bg-gray-100 absolute'>
                                {clients
                                    .filter((client) => 
                                        String(client.name).toLowerCase().includes(nombre.toLowerCase()) &&
                                        String(client.surname).toLowerCase().includes(apellido.toLowerCase())
                                        )
                                    .map((client) => 
                                        <li className='border px-2 py-1' key={client.idclients} onClick={() => handleClienteSeleccionado(client)}>{client.name} {client.surname} - {client.email} {client.instagram} {client.phone}</li>
                                )}
                            </ul>
                        )}
                        <label className="flex justify-center text-gray-700 font-bold mt-2" htmlFor="contacto">Contacto *</label>
                        <div className='flex'>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="email">Instagram:</label>
                                <input 
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                    type="text" 
                                    id="instagram" 
                                    placeholder="thedoniphone"
                                    name="instagram" 
                                />
                            </div>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="email">Telefono:</label>                        
                                <input 
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                    type="text" 
                                    id="phone" 
                                    name="phone" 
                                    placeholder="xx-xxxx-xxxx"
                                />
                            </div>
                            <div className='w-full'>
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
                    {/* Equipo */}
                    <div className="mb-1 bg-blue-100 p-2">
                        <label>
                            Equipo*
                        </label>
                        <div className='flex'>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" >Modelo: *</label>
                                <Select 
                                required
                                options={listaDevice.map((device) => ({label: device.model, value: device.iddevices}))}
                                placeholder='Seleccionar modelo'
                                onChange={ (e) => setDeviceId(e.value)  }
                                />
                                <button className="mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                onClick={() => { navigate(`/devices`) }} >
                                    Agregar modelo
                                </button>
                            </div>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="surname">Serial number/ IMEI: *</label>
                                <input 
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                    type="text" 
                                    id="serial" 
                                    name="serial" 
                                    placeholder=""
                                    required
                                />
                            </div>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="surname">Contraseña: *</label>
                                <input 
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                    type="text" 
                                    id="password" 
                                    name="password" 
                                    placeholder="123456 / no pasa"
                                    required
                                />
                            </div>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="surname">Color: *</label>
                                <input 
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                    type="text" 
                                    id="color" 
                                    name="color" 
                                    placeholder="Rojo"
                                    required
                                />
                            </div>
                        </div>
                        <div className='w-full'>
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="surname">Accesorios: *</label>
                            <textarea 
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                type="text" 
                                id="accesorios" 
                                name="accesorios" 
                                placeholder="accesorios: cargador, funda"
                                required
                            />
                        </div>
                        <div className='w-full'>
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="surname">Falla: *</label>
                            <textarea 
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                type="text" 
                                id="problem" 
                                name="problem" 
                                placeholder="falla"
                                required
                            />
                        </div>
                    </div>
                    {/* Detalles */}
                    <div className="mb-1 bg-blue-100 p-2">
                        <label>
                            Detalles*
                        </label>
                        <div className='flex'>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2">Estado: *</label>
                                <Select
                                required
                                options={ listaEstados.map((estado) => ({label: estado.state, value: estado.idstates})) }
                                placeholder='Seleccionar un estado inicial'
                                onChange={(e) => setEstadoId(e.value)}
                                menuPlacement="auto"
                                />
                                <button className="mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                onClick={() => { navigate(`/orderStates`) }} >
                                    Agregar estado
                                </button>
                            </div>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2">Sucursal: *</label>
                                <Select
                                required
                                value={sucursalId}
                                options={ branches.map((sucursal) => ({label: sucursal.branch, value: sucursal.idbranches})) }
                                placeholder='Sucursal'
                                onChange={(e) => setSucursalId(e)}
                                menuPlacement="auto"
                                />
                            </div>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2">Asignar: *</label>
                                <Select
                                required
                                options={ grupos.map((grupo) => ({label: grupo.grupo, value: grupo.idgrupousuarios})) }
                                placeholder='Asignar orden'
                                onChange={(e) => setGrupoId(e.value)}
                                menuPlacement="auto"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end px-2 bg-blue-400">
                        <button 
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                            onClick={() => { navigate(`/home`) }} >
                                Volver
                        </button>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline">
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Orders