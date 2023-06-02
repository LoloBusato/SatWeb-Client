import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from './MainNavBar';

function Repairs() {
    const [listOrders, setListOrders] = useState([])
    const [searchOrder, setsearchOrder] = useState([]);

    const [orderSearch, setOrderSearch] = useState("");
    const [clienteSearch, setClienteSearch] = useState("");
    const [deviceSearch, setDeviceSearch] = useState("");
    const [fechaInicioSearch, setFechaInicioSearch] = useState("");
    const [fechaFinSearch, setFechaFinSearch] = useState("");

    const [users, setUsers] = useState([])
    const [estados, setStates] = useState([])
    const [branches, setBranches] = useState([])

    const navigate = useNavigate();

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get('http://localhost:3001/orders')
                .then(response => {
                    console.log(response.data)
                    setListOrders(response.data)
                    setsearchOrder(response.data)
                })
                .catch(error => {
                    console.error(error)
                })
                await axios.get('http://localhost:3001/states')
                .then(response => {
                    setStates(response.data);
                })
                .catch(error => {
                    console.error(error);
                });

            await axios.get('http://localhost:3001/users')
                .then(response => {
                    setUsers(response.data);
                })
                .catch(error => {
                    console.error(error);
                });

            await axios.get('http://localhost:3001/branches')
                .then(response => {
                    setBranches(response.data);
                })
                .catch(error => {
                    console.error(error);
                });
        }
        fetchStates()
    }, []);
  
    async function handleSearch (event) {
        event.preventDefault();
        setsearchOrder(listOrders.filter((item) => {
            const createdAt = new Date(item.created_at);
            const startDate = fechaInicioSearch ? new Date(fechaInicioSearch) : null;
            const endDate = fechaFinSearch ? new Date(fechaFinSearch) : null;

            // Verificar si la fecha está dentro del rango
            const isWithinRange = (!startDate || createdAt >= startDate) && (!endDate || createdAt <= endDate);
            
            const branch = document.getElementById("branch").value
            const estado = document.getElementById("estado").value
            const user = document.getElementById("user").value

            return (
                item.order_id.toString().includes(orderSearch.toLowerCase()) &&
                item.state.toString().toLowerCase().includes(estado.toLowerCase()) &&
                `${item.name} ${item.surname}`.toLowerCase().includes(clienteSearch.toLowerCase()) &&
                item.branch.toLowerCase().includes(branch.toLowerCase()) &&
                `${item.brand} ${item.type} ${item.model} ${item.serial}`.toLowerCase().includes(deviceSearch.toLowerCase()) &&
                item.username.toLowerCase().includes(user.toLowerCase()) &&
                isWithinRange
            )
        }));
      };

      const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 50;
  
    // Función para realizar la paginación de los datos
    const paginateData = () => {
      const startIndex = (currentPage - 1) * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      return searchOrder.slice(startIndex, endIndex);
    };
  
    // Controlador de evento para avanzar a la siguiente página
    const nextPage = () => {
      if (currentPage < Math.ceil(searchOrder.length / rowsPerPage)) {
        setCurrentPage(currentPage + 1);
      }
    };
  
    // Controlador de evento para retroceder a la página anterior
    const prevPage = () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    };
  
    // Obtener las filas correspondientes a la página actual
    const paginatedRows = paginateData();

    return (
        <div className='bg-gray-300 min-h-screen'>
            <MainNavBar />
            <div className='bg-white m-2 py-8 px-2 w-full md:w-5/6 mx-auto'>
                <div className="flex justify-between">
                    <h1><span className="text-2xl font-bold">Reparaciones</span> (se encontraron <span className='font-bold'>{searchOrder.length}</span> ordenes)</h1>
                    <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                        onClick={() => { navigate(`/orders`) }} >
                        Agregar orden
                    </button>
                </div>
                <div>
                    <div className="border my-6 border-gray-300">
                        <form onSubmit={handleSearch} className="p-1 bg-blue-100">
                            <div className='grid grid-cols-3 gap-y-1'>
                                <div className='flex justify-end w-5/6 gap-x-2'>
                                    <label>Orden </label>
                                    <input
                                        className="text-end w-52"
                                        type="text"
                                        value={orderSearch}
                                        onChange={(e) => setOrderSearch(e.target.value)}
                                    />
                                </div>
                                <div className='flex justify-end w-5/6 gap-x-2'>
                                    <label>Fecha Inicio </label>
                                    <input
                                        className='w-52'
                                        type="text"
                                        value={fechaInicioSearch}
                                        onChange={(e) => setFechaInicioSearch(e.target.value)}
                                    />
                                </div>
                                <div className='flex justify-end w-5/6 gap-x-2'>
                                    <label>Fecha Fin </label>
                                    <input
                                        className='w-52'
                                        type="text"
                                        value={fechaFinSearch}
                                        onChange={(e) => setFechaFinSearch(e.target.value)}
                                    />
                                </div>
                                <div className='flex justify-end w-5/6 gap-x-2'>
                                    <label>Cliente </label>
                                    <input
                                        className='w-52'
                                        type="text"
                                        value={clienteSearch}
                                        onChange={(e) => setClienteSearch(e.target.value)}
                                    />
                                </div>
                                <div className='flex justify-end w-5/6 gap-x-2'>
                                    <label>Equipo </label>
                                    <input
                                        className='w-52'
                                        type="text"
                                        value={deviceSearch}
                                        onChange={(e) => setDeviceSearch(e.target.value)}
                                    />
                                </div>
                                <div className='flex justify-end w-5/6 gap-x-2'>
                                    <label>Sucursal </label>
                                    <select name="branch" id="branch" className='w-52' >
                                        <option value="" selected>Sucursal</option>
                                        {branches.map((branch) => (
                                            <option key={branch.idbranches} value={branch.branch}>{branch.branch}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className='flex justify-end w-5/6 gap-x-2'>
                                    <label>Estado </label>
                                    <select name="estado" id="estado" className='w-52'>
                                        <option value="" selected>Estado</option>
                                        {estados.map((state) => (
                                            <option key={state.idstates} value={state.state}>{state.state}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className='flex justify-end w-5/6 gap-x-2'>
                                    <label>Asignada a </label>
                                    <select name="user" id="user" className='w-52' >
                                        <option value="" selected>Asignar orden</option>
                                        {users.map((user) => (
                                            <option key={user.idusers} value={user.username}>{user.username}</option>
                                        ))}
                                    </select>
                                </div>                                
                            </div>
                            <div className='flex justify-end'>
                                <button
                                    type='submit'
                                    className="px-1 text-black font-bold bg-white rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200" >
                                    Buscar
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="flex flex-col justify-center bg-gray-300">
                        <table className="table-fixed">
                            <thead>
                                <tr className='bg-lime-400'>
                                    <th className="px-4 py-2 w-16">#</th>
                                    <th className="px-4 py-2 w-44">Cliente</th>
                                    <th className="px-4 py-2">Modelo</th>
                                    <th className="px-4 py-2 w-4/12">Problema</th>
                                    <th className="py-2 w-32">Estado</th>
                                    <th className="px-2 py-2 w-32">Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.map((order) => (
                                    <tr key={order.order_id} className='text-sm cursor-pointer' onClick={() => { navigate(`/messages/${order.order_id}`) }} >
                                        <td className="border px-2 py-2 text-center">{order.order_id}</td>
                                        <td className="border px-2 py-2">{order.name} {order.surname}</td>
                                        <td className="border px-2 overflow-hidden">{order.brand} {order.type} {order.model} - SN: {order.serial}</td>
                                        <td className="border px-2 py-2">{order.problem}</td>
                                        <td className={`text-center border py-2`}>{order.state}</td>
                                        <td className={`text-center border py-2`}>{order.created_at.slice(0, 10)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className='flex bg-blue-300 justify-between py-1 px-1'>
                            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                                onClick={prevPage} >
                                Prev
                            </button>
                            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                                onClick={nextPage} >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Repairs