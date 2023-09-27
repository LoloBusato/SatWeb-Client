import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import MainNavBar from './MainNavBar'
import SERVER from '../server'

/* Estan HardCodeados los valores para el id del estado entregado
y el usuario entregado en la funcion entregarOrden */

const TablaCobros = ({ id }) => {
    const [listaCobros, setListaCobros] = useState([]);
  
    const navigate = useNavigate()
    useEffect(() => {
        const obtenerDatosDesdeBackend = async () => {
            await axios.get(`${SERVER}/cobros/order/${id}`)
                .then(response => {
                    setListaCobros(response.data)
                })
                .catch(error => {
                    console.error(error)
                })
        }
        obtenerDatosDesdeBackend();
    }, [id]);

    return (
        <div className="mx-2 my-1 bg-blue-100 p-2 ">
            {listaCobros.length > 0 && 
                <div className='flex justify-end'>
                    <table className="hidden md:block bg-blue-300">
                        <thead>
                            <tr>
                                <th className="px-4 py-2">Fecha</th>
                                <th className="px-4 py-2">Pesos</th>
                                <th className="px-4 py-2">Dolares</th>
                                <th className="px-4 py-2">Banco</th>
                                <th className="px-4 py-2">Mercado Pago</th>
                                <th className="px-4 py-2">Encargado</th>
                            </tr>
                        </thead>
                        <tbody>
                        {listaCobros.map((cobro) => (
                            <tr key={cobro.idcobros} className={`${cobro.devuelto ? 'bg-red-300' : ''}`}>
                                <td className="border px-4 py-2 text-center">{cobro.fecha}</td>
                                <td className="border px-4 py-2 text-center">{cobro.pesos}</td>
                                <td className="border px-4 py-2 text-center">{cobro.dolares}</td>
                                <td className="border px-4 py-2 text-center">{cobro.banco}</td>
                                <td className="border px-4 py-2 text-center">{cobro.mercado_pago}</td>
                                <td className="border px-4 py-2 text-center">{cobro.encargado}</td>
                                {cobro.devuelto === 1 && (
                                    <td className="border px-4 py-2 text-center">{cobro.fecha_devolucion}</td>
                                )}
                                <td className="border">
                                    <button
                                    className="bg-red-500 border px-2 py-1 color"
                                    onClick={() => { navigate(`/devolverDinero/${cobro.movname_id}`) }}
                                    >
                                        Devolver
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <div className="md:hidden">
                        {listaCobros.map(cobro => (
                            <details key={cobro.idcobros} className="border mb-1 rounded">
                                <summary className="px-4 py-2 cursor-pointer outline-none">
                                    Cobro {cobro.fecha}
                                </summary>
                                <div className="bg-gray-100 flex flex-col items-center">
                                    <p className="px-4 py-2 text-center">Pesos: {cobro.pesos}</p>
                                    <p className="px-4 py-2 text-center">Dolares: {cobro.dolares}</p>
                                    <p className="px-4 py-2 text-center">Banco: {cobro.banco}</p>
                                    <p className="px-4 py-2 text-center">Mercado Pago: {cobro.mercado_pago}</p>
                                    <p className="px-4 py-2 text-center">Encargado: {cobro.encargado}</p>
                                    {cobro.devuelto === 1 && (
                                    <td className="border px-4 py-2 text-center">Devolucion: {cobro.fecha_devolucion}</td>
                                    )}
                                    <button
                                    className="bg-red-500 border px-2 py-1 color"
                                    onClick={() => { navigate(`/devolverDinero/${cobro.idcobros}`) }}
                                    >
                                        Devolver
                                    </button>
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            }
        </div>
    );
};

function Messages() {
    const [order, setOrder] = useState([null])
    const [orderState, setOrderState] = useState(true)
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
    const username = localStorage.getItem("username")
    const user_id = localStorage.getItem("userId")
    const branchId = JSON.parse(localStorage.getItem("branchId"))
    const permisos = JSON.stringify(localStorage.getItem("permisos"))
    const contrasenia = localStorage.getItem("password")

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/orders`)
                .then(response => {
                    for (let i = 0; i < response.data.length; i++) {
                        if (response.data[i].order_id === Number(orderId)) {
                            setOrder(response.data[i])
                            setOrderState(false)
                        }
                    }
                })
                .catch(error => {
                    console.error(error)
                })
            if (orderState) {
                await axios.get(`${SERVER}/orders/entregados`)
                    .then(response => {
                        for (let i = 0; i < response.data.length; i++) {
                            if (response.data[i].order_id === Number(orderId)) {
                                setOrder(response.data[i])
                            }
                        }
                    })
                    .catch(error => {
                        console.error(error)
                    })
            }

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

            await axios.get(`${SERVER}/reduceStock/${orderId}`)
                .then(response => {
                    const reduceStockFilt = response.data.filter(item => item.orderid === orderId).sort((a, b) => b.idreducestock - a.idreducestock)
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
            const fechaHoraBuenosAires = new Date().toLocaleString("en-IN", {timeZone: "America/Argentina/Buenos_Aires", hour12: false}).replace(',', '');

            const formData = new FormData(event.target);
            const messageData = {
                username,
                message: formData.get('message').trim(),
                orderId,
                created_at: fechaHoraBuenosAires
            };
            const response = await axios.post(`${SERVER}/orders/messages/`, messageData);
            if(response.status === 200){
                window.location.reload();
            }
        } catch (error) {
            alert(error.response.data)
        }     
    }

    const eliminarElemento = async (id) => {
        if (!esperar) {
            setEsperar(true)
            try {        
                await axios.delete(`${SERVER}/orders/messages/${id}`)
                    alert("Nota eliminada correctamente")
                    window.location.reload();
            } catch (error) {
                setEsperar(false)
                console.error(error)
            }
        }
      }
    
    async function handleSearch (event) {
        event.preventDefault();
        setsearchStock(stock.filter((item) => 
            (item.idstock === parseInt(codigoSearch) || codigoSearch === "") &&
            item.repuesto.toLowerCase().includes(repuestoSearch.toLowerCase()) &&
            item.nombre.toLowerCase().includes(proveedorSearch.toLowerCase()) 
        ));
    };

    const [esperar, setEsperar] = useState(false)
    async function agregarRepuesto(stockbranchid, orderId, userId, cantidad) {
        if(!esperar) {
            setEsperar(true)
            if (cantidad <= 0) {
                setEsperar(false)
                return alert("Ñao ñao garoto, no se pueden usar repuestos con cantidad: 0")
            } else {
                cantidad -= 1
                try {    
                    const fechaHoraBuenosAires = new Date().toLocaleString("en-IN", {timeZone: "America/Argentina/Buenos_Aires", hour12: false}).replace(',', '');
                    const responseReduce = await axios.post(`${SERVER}/reduceStock`, {
                        cantidad,
                        stockbranchid,
                        orderId,
                        userId,
                        fecha: fechaHoraBuenosAires
                    })
                    if(responseReduce.status === 200) {
                        window.location.reload();
                    }
                } catch (error) {
                    setEsperar(false)
                    console.error(error)
                }
            }
        }
    }
    const eliminarRepuesto = async (stockReduceId, stockbranchid, cantidad) => {
        cantidad += 1
        try {        
            await axios.post(`${SERVER}/reduceStock/delete`, {
                stockReduceId,
                stockbranchid,
                cantidad
            })
            window.location.reload();
        } catch (error) {
            console.error(error)
        }
    }
    const entregarOrden = async () => {
        try {
            const result = window.confirm('¿Estás seguro de entregar la orden sin cobrar?');
            if (result) {       
                const fechaHoraBuenosAires = new Date().toLocaleString("en-IN", {timeZone: "America/Argentina/Buenos_Aires", hour12: false}).replace(',', '');
                const responseOrders = await axios.put(`${SERVER}/orders/finalizar/${orderId}`, {
                    fecha: fechaHoraBuenosAires.split(' ')[0]
                });
                if (responseOrders.status === 200){
                    alert("Orden entregada")
                    window.location.reload();
                } 
            } 
        } catch (error) {
            alert(error.response.data);
        }
    }
    const handleCobrarOrder = () => {
        const cantidadRepuestos = reduceStock.length
        let checkCobrar = true
        if (cantidadRepuestos === 0) {
            const result = window.confirm('¿Estás seguro de cobrar la orden sin repuestos asignados?');
            if (result) {
                checkCobrar = true
            } else {
                checkCobrar = false
            }
        } else {
            const result = window.confirm('¿Están todos los repuestos asignados?');
            if (result) {
                checkCobrar = true
            } else {
                checkCobrar = false
            }
        }
        if (checkCobrar) {
            return navigate(`/movesrepairs/${order.order_id}`)
        }
    }
    async function enviarGarantia(stockid, reducestockid) {
        const clientPassword = window.prompt('Este es un proceso irreversible, si está seguro de continuar ingrese su contraseña')
        if (clientPassword === contrasenia) {
            const garantiaValues = {
                values: [stockid, 2],
                idreducestock: reducestockid,
            }
            await axios.post(`${SERVER}/garantia`, garantiaValues)
                .then(response => {
                    alert('Repuesto enviado a garantia')
                    window.location.reload()
                })
                .catch(error => {
                    console.error(error)
                })
        } else {
            return alert('Contrasenia erronea, operacion cancelada')
        }
    }
  
    return (
        <div>
            <MainNavBar />
            <div className="max-w-7xl mx-auto">
                <div className="bg-gray-100 pt-1">
                    {/* Margen superior de la orden */}
                    <div className="mx-2 my-1 bg-blue-300 p-2 flex flex-col justify-between md:flex-row">
                        <h1>ORDEN DE REPARACION <b>#{order.order_id}</b></h1>
                        {permisos.includes('ManipularOrdenes') && 
                            <div>
                                {order.instagram && (
                                    <a 
                                    href={`https://www.instagram.com/${order.instagram}`} 
                                    target='_blank' 
                                    rel='noreferrer noopener'
                                    className='bg-white text-black font-medium my-1 px-2 py-0.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'>
                                        Enviar mensaje
                                        <i className="fab fa-instagram text-pink-500 text-xl ml-1"></i>
                                    </a>
                                )}
                                {order.phone && (
                                    <a 
                                    href={`https://api.whatsapp.com/send?phone=54${order.phone}`} 
                                    target='_blank' 
                                    rel='noreferrer noopener'
                                    className='bg-white text-black font-medium my-1 px-2 py-0.5 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'>
                                        Enviar mensaje
                                        <i className="fab fa-whatsapp text-green-500 text-xl ml-1"></i>
                                    </a>
                                )}
                                <button 
                                className="bg-white text-black font-medium my-1 px-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                onClick={() => handleCobrarOrder()}>
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
                        }
                    </div>
                    <TablaCobros id={orderId} />
                    <div className="mx-2 my-1 bg-blue-100 p-2 flex flex-col justify-between md:flex-row">
                        <h1>Estado de la Reparacion: <span className='text-lg'>{order.state}</span></h1>
                        <div className='flex'>
                            <h1 className='mr-2'>Asignada a: {order.grupo}</h1>
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
                            <label className="block text-gray-700 font-bold mb-2 mr-2 w-40">Fecha de entregado: </label>
                            <label>{order.returned_at}</label>
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
                            <label className='whitespace-pre-line'>{order.accesorios}</label>
                        </div>
                        <div className='flex'>
                            <label className="block text-gray-700 font-bold mb-2 mr-2 w-40 border" htmlFor="falla">Falla: </label>
                            <label className='whitespace-pre-line'>{order.problem}</label>
                        </div>
                        <div className='flex'>
                            <label className="block text-gray-700 font-bold mb-2 mr-2 w-40" htmlFor="contraseña">Contraseña: </label>
                            <label>{order.password}</label>
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
                            <div className='flex flex-col text-sm md:flex-row' key={message.idmessages}>
                                <div className='border'>
                                    <button className="mr-2 md:mr-10 bg-red-500 hover:bg-red-700 px-1 color"
                                    onClick={() => eliminarElemento(message.idmessages)} >
                                        X
                                    </button>
                                    <label className='mr-1'>{message.created_at}</label>
                                    <label className='mr-5'>{message.username}:</label>
                                </div>
                                <p className='max-w-4xl whitespace-pre-line'>{message.message}</p>
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
                            {/* Tabla para dispositivos de tamanio sm y mayor */}
                            <table className="table-auto hidden md:block bg-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-2">Codigo</th>
                                        <th className="px-4 py-2">Repuesto</th>
                                        <th className="px-4 py-2">Precio (USD)</th>
                                        <th className="px-4 py-2">Proveedor</th>
                                        <th className="px-4 py-2">User</th>
                                        <th className="px-4 py-2">Fecha</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reduceStock.map(stock => (
                                        <tr key={stock.idreducestock} className={stock.es_garantia === 1 ? 'bg-gray-400' : ''}>
                                            <td className="border px-4 py-2 text-center" values={stock.idstock}>{stock.idstock}</td>
                                            <td className="border px-4 py-2 text-center" values={stock.repuesto}>{stock.repuesto}</td>
                                            <td className="border px-4 py-2 text-center" value={stock.precio_compra}>{stock.precio_compra}</td>
                                            <td className="border px-4 py-2 text-center" value={stock.nombre}>{stock.nombre}</td>
                                            <td className="border px-4 py-2 text-center" value={stock.username}>{stock.username}</td>
                                            <td className="border px-4 py-2 text-center" value={stock.date}>{stock.date}</td>
                                            {order.state !== "ENTREGADO" && stock.es_garantia === 0 && (
                                                <td>
                                                    <button className="bg-red-500 border px-4 py-2 color" onClick={() => eliminarRepuesto(stock.idreducestock, stock.stockbranchid, stock.cantidad_restante)}>Eliminar</button>
                                                </td>
                                            )}
                                            {order.state !== "ENTREGADO" && stock.es_garantia === 0 && (
                                                <td>
                                                    <button className="bg-yellow-400 border px-4 py-2 color" onClick={() => enviarGarantia(stock.idstock, stock.idreducestock)}>Garantia</button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Tabla colapsable para dispositivos pequeños */}
                            <div className="md:hidden">
                                {reduceStock.map(stock => (
                                    <details key={stock.idreducestock} className="border mb-1 rounded">
                                        <summary className="px-4 py-2 cursor-pointer outline-none">
                                            {stock.idstock} - {stock.repuesto} - {stock.date}
                                        </summary>
                                        <div className="bg-gray-100 flex flex-col items-center">
                                            <p className="border px-4 py-2 text-center" value={stock.precio_compra}>{stock.precio_compra}</p>
                                            <p className="border px-4 py-2 text-center" value={stock.nombre}>{stock.nombre}</p>
                                            <p className="border px-4 py-2 text-center" value={stock.username}>{stock.username}</p>
                                            {order.state !== "ENTREGADO" && (
                                                <p>
                                                    <button className="bg-red-500 border px-4 py-2 color" onClick={() => eliminarRepuesto(stock.idreducestock, stock.stockbranchid, stock.cantidad_restante)}>Eliminar</button>
                                                </p>
                                            )}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                        {order.state !== "ENTREGADO" && (
                            <div >
                                {/* Buscador de repuestos */}
                                <div className='flex justify-center'>
                                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row justify-center my-10">
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
                                {/* Tabla de repuestos */}
                                <div className="justify-center mb-10 hidden md:flex">
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
                                                <tr key={stock.idstock} onClick={() => agregarRepuesto(stock.stockbranchid, orderId, user_id, stock.cantidad_restante)}>
                                                    <td className="border px-4 py-2" values={stock.idstock}>{stock.idstock}</td>
                                                    <td className="border px-4 py-2" value={stock.repuesto}>{stock.repuesto}</td>
                                                    <td className={`${stock.cantidad <= stock.cantidad_limite ? "bg-red-600" : ""} border px-4 py-2 text-center`} value={stock.cantidad_restante}>{stock.cantidad_restante}</td>
                                                    <td className="border px-4 py-2 text-center" value={stock.precio_compra}>{stock.precio_compra}</td>
                                                    <td className="border px-4 py-2" value={stock.nombre}>{stock.nombre}</td>
                                                    <td className="border px-4 py-2 text-center" value={stock.fecha_compra}>{stock.fecha_compra.slice(0, 10)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="md:hidden">
                                    {searchStock.map((stock, index) => (
                                        <details key={`${stock.idstock} ${index} `} className="border mb-1 rounded">
                                            <summary className="px-4 py-2 cursor-pointer outline-none">
                                                {stock.idstock} - {stock.repuesto} - {stock.cantidad_restante}
                                            </summary>
                                            <div className="bg-gray-100 flex flex-col items-center">
                                                    <p className="border px-4 py-2 text-center" value={stock.precio_compra}>{stock.precio_compra}</p>
                                                    <p className="border px-4 py-2" value={stock.nombre}>{stock.nombre}</p>
                                                    <p className="border px-4 py-2 text-center" value={stock.fecha_compra}>{stock.fecha_compra.slice(0, 10)}</p>
                                                    <p>
                                                        <button
                                                        className="px-4 py-2 text-white bg-green-500 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                                        onClick={() => agregarRepuesto(stock.stockbranchid, orderId, user_id, stock.cantidad_restante)}>
                                                            Agregar
                                                        </button>
                                                    </p>
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Historial de acciones */}
                </div>
            </div>
        </div>
    );
}

export default Messages