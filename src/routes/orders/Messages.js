import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import MainNavBar from './MainNavBar'
import SERVER from '../server'
import { formatDateDmy, formatDateTimeDmy, pickDate } from '../utils/dateFormat'

/* Estan HardCodeados los valores para el id del estado entregado
y el usuario entregado en la funcion entregarOrden */

const TablaCobros = ({ id }) => {
    const [listaCobros, setListaCobros] = useState([]);
    const [categories, setCategories] = useState([])
  
    const navigate = useNavigate()
    useEffect(() => {
        const obtenerDatosDesdeBackend = async () => {
            await axios.get(`${SERVER}/cobros/order/${id}`)
                .then(response => {
                    const categoriasUnicas = Array.from(
                        new Set(
                            response.data.reduce((categorias, fila) => {
                            return categorias.concat(Object.keys(fila.categoriasUnidades));
                          }, [])
                        )
                    );
                    setCategories(categoriasUnicas)
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
                                {categories.map((categorie) => (
                                <th key={categorie} className="px-4 py-2">{categorie}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                        {listaCobros.map((cobro) => (
                            <tr key={cobro.idcobros} className={`${cobro.devuelto ? 'bg-red-300' : ''}`}>
                                <td className="border px-4 py-2 text-center">{cobro.fecha}</td>
                                {categories.map((categorie) => (
                                <td key={categorie} className="border px-4 py-2 text-center">
                                    {cobro.categoriasUnidades[categorie]
                                    ? cobro.categoriasUnidades[categorie]
                                    : '0'}
                                </td>
                                ))}
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
                                    {categories.map((categorie) => (
                                    <p key={categorie} className="px-4 py-2 text-center">
                                        {categorie}: {cobro.categoriasUnidades[categorie]
                                        ? cobro.categoriasUnidades[categorie]
                                        : '0'}
                                    </p>
                                    ))}
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
    const [messages, setMessages] = useState([])

    const [stock, setStock] = useState([]);
    const [searchStock, setsearchStock] = useState([]);

    const [reduceStock, setReduceStock] = useState([]);

    // Pre-Venta (mayo 2026): info derivada del backend y estado del modal.
    // senaUSD/senaARS separadas — sin conversión en storage (commit que
    // separó 'Seña' en 'Seña USD'/'Seña ARS').
    const [senaUSD, setSenaUSD] = useState(0);
    const [senaARS, setSenaARS] = useState(0);
    const [movCategories, setMovCategories] = useState([]);
    const [arrepentidoModal, setArrepentidoModal] = useState(null); // null | 'choose' | 'devolver' | 'ganancia'
    const [devolverCajaId, setDevolverCajaId] = useState(null);
    const [arrepentidoSubmitting, setArrepentidoSubmitting] = useState(false);
    const [dolarBlue, setDolarBlue] = useState(1000);
    const cuentasCategories = movCategories
        .filter(c => (c.tipo ?? '').includes('Cuentas'))
        .filter(c => c.branch_id === branchId || c.branch_id === null);

    const [codigoSearch, setCodigoSearch] = useState("");
    const [repuestoSearch, setRepuestoSearch] = useState("");
    const [proveedorSearch, setProveedorSearch] = useState("");

    const navigate = useNavigate();
    const location = useLocation();
    const orderId = Number(location.pathname.split("/")[2]);
    // Null-guards para string reads — evita crashes en métodos de string
    // cuando el user tiene localStorage parcial (incógnito, session vieja).
    const username = localStorage.getItem("username") ?? ""
    const user_id = localStorage.getItem("userId") ?? ""
    const branchId = JSON.parse(localStorage.getItem("branchId") ?? "null")
    const permisos = JSON.stringify(localStorage.getItem("permisos"))
    const contrasenia = localStorage.getItem("password") ?? ""

    useEffect(() => {
        const fetchStates = async () => {
            // Antes hacíamos 2 fetches (/orders + fallback a /orders/entregados)
            // y buscábamos por order_id. Eso se rompió cuando /orders empezó a
            // excluir también "Cliente avisado para retirar" e "INCUCAI": las
            // órdenes en esos 2 estados no aparecían en ninguno de los 2
            // listados y la pantalla renderizaba vacía. Usamos /orders/:id que
            // devuelve la orden sin filtrar por estado.
            await axios.get(`${SERVER}/orders/${orderId}`)
                .then(response => {
                    if (Array.isArray(response.data) && response.data.length > 0) {
                        setOrder(response.data[0])
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

            await axios.get(`${SERVER}/reduceStock/${orderId}`)
                .then(response => {
                    const reduceStockFilt = response.data.filter(item => item.orderid === orderId).sort((a, b) => b.idreducestock - a.idreducestock)
                    setReduceStock(reduceStockFilt)
                })
                .catch(error => {
                    console.error(error)
                })

            // Pre-Venta: total señado para el banner + lista de cuentas para
            // el modal "Devolver seña". No bloquea el render si fallan.
            axios.get(`${SERVER}/orders/preventa-info/${orderId}`)
                .then(r => {
                    setSenaUSD(Number(r.data.senaUSD || 0))
                    setSenaARS(Number(r.data.senaARS || 0))
                })
                .catch(e => console.error('preventa-info', e))
            axios.get(`${SERVER}/movcategories`)
                .then(r => setMovCategories(r.data))
                .catch(e => console.error('movcategories', e))
            axios.get('https://api.bluelytics.com.ar/v2/latest')
                .then(r => setDolarBlue(r.data.blue.value_sell))
                .catch(() => {})
        }
        fetchStates()
        // eslint-disable-next-line
    }, []);

    // Pre-Venta "Se arrepintió" — handler unificado. Maneja señas
    // mixtas (USD + ARS) en una sola transacción:
    //   - devolver: para CADA moneda señada, (caja_X_id, -señaX) +
    //               (Seña_X_id, +señaX). El user elige UNA caja por
    //               moneda (devolverCajaId guarda { ARS, USD }).
    //   - ganancia: (venta_id, -totalEnPesos) +
    //               (Seña_USD_id, +senaUSD) + (Seña_ARS_id, +senaARS).
    //               Sin movimiento de cash — sólo reclasificación.
    async function handleArrepentidoSubmit(accion) {
        if (arrepentidoSubmitting) return
        const senyaUsdCat = movCategories.find(c => c.categories === 'Seña USD')
        const senyaArsCat = movCategories.find(c => c.categories === 'Seña ARS')
        if (!senyaUsdCat || !senyaArsCat) { alert('Categorías "Seña USD/ARS" no encontradas'); return }
        if (senaUSD <= 0 && senaARS <= 0) { alert('Esta orden no tiene señas registradas'); return }

        const fechaAR = new Date().toLocaleString('en-IN', {
            timeZone: 'America/Argentina/Buenos_Aires', hour12: false,
        }).replace(',', '')
        let arrayMovements = []
        let opLabel, ingresoLabel, egresoLabel, montoPesos

        if (accion === 'devolver') {
            // devolverCajaId pasa a ser un objeto { ARS, USD }. Por cada
            // moneda señada hace falta una caja del mismo signo.
            const cajaARS = devolverCajaId?.ARS
            const cajaUSD = devolverCajaId?.USD
            if (senaARS > 0 && !cajaARS) { alert('Elegí la caja ARS desde donde devolver la seña en pesos'); return }
            if (senaUSD > 0 && !cajaUSD) { alert('Elegí la caja USD desde donde devolver la seña en dólares'); return }
            if (senaARS > 0) {
                arrayMovements.push([cajaARS, -senaARS])
                arrayMovements.push([senyaArsCat.idmovcategories, senaARS])
            }
            if (senaUSD > 0) {
                arrayMovements.push([cajaUSD, -senaUSD])
                arrayMovements.push([senyaUsdCat.idmovcategories, senaUSD])
            }
            opLabel = `Devolución seña pre-venta #${orderId}`
            ingresoLabel = 'Seña'
            egresoLabel = 'Devolución'
            montoPesos = senaARS + senaUSD * dolarBlue
        } else {
            // ganancia: reclassify ambas patas como Venta. El monto Venta
            // se acumula en pesos (Venta es es_dolar=0). Las dos Señas
            // se liberan en su moneda nativa.
            const ventaCat = movCategories.find(c => c.categories === 'Venta')
            if (!ventaCat) { alert('Categoría "Venta" no encontrada'); return }
            montoPesos = senaARS + senaUSD * dolarBlue
            arrayMovements.push([ventaCat.idmovcategories, -montoPesos])
            if (senaUSD > 0) arrayMovements.push([senyaUsdCat.idmovcategories, senaUSD])
            if (senaARS > 0) arrayMovements.push([senyaArsCat.idmovcategories, senaARS])
            opLabel = `Seña pre-venta #${orderId} reclasificada como ganancia`
            ingresoLabel = 'Seña'
            egresoLabel = 'Venta'
        }

        setArrepentidoSubmitting(true)
        try {
            await axios.post(`${SERVER}/movname/movesPreVentaArrepentido`, {
                valuesCreateMovname: [
                    ingresoLabel, egresoLabel, opLabel, montoPesos,
                    fechaAR, user_id, branchId, orderId,
                ],
                arrayMovements,
                branch_id: branchId,
                order_id: orderId,
            })
            alert('Pre-venta cerrada')
            window.location.reload()
        } catch (error) {
            console.error(error)
            alert('No se pudo procesar — ver consola')
            setArrepentidoSubmitting(false)
        }
    }

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
                                {order.marks_as_delivered === 1 && (
                                    <button 
                                    className="bg-red-400 text-black font-medium my-1 px-2 rounded-md"
                                    onClick={() => {navigate(`/crearOrdenGarantia/${order.order_id}`)}}>
                                        Garantia
                                    </button>
                                )}
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
                    {/* === Banner Pre-Venta (mayo 2026) === */}
                    {order.es_preventa === 1 && (
                        <div className='mx-2 my-1 bg-blue-50 border-2 border-blue-500 rounded-lg p-3'>
                            <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3'>
                                <h2 className='text-xl font-bold text-blue-800'>📋 PRE-VENTA</h2>
                                {order.state !== 'ENTREGADO' && (
                                    <div className='flex gap-2 flex-wrap'>
                                        <button
                                            className='bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1.5 rounded'
                                            onClick={() => navigate(`/preventa-cobro/${orderId}`)}>
                                            Cliente retira
                                        </button>
                                        <button
                                            className='bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded'
                                            onClick={() => setArrepentidoModal('choose')}>
                                            Se arrepintió
                                        </button>
                                    </div>
                                )}
                            </div>
                            {/* Banner pre-venta. Cada seña se mantiene en su moneda
                                nativa (Seña USD / Seña ARS). El saldo lo computamos
                                exacto en la moneda de la orden, convirtiendo SOLO la
                                pata de la moneda contraria si es necesario. */}
                            {(() => {
                                const monedaOrden = order.moneda_preventa || 'USD'
                                const precio = Number(order.precio_venta || 0)
                                const senadoEnMoneda = monedaOrden === 'USD'
                                    ? senaUSD + senaARS / dolarBlue
                                    : senaARS + senaUSD * dolarBlue
                                const saldo = Math.max(0, precio - senadoEnMoneda)
                                const fmt = n => Math.round(n).toLocaleString('es-AR')
                                return (
                                    <div className='grid grid-cols-2 md:grid-cols-4 gap-2 text-sm'>
                                        <div className='bg-white rounded p-2 border'>
                                            <div className='text-xs text-gray-500 uppercase'>Precio</div>
                                            <div className='text-lg font-bold'>${fmt(precio)} <span className='text-xs text-gray-500'>{monedaOrden}</span></div>
                                        </div>
                                        <div className='bg-amber-50 rounded p-2 border border-amber-300'>
                                            <div className='text-xs text-amber-700 uppercase'>Señado</div>
                                            {senaUSD > 0 && (
                                                <div className='text-base font-bold'>${fmt(senaUSD)} <span className='text-xs text-amber-700'>USD</span></div>
                                            )}
                                            {senaARS > 0 && (
                                                <div className='text-base font-bold'>${fmt(senaARS)} <span className='text-xs text-amber-700'>ARS</span></div>
                                            )}
                                            {senaUSD === 0 && senaARS === 0 && (
                                                <div className='text-base text-gray-500'>—</div>
                                            )}
                                        </div>
                                        <div className='bg-green-50 rounded p-2 border border-green-300'>
                                            <div className='text-xs text-green-700 uppercase'>Saldo</div>
                                            <div className='text-lg font-bold'>${fmt(saldo)} <span className='text-xs text-green-700'>{monedaOrden}</span></div>
                                        </div>
                                        <div className='bg-white rounded p-2 border'>
                                            <div className='text-xs text-gray-500 uppercase'>Color</div>
                                            <div className='text-lg font-medium'>{order.color_preventa || order.device_color || '—'}</div>
                                        </div>
                                    </div>
                                )
                            })()}
                        </div>
                    )}
                    {/* === Modal "Se arrepintió" === */}
                    {arrepentidoModal && (
                        <div className='fixed inset-0 z-40 bg-black bg-opacity-40 flex items-center justify-center px-4'>
                            <div className='bg-white rounded-lg shadow-xl w-full max-w-md p-5'>
                                {arrepentidoModal === 'choose' && (
                                    <>
                                        <h3 className='text-xl font-bold mb-3'>Cliente se arrepintió</h3>
                                        <p className='text-sm text-gray-600 mb-4'>
                                            Señado a la fecha:
                                            {senaUSD > 0 && <> <b>${Math.round(senaUSD).toLocaleString('es-AR')} USD</b></>}
                                            {senaUSD > 0 && senaARS > 0 && ' + '}
                                            {senaARS > 0 && <> <b>${Math.round(senaARS).toLocaleString('es-AR')} ARS</b></>}.
                                            ¿Qué hacés con la seña?
                                        </p>
                                        <div className='flex flex-col gap-2'>
                                            <button
                                                className='bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded'
                                                onClick={() => setArrepentidoModal('devolver')}>
                                                Devolver seña
                                            </button>
                                            <button
                                                className='bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
                                                onClick={() => setArrepentidoModal('ganancia')}>
                                                Computar como ganancia
                                            </button>
                                            <button
                                                className='border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded hover:bg-gray-50'
                                                onClick={() => setArrepentidoModal(null)}>
                                                Cancelar
                                            </button>
                                        </div>
                                    </>
                                )}
                                {arrepentidoModal === 'devolver' && (
                                    <>
                                        <h3 className='text-xl font-bold mb-3'>Devolver seña</h3>
                                        <p className='text-sm text-gray-600 mb-3'>
                                            Elegí desde dónde sale el dinero. Si hay señas en ambas
                                            monedas, hay que elegir una caja por moneda.
                                        </p>
                                        {senaARS > 0 && (
                                            <div className='mb-3'>
                                                <label className='block text-xs font-bold text-gray-700 mb-1'>
                                                    Caja ARS para devolver ${Math.round(senaARS).toLocaleString('es-AR')}:
                                                </label>
                                                <select
                                                    className='w-full border rounded p-2'
                                                    value={devolverCajaId?.ARS ?? ''}
                                                    onChange={e => setDevolverCajaId(prev => ({
                                                        ...(prev || {}),
                                                        ARS: Number(e.target.value) || null,
                                                    }))}>
                                                    <option value=''>Seleccionar caja en pesos…</option>
                                                    {cuentasCategories.filter(c => c.es_dolar !== 1).map(c => (
                                                        <option key={c.idmovcategories} value={c.idmovcategories}>{c.categories}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        {senaUSD > 0 && (
                                            <div className='mb-3'>
                                                <label className='block text-xs font-bold text-gray-700 mb-1'>
                                                    Caja USD para devolver US$ {Math.round(senaUSD).toLocaleString('es-AR')}:
                                                </label>
                                                <select
                                                    className='w-full border rounded p-2'
                                                    value={devolverCajaId?.USD ?? ''}
                                                    onChange={e => setDevolverCajaId(prev => ({
                                                        ...(prev || {}),
                                                        USD: Number(e.target.value) || null,
                                                    }))}>
                                                    <option value=''>Seleccionar caja en dólares…</option>
                                                    {cuentasCategories.filter(c => c.es_dolar === 1).map(c => (
                                                        <option key={c.idmovcategories} value={c.idmovcategories}>{c.categories}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <div className='flex gap-2 justify-end'>
                                            <button className='border border-gray-300 px-3 py-1 rounded'
                                                onClick={() => { setArrepentidoModal('choose'); setDevolverCajaId(null) }}>
                                                Atrás
                                            </button>
                                            <button
                                                disabled={arrepentidoSubmitting ||
                                                    (senaARS > 0 && !devolverCajaId?.ARS) ||
                                                    (senaUSD > 0 && !devolverCajaId?.USD)}
                                                className={`px-3 py-1 rounded text-white font-bold ${arrepentidoSubmitting ? 'bg-gray-400' : 'bg-orange-500 hover:bg-orange-600'}`}
                                                onClick={() => handleArrepentidoSubmit('devolver')}>
                                                {arrepentidoSubmitting ? 'Procesando…' : 'Confirmar devolución'}
                                            </button>
                                        </div>
                                    </>
                                )}
                                {arrepentidoModal === 'ganancia' && (
                                    <>
                                        <h3 className='text-xl font-bold mb-3'>Computar como ganancia</h3>
                                        <p className='text-sm text-gray-600 mb-4'>
                                            Las señas
                                            {senaUSD > 0 && <> de <b>${Math.round(senaUSD).toLocaleString('es-AR')} USD</b></>}
                                            {senaUSD > 0 && senaARS > 0 && ' y'}
                                            {senaARS > 0 && <> de <b>${Math.round(senaARS).toLocaleString('es-AR')} ARS</b></>}
                                            {' '}quedan en sus cajas originales y se reclasifican como Venta
                                            ({Math.round(senaARS + senaUSD * dolarBlue).toLocaleString('es-AR')} pesos al blue).
                                            La orden pasa a ENTREGADO.
                                        </p>
                                        <div className='flex gap-2 justify-end'>
                                            <button className='border border-gray-300 px-3 py-1 rounded'
                                                onClick={() => setArrepentidoModal('choose')}>
                                                Atrás
                                            </button>
                                            <button
                                                disabled={arrepentidoSubmitting}
                                                className={`px-3 py-1 rounded text-white font-bold ${arrepentidoSubmitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                                                onClick={() => handleArrepentidoSubmit('ganancia')}>
                                                {arrepentidoSubmitting ? 'Procesando…' : 'Confirmar ganancia'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="mx-2 my-1 bg-blue-100 p-2 flex flex-col justify-between md:flex-row">
                        <h1>Estado de la Reparacion: <span className='text-lg'>{order.state}</span></h1>
                        <div className='flex'>
                            <h1 className='mr-2'>Asignada a: {order.users_id == null
                                ? <span className='italic text-gray-600'>Propiedad de TheDoniPhone</span>
                                : order.grupo}</h1>
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
                            <label>{formatDateDmy(pickDate(order, 'created_at'))}</label>
                        </div>
                        <div className='flex'>
                            <label className="block text-gray-700 font-bold mb-2 mr-2 w-40">Fecha de entregado: </label>
                            <label>{formatDateDmy(pickDate(order, 'returned_at'))}</label>
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
                                <div>
                                    <button className="mr-2 md:mr-10 bg-red-500 hover:bg-red-700 px-1 color"
                                    onClick={() => eliminarElemento(message.idmessages)} >
                                        X
                                    </button>
                                    <label className='mr-1'>{formatDateTimeDmy(pickDate(message, 'created_at'))}</label>
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
                                            <td className="border px-4 py-2 text-center" value={stock.date}>{formatDateTimeDmy(pickDate(stock, 'date'))}</td>
                                            {order.marks_as_delivered !== 1 && order.state !== 'INCUCAI' && stock.es_garantia === 0 && (
                                                <td>
                                                    <button className="bg-red-500 border px-4 py-2 color" onClick={() => eliminarRepuesto(stock.idreducestock, stock.stockbranchid, stock.cantidad_restante)}>Eliminar</button>
                                                </td>
                                            )}
                                            {order.marks_as_delivered !== 1 && order.state !== 'INCUCAI' && stock.es_garantia === 0 && (
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
                                            {stock.idstock} - {stock.repuesto} - {formatDateTimeDmy(pickDate(stock, 'date'))}
                                        </summary>
                                        <div className="bg-gray-100 flex flex-col items-center">
                                            <p className="border px-4 py-2 text-center" value={stock.precio_compra}>{stock.precio_compra}</p>
                                            <p className="border px-4 py-2 text-center" value={stock.nombre}>{stock.nombre}</p>
                                            <p className="border px-4 py-2 text-center" value={stock.username}>{stock.username}</p>
                                            {order.marks_as_delivered !== 1 && order.state !== 'INCUCAI' && (
                                                <p>
                                                    <button className="bg-red-500 border px-4 py-2 color" onClick={() => eliminarRepuesto(stock.idreducestock, stock.stockbranchid, stock.cantidad_restante)}>Eliminar</button>
                                                </p>
                                            )}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                        {order.marks_as_delivered !== 1 && order.state !== 'INCUCAI' && (
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