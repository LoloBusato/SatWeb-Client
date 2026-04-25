import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from './MainNavBar';
import SERVER from '../server'
import { formatDateDmy, parseDateDmyOrIso, pickDate } from '../utils/dateFormat'

// Filtros disponibles sobre la lista principal. 'in-progress' es el default
// (orders.js en legacy ya excluye los 3 estados archivados); cada uno de los
// otros valores muestra solo el bucket correspondiente.
const FILTER_IN_PROGRESS = 'in-progress';
const FILTER_ENTREGADOS = 'entregados';
const FILTER_PARA_RETIRAR = 'para-retirar';
const FILTER_INCUCAI = 'incucai';

function Repairs() {
    const [ordersInProgress, setOrdersInProgress] = useState([])
    const [ordersFinished, setOrdersFinished] = useState([])
    const [ordersParaRetirar, setOrdersParaRetirar] = useState([])
    const [ordersIncucai, setOrdersIncucai] = useState([])
    // Nombres dinámicos de los 3 estados especiales — vienen de
    // GET /orders/special-states (JOIN branch_settings × states). Si el
    // admin renombra un estado en /orderStates, los labels se actualizan.
    const [specialStateNames, setSpecialStateNames] = useState({
        delivered: 'Entregados',
        ready: 'Para retirar',
        incucai: 'INCUCAI',
    })

    const [listOrders, setListOrders] = useState([])
    const [searchOrder, setsearchOrder] = useState([]);

    const [orderSearch, setOrderSearch] = useState("");
    const [clienteSearch, setClienteSearch] = useState("");
    const [deviceSearch, setDeviceSearch] = useState("");
    const [fechaInicioSearch, setFechaInicioSearch] = useState("");
    const [fechaFinSearch, setFechaFinSearch] = useState("");
    
    const [fechaEntregaInicioSearch, setFechaEntregaInicioSearch] = useState("");
    const [fechaEntregaFinSearch, setFechaEntregaFinSearch] = useState("");

    const [grupoUsuarios, setGrupoUsuarios] = useState([])
    const [estados, setStates] = useState([])
    const [branches, setBranches] = useState([])

    const [activeFilter, setActiveFilter] = useState(FILTER_IN_PROGRESS)

    const permisos = JSON.stringify(localStorage.getItem("permisos"))

    const navigate = useNavigate();

    useEffect(() => {
        const fetchStates = async () => {
            // Trigger lazy del auto-archivado INCUCAI (Fase 2.2): mueve a INCUCAI
            // las órdenes en "Cliente avisado para retirar" hace >= incucai_after_days
            // (90d por sucursal). Silent — si falla (no hay token v2, 500, etc.) no
            // rompe la página, próximo pageload reintenta. No-op si no hay órdenes
            // elegibles.
            const token = localStorage.getItem('token');
            if (token) {
                axios.post(`${SERVER}/v2/orders/archive-overdue`, {}, {
                    headers: { Authorization: `Bearer ${token}` },
                }).catch(() => {});
            }

            await axios.get(`${SERVER}/orders`)
                .then(response => {
                    setOrdersInProgress(response.data)
                    setListOrders(response.data)
                    setsearchOrder(response.data)
                })
                .catch(error => {
                    console.error(error)
                })
                await axios.get(`${SERVER}/orders/entregados`)
                .then(response => {
                    setOrdersFinished(response.data)
                })
                .catch(error => {
                    console.error(error)
                })
                await axios.get(`${SERVER}/orders/para-retirar`)
                .then(response => {
                    setOrdersParaRetirar(response.data)
                })
                .catch(error => {
                    console.error(error)
                })
                await axios.get(`${SERVER}/orders/incucai`)
                .then(response => {
                    setOrdersIncucai(response.data)
                })
                .catch(error => {
                    console.error(error)
                })
                await axios.get(`${SERVER}/orders/special-states`)
                .then(response => {
                    const d = response.data || {};
                    setSpecialStateNames({
                        delivered: d.delivered_name ?? 'Entregados',
                        ready: d.ready_name ?? 'Para retirar',
                        incucai: d.incucai_name ?? 'INCUCAI',
                    })
                })
                .catch(error => {
                    console.error(error)
                })
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
        }
        fetchStates()
    }, []);

    useEffect(() => {
        handleSearch();
    // eslint-disable-next-line
      }, [listOrders]);
  
    function fechaEntreRangos(valor, inicio, fin) {
        // `valor` puede ser VARCHAR legacy "d/m/yyyy" o ISO (DATETIME serializado
        // cuando Paso 3 renombre _dt → columna plain). parseDateDmyOrIso absorbe
        // ambos y devuelve un Date local AR con hora 00:00.
        const parsed = parseDateDmyOrIso(valor);
        if (!parsed) return true;
        const createdAt = parsed.getTime();
        const startDate = inicio ? new Date(inicio).getTime() : null;
        const endDate = fin ? new Date(fin).getTime() : null;
        return (!startDate || createdAt >= startDate) && (!endDate || createdAt <= endDate)
    }

    async function handleSearch (event) {
        if (event) {
            event.preventDefault();
        }
        setsearchOrder(listOrders.filter((item) => {
            const isWithinInicioRange = fechaEntreRangos(pickDate(item, 'created_at'), fechaInicioSearch, fechaFinSearch)
            const isWithinEntregaRange = fechaEntreRangos(pickDate(item, 'returned_at'), fechaEntregaInicioSearch, fechaEntregaFinSearch)
            
            const branch = document.getElementById("branch").value
            const estado = document.getElementById("estado").value
            const user = document.getElementById("user").value
            return (
                (item.order_id === Number(orderSearch) || Number(orderSearch) === 0) &&
                (item.idstates === Number(estado) || Number(estado) === 0) &&
                `${item.name} ${item.surname}`.toLowerCase().includes(clienteSearch.toLowerCase()) &&
                (item.branches_id === Number(branch) || Number(branch) === 0) &&
                `${item.brand} ${item.type} ${item.model} ${item.serial}`.toLowerCase().includes(deviceSearch.toString().toLowerCase()) &&
                (item.idgrupousuarios === Number(user) || Number(user) === 0) &&
                isWithinInicioRange &&
                isWithinEntregaRange
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

    // Toggle radio-like: clickear un filtro cambia al bucket correspondiente;
    // clickear el filtro que ya está activo lo desmarca y vuelve a "en progreso".
    // Los 3 no pueden combinarse (buckets mutuamente excluyentes por diseño).
    const handleFilterChange = (filter) => {
        if (activeFilter === filter) {
            setActiveFilter(FILTER_IN_PROGRESS)
            setListOrders(ordersInProgress)
            return
        }
        setActiveFilter(filter)
        switch (filter) {
            case FILTER_ENTREGADOS:
                setListOrders(ordersFinished)
                break
            case FILTER_PARA_RETIRAR:
                setListOrders(ordersParaRetirar)
                break
            case FILTER_INCUCAI:
                setListOrders(ordersIncucai)
                break
            default:
                setListOrders(ordersInProgress)
        }
    }

    return (
        <div className='bg-gray-300 min-h-screen'>
            <MainNavBar />
            <div className='bg-white m-2 py-8 px-2 w-full md:w-5/6 mx-auto'>
                <div className="flex flex-col md:flex-row justify-between">
                    <h1><span className="text-2xl font-bold">Reparaciones</span> (se encontraron <span className='font-bold'>{searchOrder.length}</span> ordenes)</h1>
                    {permisos.includes("ManipularOrdenes") && (
                        <button className="mt-3 md:mt-0 bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                            onClick={() => { navigate(`/orders`) }} >
                            Agregar orden
                        </button>
                    )}
                </div>
                <div>
                    <div className="border my-6 border-gray-300">
                        <form onSubmit={handleSearch} className="p-1 bg-blue-100">
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-y-1'>
                                <div className='flex justify-end w-5/6 gap-x-2'>
                                    <label htmlFor='numeroOrden'>Orden </label>
                                    <input
                                        id='numeroOrden'
                                        className="text-end w-52"
                                        type="text"
                                        value={orderSearch}
                                        onChange={(e) => setOrderSearch(e.target.value)}
                                    />
                                </div>
                                <div className='flex justify-end w-5/6 gap-x-2'>
                                    <label htmlFor='fechaInicio'>Fecha Inicio </label>
                                    <input
                                        id='fechaInicio'
                                        className='w-52'
                                        type="date"
                                        value={fechaInicioSearch}
                                        onChange={(e) => setFechaInicioSearch(e.target.value)}
                                    />
                                </div>
                                <div className='flex justify-end w-5/6 gap-x-2'>
                                    <label htmlFor='fechaFin'>Fecha Fin </label>
                                    <input
                                        id='fechaFin'
                                        className='w-52'
                                        type="date"
                                        value={fechaFinSearch}
                                        onChange={(e) => setFechaFinSearch(e.target.value)}
                                    />
                                </div>
                                <div className='flex justify-end w-5/6 gap-x-2'>
                                    <label htmlFor='cliente'>Cliente </label>
                                    <input
                                        id='cliente'
                                        className='w-52'
                                        type="text"
                                        value={clienteSearch}
                                        onChange={(e) => setClienteSearch(e.target.value)}
                                    />
                                </div>
                                <div className='flex justify-end w-5/6 gap-x-2'>
                                    <label htmlFor='entregaInicio'>Entrega Inicio </label>
                                    <input
                                        id='entregaInicio'
                                        className='w-52'
                                        type="date"
                                        value={fechaEntregaInicioSearch}
                                        onChange={(e) => setFechaEntregaInicioSearch(e.target.value)}
                                    />
                                </div>
                                <div className='flex justify-end w-5/6 gap-x-2'>
                                    <label htmlFor='entregaFin'>Entrega Fin </label>
                                    <input
                                        id='entregaFin'
                                        className='w-52'
                                        type="date"
                                        value={fechaEntregaFinSearch}
                                        onChange={(e) => setFechaEntregaFinSearch(e.target.value)}
                                    />
                                </div>
                                <div className='flex justify-end w-5/6 gap-x-2'>
                                    <label htmlFor='equipo'>Equipo </label>
                                    <input
                                        id='equipo'
                                        className='w-52'
                                        type="text"
                                        value={deviceSearch}
                                        onChange={(e) => setDeviceSearch(e.target.value)}
                                    />
                                </div>
                                <div className='flex justify-end w-5/6 gap-x-2'>
                                    <label htmlFor='branch'>Sucursal </label>
                                    <select name="branch" defaultValue="" id="branch" className='w-52' >
                                        <option value="" >Sucursal</option>
                                        {branches.map((branch) => (
                                            <option key={branch.idbranches} value={branch.idbranches}>{branch.branch}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className='flex justify-end w-5/6 gap-x-2'>
                                    <label htmlFor='estado'>Estado </label>
                                    <select name="estado" defaultValue="" id="estado" className='w-52'>
                                        <option value="" >Estado</option>
                                        {estados.map((state) => (
                                            <option key={state.idstates} value={state.idstates}>{state.state}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className='flex justify-end w-5/6 gap-x-2'>
                                    <label htmlFor='user'>Asignada a </label>
                                    <select name="user" defaultValue="" id="user" className='w-52' >
                                        <option value="" >Asignar orden</option>
                                        {grupoUsuarios.filter(g => g.grupo !== 'USUARIOS DESHABILITADOS').map((grupo) => (
                                            <option key={grupo.idgrupousuarios} value={grupo.idgrupousuarios}>{grupo.grupo}</option>
                                        ))}
                                    </select>
                                </div>   
                                <div className='flex justify-end w-5/6 gap-x-4'>
                                    <div className='flex gap-x-1'>
                                        <input
                                        id='checkboxEntregados'
                                        type='checkbox'
                                        checked={activeFilter === FILTER_ENTREGADOS}
                                        onChange={() => handleFilterChange(FILTER_ENTREGADOS)} />
                                        <label htmlFor='checkboxEntregados'>{specialStateNames.delivered} ({ordersFinished.length})</label>
                                    </div>
                                    <div className='flex gap-x-1'>
                                        <input
                                        id='checkboxParaRetirar'
                                        type='checkbox'
                                        checked={activeFilter === FILTER_PARA_RETIRAR}
                                        onChange={() => handleFilterChange(FILTER_PARA_RETIRAR)} />
                                        <label htmlFor='checkboxParaRetirar'>{specialStateNames.ready} ({ordersParaRetirar.length})</label>
                                    </div>
                                    <div className='flex gap-x-1'>
                                        <input
                                        id='checkboxIncucai'
                                        type='checkbox'
                                        checked={activeFilter === FILTER_INCUCAI}
                                        onChange={() => handleFilterChange(FILTER_INCUCAI)} />
                                        <label htmlFor='checkboxIncucai'>{specialStateNames.incucai} ({ordersIncucai.length})</label>
                                    </div>
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
                    {/* Tablas con ordenes */}
                    <div className="flex flex-col justify-center bg-gray-300">
                        {/* Tabla para dispositivos de tamanio sm y mayor */}
                        <table className="table-fixed hidden md:block">
                            <thead>
                                <tr className='bg-lime-400'>
                                    <th className="border px-4 py-1 w-1/12">#</th>
                                    <th className="border px-4 py-1 w-2/12">Cliente</th>
                                    <th className="border px-4 py-1 w-3/12">Modelo</th>
                                    <th className="border px-4 py-1 w-4/12">Problema</th>
                                    <th className="border px-2 py-1 w-1/12">Estado</th>
                                    <th className="border px-2 py-1 w-1/12">Antigüedad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRows.map((order) => (
                                    <tr key={order.order_id} className='text-sm cursor-pointer' onClick={() => { window.open(`/messages/${order.order_id}`, '_blank') }} >
                                        <td className="border px-2 py-2 text-center">{order.order_id}</td>
                                        <td className="border px-2 py-2">{order.name} {order.surname}</td>
                                        <td className="border px-2 overflow-hidden">{order.brand} {order.type} {order.model} - SN: {order.serial}</td>
                                        <td className="border px-2 py-2">{order.problem}</td>
                                        <td className={`text-center border py-2`}>{order.state}</td>
                                        <td className={`text-center border py-2`}>{formatDateDmy(pickDate(order, 'created_at'))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* Tabla colapsable para dispositivos pequeños */}
                        <div className="md:hidden">
                            {paginatedRows.map(order => (
                                <details key={order.order_id} className="border mb-1 rounded">
                                    <summary className="px-4 py-2 cursor-pointer outline-none">
                                        Orden #{order.order_id} - {order.name} {order.surname} - {order.brand} {order.type} {order.model}
                                    </summary>
                                    <div className=" bg-gray-100">
                                        <div className='text-sm text-center cursor-pointer' onClick={() => { navigate(`/messages/${order.order_id}`) }} >
                                            <p className="border px-2 py-2 text-center">{order.order_id}</p>
                                            <p className="border px-2 py-2">{order.name} {order.surname}</p>
                                            <p className="border px-2 overflow-hidden">{order.brand} {order.type} {order.model} - SN: {order.serial}</p>
                                            <p className="border px-2 py-2">{order.problem}</p>
                                            <p className={`text-center border py-2`}>{order.state}</p>
                                            <p className={`text-center border py-2`}>{formatDateDmy(pickDate(order, 'created_at'))}</p>
                                        </div>
                                    </div>
                                </details>
                            ))}
                        </div>
                        {/* Barra inferior con next y prev */}
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