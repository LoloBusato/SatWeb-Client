import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import MainNavBar from './MainNavBar';
import SERVER from '../server'
import Select from 'react-select';

function ReasignOrder() {
    const [grupoUsuarios, setGrupoUsuarios] = useState([])
    const [estados, setStates] = useState([])

    const [order, setOrder] = useState([])
    const [grupoId, setGrupoId] = useState([])
    const [estadoId, setEstadoId] = useState([])

    const [isNotLoading, setIsNotLoading] = useState(true);

    const navigate = useNavigate();
    const location = useLocation();
    const orderId = location.pathname.split("/")[2];

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/grupousuarios`)
                .then(response => {
                    setGrupoUsuarios(response.data);
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
                await axios.get(`${SERVER}/orders/entregados`)
                .then(response => {
                    const orden = response.data.filter((ordenes) => ordenes.order_id === Number(orderId))[0]

                    setOrder(orden);
                })
                .catch(error => {
                    console.error(error);
                });
        }
        fetchStates()
// eslint-disable-next-line
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        if (isNotLoading) {
            setIsNotLoading(false)
            try {
                console.log(order)
                const fechaHoraBuenosAires = new Date().toLocaleString("en-IN", {timeZone: "America/Argentina/Buenos_Aires", hour12: false}).replace(',', '');
            
                const orderData = {
                    client_id: order.client_id,
                    device_id: order.device_id,
                    branches_id: order.branches_id,
                    state_id: estadoId,
                    problem: `GARANTIA ORDEN #${order.order_id} - ${order.problem}`,
                    password: order.password,
                    accesorios: order.accesorios,
                    serial: order.serial,
                    device_color: order.device_color,
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

    return (
        <div className='bg-gray-300 min-h-screen'>
            <MainNavBar />
            <div className='mt-2 w-full border border-black-700 shadow-lg md:w-1/2 mx-auto bg-white px-4 py-5'>
                <h1 className="text-5xl text-center">Asignar garantia #{orderId}</h1>
                <form onSubmit={handleSubmit} className="mt-5">
                    <div className='flex'>
                        <div className='w-full'>
                            <label className="block text-gray-700 font-bold mb-2">Asignar: *</label>
                            <Select
                                required
                                options={ grupoUsuarios.map((grupo) => ({label: grupo.grupo, value: grupo.idgrupousuarios})) }
                                placeholder='Asignar orden'
                                onChange={(e) => setGrupoId(e.value)}
                                menuPlacement="auto"
                            />
                        </div>
                        <div className='w-full'>
                            <label className="block text-gray-700 font-bold mb-2">Estado: *</label>
                            <Select
                                required
                                options={ estados.map((estado) => ({label: estado.state, value: estado.idstates})) }
                                placeholder='Seleccionar estado'
                                onChange={(e) => setEstadoId(e.value)}
                                menuPlacement="auto"
                            />
                        </div>
                    </div>
                    <div className="flex mt-2">
                        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ReasignOrder