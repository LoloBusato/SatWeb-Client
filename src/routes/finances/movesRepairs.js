import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

function MovesRepairs() {
    const [payCategories, setPayCategories] = useState([])
    const [cuentasCategories, setCuentasCategories] = useState([])
    const [cuentasVueltoCategories, setCuentasVueltoCategories] = useState([])

    const [reparacionesId, setReparacionesId] = useState(0)
    const [cmvId, setcmvId] = useState(0)
    const [repuestosId, setRepuestosId] = useState(0)    
    const [cajaId, setCajaId] = useState(0)
    const [cmvBelgId, setcmvBelgId] = useState(0)

    const [dolar, setDolar] = useState(500)

    const [showVuelto, setShowVuelto] = useState(false);

    const [valorRepuestosUsd, setValorRepuestosUsd] = useState([]);
    const [repuestosArr, setRepuestosArr] = useState([])

    const navigate = useNavigate();
    const location = useLocation();
    const orderId = Number(location.pathname.split("/")[2]);
    const branchId = JSON.parse(localStorage.getItem("branchId"))
    const userId = JSON.parse(localStorage.getItem("userId"))

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/movcategories`)
                .then(response => {
                    const tempCategories = {
                        pay: [],
                        };
            
                        response.data.forEach((category) => {
                            if (category.tipo.includes("Pagar")) {
                                tempCategories.pay.push(category);
                            }
                            switch (category.categories) {
                                case "Caja":
                                    setCajaId(category.idmovcategories)
                                    break;
                                case "CMVBelgrano":
                                    setcmvBelgId(category.idmovcategories)
                                    break
                                case "Repuestos": 
                                    setRepuestosId(category.idmovcategories)
                                    break
                                case "CMV": 
                                    setcmvId(category.idmovcategories)
                                    break
                                case "Reparaciones":
                                    setReparacionesId(category.idmovcategories)
                                    break
                                default:
                                    break
                            }
                        });
                        const cuentas = response.data
                        .filter((cuenta) => cuenta.tipo.includes("Cuentas"))
                        .filter((cuenta) => cuenta.branch_id === branchId || cuenta.branch_id === null)
            
                        const cuentasVuelto = cuentas.map((cuenta) => ({
                            ...cuenta,
                            categories: `${cuenta.categories}Vuelto`
                        }))

                        setCuentasVueltoCategories(cuentasVuelto)
                        setCuentasCategories(cuentas)
                        setPayCategories(tempCategories.pay);
                })
                .catch(error => {
                    console.error(error)
                })

            await axios.get(`https://api.bluelytics.com.ar/v2/latest`)
                .then(response => {
                    setDolar(response.data.blue.value_sell)
                })
                .catch(error => {
                    console.error(error)
                })

            await axios.get(`${SERVER}/reduceStock/${orderId}`)
                .then(response => {
                    const reduceStockFilt = response.data.filter(item => item.orderid === orderId)
                    setRepuestosArr(reduceStockFilt)
                    const repuestosUsd = reduceStockFilt.reduce((accumulator, currentValue) => accumulator + parseFloat(currentValue.precio_compra), 0)
                    setValorRepuestosUsd(repuestosUsd)
                })
                .catch(error => {
                    console.error(error)
                })
        }
        fetchStates()
        // eslint-disable-next-line
    }, []);

    const [isNotLoading, setIsNotLoading] = useState(true);

    async function handleSubmit(event) {
        event.preventDefault();
        // Aquí es donde enviarías la información de inicio de sesión al servidor
        if (isNotLoading) {
            setIsNotLoading(false)
            try {
                const fechaHoraBuenosAires = new Date().toLocaleString("en-IN", {timeZone: "America/Argentina/Buenos_Aires", hour12: false}).replace(',', '');

                const cuentaVuelto = parseInt(document.getElementById("cuenta").value) || 0

                const arrayMovements = []

                const cobrosValues = {}

                let ingresoTotal = 0
                cuentasCategories.forEach((cuenta) => {
                    const value = parseInt(document.getElementById(cuenta.categories).value) || 0
                    if (value !== 0) {
                        if (cobrosValues.hasOwnProperty(cuenta.idmovcategories)) {
                            if (cuenta.es_dolar === 1) {
                                cobrosValues[cuenta.idmovcategories] += (value * dolar)
                            } else {
                                cobrosValues[cuenta.idmovcategories] += value
                            }
                        } else {
                            if (cuenta.es_dolar === 1) {
                                cobrosValues[cuenta.idmovcategories] = (value * dolar)
                            } else {
                                cobrosValues[cuenta.idmovcategories] = value
                            }
                        }
                        if (cuenta.es_dolar === 1) {
                            ingresoTotal += (value * dolar)
                        } else {
                            ingresoTotal += value
                        }
                    }
                })

                let vueltoTotal = 0
                if (cuentaVuelto !== 0) {
                    cuentasVueltoCategories.forEach((cuenta) => {
                        const value = parseInt(document.getElementById(cuenta.categories).value) || 0
                        if (value !== 0) {
                            if (cuentaVuelto === cajaId) {
                                if (cobrosValues.hasOwnProperty(cuenta.idmovcategories)) {
                                    if (cuenta.es_dolar === 1) {
                                        cobrosValues[cuenta.idmovcategories] -= (value * dolar)
                                    } else {
                                        cobrosValues[cuenta.idmovcategories] -= value
                                    }
                                } else {
                                    if (cuenta.es_dolar === 1) {
                                        cobrosValues[cuenta.idmovcategories] = -(value * dolar)
                                    } else {
                                        cobrosValues[cuenta.idmovcategories] = -value
                                    }
                                }
                            } else {
                                if (cobrosValues.hasOwnProperty(cuentaVuelto)) {
                                    if (cuenta.es_dolar === 1) {
                                        cobrosValues[cuentaVuelto] -= (value * dolar)
                                    } else {
                                        cobrosValues[cuentaVuelto] -= value
                                    }
                                } else {
                                    if (cuenta.es_dolar === 1) {
                                        cobrosValues[cuentaVuelto] = -(value * dolar)
                                    } else {
                                        cobrosValues[cuentaVuelto] = -value
                                    }
                                }
                            }
                            if (cuenta.es_dolar === 1) {
                                vueltoTotal += (value * dolar)
                            } else {
                                vueltoTotal += value
                            }
                        }
                    })
                }

                if (vueltoTotal !== 0 && cuentaVuelto === 0) {
                    setIsNotLoading(true)
                    return alert('Agregar caja para el vuelto')
                }

                const montoTotal = ingresoTotal - vueltoTotal

                if(montoTotal === 0){
                    setIsNotLoading(true)
                    return alert("Agregar pago")
                } else if (montoTotal < 0) {
                    setIsNotLoading(true)
                    const result = window.confirm('¿Estás seguro de que el resultado de la venta tiene valor negativo?');
                    if(!result) {
                        return alert('Cambiar valores de vuelto y cuenta para que el valor sea positivo')
                    }
                }

                cuentasCategories.forEach(cuenta => {
                    if (cobrosValues.hasOwnProperty(cuenta.idmovcategories)) {
                        if (cuenta.es_dolar === 1) {
                            return arrayMovements.push([cuenta.idmovcategories, (cobrosValues[cuenta.idmovcategories] / dolar).toFixed(2)])
                        } else {
                            return arrayMovements.push([cuenta.idmovcategories, cobrosValues[cuenta.idmovcategories]])
                        }
                    }
                })

                const cmvBelg = repuestosArr.filter((repuesto) => repuesto.original_branch === 1).reduce((accumulator, currentValue) => accumulator + parseInt(currentValue.precio_compra), 0)
                if(cmvBelg > 0 && branchId !== 1) {
                    arrayMovements.push([cmvBelgId, cmvBelg])
                }

                arrayMovements.push([reparacionesId, -montoTotal])
                if (parseFloat(valorRepuestosUsd) !== 0) {
                    arrayMovements.push([cmvId, parseFloat(valorRepuestosUsd)])
                    arrayMovements.push([repuestosId, -parseFloat(valorRepuestosUsd)])
                }

                const valuesMovname = {
                    ingreso: "Caja", 
                    egreso: "Reparaciones", 
                    operacion: `Cobro orden #${orderId}`, 
                    monto: montoTotal,
                    userId,
                    branch_id: branchId,
                    fecha: fechaHoraBuenosAires,
                    order_id: orderId,
                    arrayMovements,
                    entregarOrden: true
                }

                await axios.post(`${SERVER}/movname/movesRepairs`, valuesMovname)
                    .then(response => {
                        setIsNotLoading(true)
                        if (response.status === 200){ 
                            navigate(`/messages/${orderId}`)
                        } 
                    })
                    .catch(error => {
                        setIsNotLoading(true)
                        alert(error);
                    });
            } catch (error) {
                setIsNotLoading(true)
                alert(error.response.data);
            }
        }
    }

    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className='bg-white my-2 py-8 px-2 max-w-4xl mx-auto'>
                <h1 className="text-center text-5xl">Cobrar orden #{orderId}</h1>
                {/* Reparaciones */}
                <div className="p-4 max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="mb-4">
                        {/* Costo de los repuestos */}
                        <div className='flex items-end bg-blue-100 mb-1 p-2'>
                            <div className='flex flex-col w-full items-center'>
                                <label>Costo de los repuestos en dolares</label>
                                <label className='font-bold'>${valorRepuestosUsd}</label>
                            </div>
                            <div className='flex flex-col w-full items-center'>
                                <label>Costo de los repuestos en pesos</label>
                                <label className='font-bold'>${(valorRepuestosUsd * dolar).toFixed(2)}</label>
                            </div>
                        </div>
                        {/* Valores Cliente */}
                        <div className='flex items-end bg-blue-100 mb-1 p-2'>
                            <div className='w-full text-center'>
                                <label className="block text-gray-700 font-bold mb-2 border-b-2">Pago * LA CUENTA ENCARGADO PONER VALORES EN DOLARES</label>
                                <div className='flex'>
                                {cuentasCategories.map((category) => (
                                    <div className='w-full' key={category.idmovcategories}>
                                        <label className="block text-gray-700 font-bold mb-2" htmlFor={category.categories}>{category.categories}:</label>
                                        <input 
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                            type="number"
                                            step="1" 
                                            min="0"
                                            id={category.categories}
                                            name={category.categories}
                                        />
                                    </div>     
                                ))}                                
                                </div>
                            </div>
                        </div>
                        {/* Valores Vuelto */}
                        <div className='flex items-end bg-blue-100 mb-1 p-2'>
                            <div className='w-2/12'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Cuenta: *</label>
                                <select onChange={(e) => setShowVuelto(e.target.value !== '')} name="cuenta" id="cuenta" defaultValue={""} className='w-full shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline' >
                                    <option value="" disabled >Cuenta</option>
                                    {payCategories.map((category) => (
                                        <option key={category.idmovcategories} value={category.idmovcategories}>{category.categories}</option>
                                    ))}
                                </select>
                            </div>
                            {showVuelto && (
                            <div className='w-full text-center'>
                                <label className="block text-gray-700 font-bold mb-2 border-b-2">Vuelto *</label>
                                <div className='flex'>
                                {cuentasVueltoCategories.map((category) => (
                                    <div className='w-full' key={`vuelto${category.idmovcategories}`}>
                                        <label className="block text-gray-700 font-bold mb-2" htmlFor={category.categories}>{category.categories}:</label>
                                        <input 
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                            type="number"
                                            step="1" 
                                            min="0"
                                            id={category.categories}
                                            name={category.categories}
                                        />
                                    </div>     
                                ))}                                
                                </div>
                            </div>
                            )}
                        </div>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Guardar
                        </button>
                        <button 
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            onClick={() => { navigate(`/home`) }} >
                                Volver
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default MovesRepairs