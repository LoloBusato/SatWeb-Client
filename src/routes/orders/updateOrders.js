import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import SERVER from '../server'
import Select from 'react-select'

function UpdateOrders() {
    const [listaDevice, setListaDevice] = useState([])
    const [grupoUsuarios, setGrupoUsuarios] = useState([])
    const [estados, setStates] = useState([])
    const [branches, setBranches] = useState([])
    const [order, setOrder] = useState([])

    const [defaultModelo, setDefaultModelo] = useState([])
    const [defaultEstado, setDefaultEstado] = useState([])
    const [defaultSucursal, setDefaultSucursal] = useState([])
    const [defatulGrupo, setDefaultGrupo] = useState([])

    const [modelo, setModelo] = useState([])
    const [estado, setEstado] = useState([])
    const [sucursal, setSucursal] = useState([])
    const [grupo, setGrupo] = useState([])

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
                    const orden = response.data.filter((ordenes) => ordenes.order_id === Number(orderId))[0]

                    setOrder(orden);

                    setDefaultEstado(orden.idstates)
                    setDefaultGrupo(orden.users_id)
                    setDefaultModelo(orden.iddevices)
                    setDefaultSucursal(orden.idbranches)

                    document.getElementById("serial").value = orden.serial;
                    document.getElementById("password").value = orden.password;
                    document.getElementById("color").value = orden.device_color;
                    document.getElementById("accesorios").value = orden.accesorios;
                    document.getElementById("problem").value = orden.problem;
                })
                .catch(error => {
                    console.error(error);
                });
        }
        fetchClients()
    // eslint-disable-next-line
    }, []);
    useEffect(() => {
        setSucursal(branches
            .filter(sucursal => sucursal.idbranches === defaultSucursal)
            .map((sucursal) => ({label: sucursal.branch, value: sucursal.idbranches})))
    }, [branches, defaultSucursal])
    useEffect(() => {
        setEstado(estados
            .filter(estado => estado.idstates === defaultEstado)
            .map((estado) => ({label: estado.state, value: estado.idstates})))
    }, [estados, defaultEstado])
    useEffect(() => {
        setModelo(listaDevice
            .filter(modelo => modelo.iddevices === defaultModelo)
            .map((modelo) => ({label: modelo.model, value: modelo.iddevices})))
    }, [listaDevice, defaultModelo])
    useEffect(() => {
        setGrupo(grupoUsuarios
            .filter(grupo => grupo.idgrupousuarios === defatulGrupo)
            .map((grupo) => ({label: grupo.grupo, value: grupo.idgrupousuarios})))
    }, [grupoUsuarios, defatulGrupo])

    async function handleSubmit(event) {
        event.preventDefault();
        // Aquí es donde enviarías la información de inicio de sesión al servidor
        try {
            const formData = new FormData(event.target);

            const orderData = {
                device_id: modelo[0].value,
                branches_id: sucursal[0].value,
                state_id: estado[0].value,
                problem: formData.get('problem').trim(),
                password: formData.get('password').trim(),
                device_color: formData.get('color').trim(),
                accesorios: formData.get('accesorios').trim(),
                serial: formData.get('serial').trim(),
                users_id: grupo[0].value,
            }
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
                                <label className="block text-gray-700 font-bold mb-2">Modelo: *</label>
                                <Select
                                required
                                value={modelo}
                                options={ listaDevice.map((modelo) => ({label: modelo.model, value: modelo.iddevices})) }
                                placeholder='Seleccionar modelo'
                                onChange={(e) => setModelo([e])}
                                menuPlacement="auto"
                                />
                                <button className="mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                onClick={() => { navigate(`/device`) }} >
                                    Agregar modelo
                                </button>
                            </div>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="surname">Serial number/ IMEI: *</label>
                                <input 
                                    required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                    type="text" 
                                    id="serial" 
                                    name="serial" 
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
                    <div className="m-2 bg-blue-100 p-2">
                        <label>
                            Detalles*
                        </label>
                        <div className='flex'>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2">Estado: *</label>
                                <Select
                                required
                                value={estado}
                                options={ estados.map((estado) => ({label: estado.state, value: estado.idstates})) }
                                placeholder='Seleccionar un estado'
                                onChange={(e) => setEstado([e])}
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
                                value={sucursal}
                                options={ branches.map((sucursal) => ({label: sucursal.branch, value: sucursal.idbranches})) }
                                placeholder='Sucursal'
                                onChange={(e) => setSucursal([e])}
                                menuPlacement="auto"
                                />
                            </div>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="asignado">Asignar: *</label>
                                <Select
                                required
                                value={grupo}
                                options={ grupoUsuarios.map((grupo) => ({label: grupo.grupo, value: grupo.idgrupousuarios})) }
                                placeholder='Asignar orden'
                                onChange={(e) => setGrupo([e])}
                                menuPlacement="auto"
                                />
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