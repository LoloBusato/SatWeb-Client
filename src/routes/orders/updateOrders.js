import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import SERVER from '../server'

function UpdateOrders() {
    const [listaDevice, setListaDevice] = useState([])
    const [grupoUsuarios, setGrupoUsuarios] = useState([])
    const [estados, setStates] = useState([])
    const [branches, setBranches] = useState([])
    const [order, setOrder] = useState([])

    const navigate = useNavigate();
    const location = useLocation();
    const orderId = location.pathname.split("/")[2];

    useEffect(() => {
        const fetchClients = async () => {
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
                    setGrupoUsuarios(response.data);
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

            await axios.get(`${SERVER}/orders`)
                .then(response => {
                    for (let i = 0; i < response.data.length; i++) {
                        if (response.data[i].order_id === Number(orderId)) {

                            setOrder(response.data[i]);

                            document.getElementById("model").value = response.data[i].iddevices;
                            document.getElementById("serial").value = response.data[i].serial;
                            document.getElementById("password").value = response.data[i].password;
                            document.getElementById("color").value = response.data[i].device_color;
                            document.getElementById("accesorios").value = response.data[i].accesorios;
                            document.getElementById("problem").value = response.data[i].problem;

                            document.getElementById("state").value = response.data[i].idstates;
                            document.getElementById("branch").value = response.data[i].idbranches;
                            document.getElementById("user").value = response.data[i].idusers;

                        }
                    }
                })
                .catch(error => {
                    console.error(error);
                });
        }
        fetchClients()
    // eslint-disable-next-line
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        // Aquí es donde enviarías la información de inicio de sesión al servidor
        try {
            const formData = new FormData(event.target);
            
            const deviceId = document.getElementById("model").value
            const stateId = document.getElementById("state").value
            const branchId = document.getElementById("branch").value
            const userId = document.getElementById("user").value

            const orderData = {
                device_id: parseInt(deviceId),
                branches_id: parseInt(branchId),
                state_id: parseInt(stateId),
                problem: formData.get('problem').trim(),
                password: formData.get('password').trim(),
                device_color: formData.get('color').trim(),
                accesorios: formData.get('accesorios').trim(),
                serial: formData.get('serial').trim(),
                users_id: parseInt(userId),
            }

            console.log(orderData)

            const responseOrders = await axios.put(`${SERVER}/orders/${order.order_id}`, orderData);
            if (responseOrders.status === 200){
                alert("Orden actualizada")
                navigate(`/messages/${order.order_id}`)
            } 
        } catch (error) {
            alert(error.response.data);
        }
      }
  
    return (
        <div className='bg-gray-300 pb-40'>
            <div className="flex justify-center py-5">
                <h1 className="text-5xl">Editar orden</h1>
            </div>
            <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="bg-gray-100 pt-1">
                    <div className="flex justify-end px-2 gap-x-5">
                        <button 
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            onClick={() => { navigate(`/home`) }} >
                                Volver
                        </button>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Guardar
                        </button>
                    </div>
                    {/* Equipo */}
                    <div className="m-2 bg-blue-100 p-2">
                        <label>
                            Equipo*
                        </label>
                        <div className='flex'>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="surname">Modelo: *</label>
                                <select name="model" id="model" className="appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline">
                                    <option value="" disabled selected>Seleccionar un modelo</option>
                                    {listaDevice.map((device) => (
                                        <option key={device.iddevices} value={device.iddevices}>{device.model}</option>
                                    ))}
                                </select>
                                <button className="mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                onClick={() => { navigate(`/device`) }} >
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
                            />
                        </div>
                    </div>
                    {/* Detalles */}
                    <div className="m-2 bg-blue-100 p-2">
                        <label>
                            Detalles*
                        </label>
                        <div className='flex'>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="state">Estado: *</label>
                                <select name="state" id="state" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline">
                                    <option value="" disabled selected>Seleccionar un estado inicial</option>
                                    {estados.map((state) => (
                                        <option key={state.idstates} value={state.idstates}>{state.state}</option>
                                    ))}
                                </select>
                                <button className="mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                onClick={() => { navigate(`/orderStates`) }} >
                                    Agregar estado
                                </button>
                            </div>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="asignado">Sucursal: *</label>
                                <select name="branch" id="branch" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline">
                                    <option value="" disabled selected>Sucursal</option>
                                    {branches.map((branch) => (
                                        <option key={branch.idbranches} value={branch.idbranches}>{branch.branch}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="asignado">Asignar: *</label>
                                <select name="user" id="user" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline">
                                    <option value="" disabled selected>Asignar orden</option>
                                    {grupoUsuarios.map((grupo) => (
                                        <option key={grupo.idgrupousuarios} value={grupo.idgrupousuarios}>{grupo.grupo}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end px-2 gap-x-5">
                        <button 
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            onClick={() => { navigate(`/home`) }} >
                                Volver
                        </button>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default UpdateOrders