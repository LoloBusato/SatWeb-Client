import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import MainNavBar from './MainNavBar';
import SERVER from '../server'

function ReasignOrder() {
    const [listOrders, setListOrders] = useState([])
    const [users, setUsers] = useState([])
    const [estados, setStates] = useState([])

    const navigate = useNavigate();
    const location = useLocation();
    const orderId = location.pathname.split("/")[2];

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/users`)
                .then(response => {
                    setUsers(response.data);
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

            await axios.get(`${SERVER}/orders`)
                .then(response => {
                    for (let i = 0; i < response.data.length; i++) {
                        if(response.data[i].order_id === Number(orderId)) {
                            setListOrders(response.data[i])
                            document.getElementById("state").value = (response.data[i].idstates)
                            document.getElementById("user").value = (response.data[i].idusers)
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
            const stateId = document.getElementById("state").value
            const userId = document.getElementById("user").value
            if (listOrders.idstates === Number(stateId) || listOrders.idusers === Number(userId)){
                alert("Cambiar estado y reasignar orden")
            } else {
                const responseOrders = await axios.put(`${SERVER}/reasignOrder/${orderId}`, {
                    state_id: parseInt(stateId),
                    users_id: parseInt(userId),
                });
                if (responseOrders.status === 200){
                    alert("Orden reasignada")
                    navigate(`/messages/${orderId}`)
                } 
            }
        } catch (error) {
            alert(error.response.data);
        }
    }

    return (
        <div className='bg-gray-300 min-h-screen'>
            <MainNavBar />
            <div className='mt-2 w-full border border-black-700 shadow-lg md:w-1/3 mx-auto bg-white px-4 py-5'>
                <h1 className="text-5xl text-center">Reasignar orden</h1>
                <form onSubmit={handleSubmit} className="mt-5">
                    <div className='flex'>
                        <div className='w-full'>
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="surname">Asignar: *</label>
                            <select name="user" id="user" className="appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline">
                                <option value="" disabled>Asignar orden</option>
                                {users.map((user) => (
                                    <option key={user.idusers} value={user.idusers}>{user.username}</option>
                                ))}
                            </select>
                        </div>
                        <div className='w-full'>
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="surname">Estado: *</label>
                            <select name="state" id="state" className="appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline">
                                <option value="" disabled>Seleccionar estado</option>
                                {estados.map((state) => (
                                    <option key={state.idstates} value={state.idstates}>{state.state}</option>
                                ))}
                            </select>
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