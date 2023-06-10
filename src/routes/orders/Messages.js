import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import MainNavBar from './MainNavBar'
import SERVER from '../server'

/* Estan HardCodeados los valores para el id del estado entregado
y el usuario entregado en la funcion entregarOrden */

function Messages() {
    const [order, setOrder] = useState([])
    const [messages, setMessages] = useState([])

    const [stock, setStock] = useState([]);
    const [searchStock, setsearchStock] = useState([]);

    const [reduceStock, setReduceStock] = useState([]);

    const [codigoSearch, setCodigoSearch] = useState("");
    const [repuestoSearch, setRepuestoSearch] = useState("");
    const [proveedorSearch, setProveedorSearch] = useState("");

    const navigate = useNavigate();
    const location = useLocation();
    const orderId = Number(location.pathname.split("/")[2]);
    const user_id = JSON.parse(localStorage.getItem("userId"))
    const branchId = JSON.parse(localStorage.getItem("branchId"))

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/orders`)
                .then(response => {
                    for (let i = 0; i < response.data.length; i++) {
                        if (response.data[i].order_id === Number(orderId)) {
                            setOrder(response.data[i])
                            console.log(response.data[i].created_at, new Date())
                        }
                    }
                })
                .catch(error => {
                    console.error(error)
                })

            await axios.get(`${SERVER}/orders/messages/${orderId}`)
                .then(response => {
                    setMessages(response.data)
                })
                .catch(error => {
                    console.error(error)
                })

            await axios.get(`${SERVER}/stock/${branchId}`)
                .then(response => {
                    setStock(response.data);
                    setsearchStock(response.data)
                })
                .catch(error => {
                console.error(error);
                // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
                });

            await axios.get(`${SERVER}/reduceStock`)
                .then(response => {
                    const reduceStockFilt = response.data.filter(item => item.orderid === orderId)
                    setReduceStock(reduceStockFilt)
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
        try {        
            const formData = new FormData(event.target);
            const messageData = {
                user_id: user_id,
                message: formData.get('message').trim(),
                orderId
            };
        
            const response = await axios.post(`${SERVER}/orders/messages/`, messageData);
            if(response.status === 200){
                console.log("Nota agregada")
                window.location.reload();
            }
        } catch (error) {
            alert(error.response.data)
        }     
    }

    const eliminarElemento = async (id) => {
        try {        
            await axios.delete(`${SERVER}/orders/messages/${id}`)
            alert("Nota eliminada correctamente")
            window.location.reload();
        } catch (error) {
            console.error(error)
        }
      }
    
    async function handleSearch (event) {
        event.preventDefault();
        setsearchStock(stock.filter((item) => 
            item.idstock.toString().toLowerCase().includes(codigoSearch.toLowerCase()) &&
            item.repuesto.toLowerCase().includes(repuestoSearch.toLowerCase()) &&
            item.nombre.toLowerCase().includes(proveedorSearch.toLowerCase()) 
        ));
    };

    async function agregarRepuesto(stockId, orderId, userId, cantidad) {
        cantidad -= 1
        try {    
            const responseReduce = await axios.post(`${SERVER}/reduceStock`, {
                cantidad,
                stockId,
                orderId,
                userId
            })
            if(responseReduce.status === 200) {
                window.location.reload();
            }
        } catch (error) {
            console.error(error)
        }
    }
    const eliminarRepuesto = async (stockReduceId, stockId, cantidad) => {
        cantidad += 1
        try {        
            await axios.delete(`${SERVER}/reduceStock/${stockReduceId}`)
            await axios.put(`${SERVER}/reduceStock/${stockId}`, {
                cantidad
            })
            window.location.reload();
        } catch (error) {
            console.error(error)
        }
    }
    const entregarOrden = async () => {
        try {
            const responseOrders = await axios.put(`${SERVER}/reasignOrder/${orderId}`, {
                state_id: parseInt(6),
                users_id: parseInt(6),
            });
            if (responseOrders.status === 200){
                alert("Orden entregada")
                navigate(`/messages/${orderId}`)
            } 
        } catch (error) {
            alert(error.response.data);
        }
    }


  
    return (
        <div>
            <MainNavBar />
            <div className="max-w-7xl mx-auto">
                <div className="bg-gray-100 pt-1">
                    <div className="mx-2 my-1 bg-blue-300 p-2 flex justify-between">
                        <h1>ORDEN DE REPARACION # {order.order_id}</h1>
                        <div>
                            <button 
                            className="bg-white text-black font-medium my-1 px-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            onClick={() => { navigate(`/movesrepairs/${order.order_id}`) }}>
                                Cobrar
                            </button>
                            <button 
                            className="bg-white text-black font-medium my-1 px-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            onClick={() => { navigate(`/printOrder/${order.order_id}`) }}>
                                Imprimir
                            </button>
                            <button 
                            className="bg-white text-black font-medium my-1 px-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                            onClick={() => entregarOrden()}>
                                Entregar
                            </button>
                        </div>
                    </div>
                    <div className="mx-2 my-1 bg-blue-100 p-2 flex justify-between">
                        <h1>Estado de la Reparacion: <span className='text-lg'>{order.state}</span></h1>
                        <div className='flex'>
                            <h1 className='mr-2'>Asignada a: {order.username}</h1>
                            <button 
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                            onClick={() => { navigate(`/reasignOrder/${order.order_id}`) }} >
                                Reasignar
                            </button>
                        </div>
                    </div>
                    {/* Datos de la orden */}
                    <div className="mx-2 my-1 bg-blue-100 p-2">
                        <div className='flex'>
                            <h1 className='font-bold text-lg mr-2 w-40'>Datos de la orden</h1>
                            <button 
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                            onClick={() => { navigate(`/updateOrder/${order.order_id}`) }} >
                                Editar orden
                            </button>
                        </div>
                        <div className='flex'>
                            <label className="block text-gray-700 font-bold mb-2 mr-2 w-40" htmlFor="fecha_ingreso">Fecha de ingreso: </label>
                            <label>{order.created_at}</label>
                        </div>
                        <div className='flex'>
                            <label className="block text-gray-700 font-bold mb-2 mr-2 w-40" htmlFor="cliente">Cliente: </label>
                            <label>{order.name} {order.surname} ---- Ig: {order.instagram} ---- Telefono: {order.phone} ---- Email: {order.email} {order.postal}</label>
                            <button 
                            className="bg-green-500 hover:bg-green-700 text-white font-bold ml-2 py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                            onClick={() => { navigate(`/updateClient/${order.idclients}`) }} >
                                Editar cliente
                            </button>
                        </div>
                        <div className='flex'>
                            <label className="block text-gray-700 font-bold mb-2 mr-2 w-40" htmlFor="equipo">Equipo: </label>
                            <label>{order.type} {order.model} {order.brand} {order.device_color} -- {order.serial}</label>
                        </div>
                        <div className='flex'>
                            <label className="block text-gray-700 font-bold mb-2 mr-2 w-40" htmlFor="accesorios">Accesorios: </label>
                            <label>{order.accesorios}</label>
                        </div>
                        <div className='flex'>
                            <label className="block text-gray-700 font-bold mb-2 mr-2 w-40" htmlFor="falla">Falla: </label>
                            <label>{order.problem}</label>
                        </div>
                        <div className='flex'>
                            <label className="block text-gray-700 font-bold mb-2 mr-2 w-40" htmlFor="sucursal">Sucursal: </label>
                            <label>{order.branch}</label>
                        </div>
                    </div>
                    {/* Notas tecnicas */}
                    <div className="m-2 bg-blue-100 p-2">
                        <label className='font-bold text-lg'>
                            Notas Tecnicas
                        </label>
                        {messages.map((message) => (
                            <div className='flex text-sm' key={message.idmessages}>
                                <div className='border'>
                                    <button className="mr-10 bg-red-500 hover:bg-red-700 px-1 color"
                                    onClick={() => eliminarElemento(message.idmessages)} >
                                        X
                                    </button>
                                    <label className='mr-1'>{message.created_at}</label>
                                    <label className='mr-5'>{message.username}:</label>
                                </div>
                                <label className='max-w-4xl'>{message.message}</label>
                            </div>
                        ))}
                        <form onSubmit={handleSubmit}>
                            <textarea 
                                className="shadow mt-2 appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                type="text" 
                                id="message" 
                                name="message" 
                                placeholder=""
                                maxLength="1000"
                            />
                            <div className='justify-end flex '>
                                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                    Guardar Notas Tecnicas
                                </button>
                            </div>
                        </form>
                    </div>
                    {/* Agregar repuestos */}
                    <div className="m-2 bg-blue-100 p-2">
                        <label className='font-bold text-lg'>
                            Repuestos
                        </label>
                        <div className='flex justify-center'>
                            <table className="table-auto bg-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2">Repuesto</th>
                                        <th className="px-4 py-2">Precio (USD)</th>
                                        <th className="px-4 py-2">Proveedor</th>
                                        <th className="px-4 py-2">User</th>
                                        <th className="px-4 py-2">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reduceStock.map(stock => (
                                        <tr key={stock.idreducestock} >
                                            <td className="border px-4 py-2" values={stock.repuesto}>{stock.repuesto}</td>
                                            <td className="border px-4 py-2 text-center" value={stock.precio_compra}>{stock.precio_compra}</td>
                                            <td className="border px-4 py-2" value={stock.nombre}>{stock.nombre}</td>
                                            <td className="border px-4 py-2" value={stock.username}>{stock.username}</td>
                                            <td className="border px-4 py-2 text-center" value={stock.date}>{stock.date}</td>
                                            <td>
                                                <button className="bg-red-500 border px-4 py-2 color" onClick={() => eliminarRepuesto(stock.idreducestock, stock.idstock, stock.cantidad)}>Eliminar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className='flex justify-center'>
                            <form onSubmit={handleSearch} className="flex-wrap flex-col md:flex-row gap-4 justify-center my-10">
                                <input
                                    className="px-4 py-2 rounded-lg shadow-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    type="text"
                                    placeholder="Buscar por Codigo"
                                    value={codigoSearch}
                                    onChange={(e) => setCodigoSearch(e.target.value)}
                                />
                                <input
                                    className="px-4 py-2 rounded-lg shadow-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    type="text"
                                    placeholder="Buscar por repuesto"
                                    value={repuestoSearch}
                                    onChange={(e) => setRepuestoSearch(e.target.value)}
                                />
                                <input
                                    className="px-4 py-2 rounded-lg shadow-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    type="text"
                                    placeholder="Buscar por proveedor"
                                    value={proveedorSearch}
                                    onChange={(e) => setProveedorSearch(e.target.value)}
                                />
                                <button
                                    type='submit'
                                    className="px-4 py-2 text-white bg-indigo-500 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                >
                                    Buscar
                                </button>
                            </form>
                        </div>
                        <div className="flex justify-center mb-10">
                            <table className="table-auto bg-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2">Cod</th>
                                        <th className="px-4 py-2">Repuesto</th>
                                        <th className="px-4 py-2">Cantidad</th>
                                        <th className="px-4 py-2">Precio (USD)</th>
                                        <th className="px-4 py-2">Proveedor</th>
                                        <th className="px-4 py-2">Fecha (aaaa/mm/dd)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {searchStock.map(stock => (
                                        <tr key={stock.idstock} onClick={() => agregarRepuesto(stock.idstock, orderId, user_id, stock.cantidad)}>
                                            <td className="border px-4 py-2" values={stock.idstock}>
                                                {stock.idstock + stock.repuesto.split(" ")[0].slice(0,2) + stock.repuesto.split(" ")[1].slice(0,1) + stock.repuesto.split(" ")[3] + stock.repuesto.split(" ")[4].slice(0,1) + stock.fecha_compra.slice(0, 10).split("-")[0].slice(2,4) + stock.fecha_compra.slice(0, 10).split("-")[1] + stock.fecha_compra.slice(0, 10).split("-")[2]} 
                                            </td>
                                            <td className="border px-4 py-2" value={stock.repuesto}>{stock.repuesto}</td>
                                            <td className={`${stock.cantidad <= 3 ? "bg-red-600" : ""} border px-4 py-2 text-center`} value={stock.cantidad}>{stock.cantidad}</td>
                                            <td className="border px-4 py-2 text-center" value={stock.precio_compra}>{stock.precio_compra}</td>
                                            <td className="border px-4 py-2" value={stock.nombre}>{stock.nombre}</td>
                                            <td className="border px-4 py-2 text-center" value={stock.fecha_compra}>{stock.fecha_compra.slice(0, 10)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Historial de acciones */}
                </div>
            </div>
        </div>
    );
}

export default Messages