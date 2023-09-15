import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

function MovesRepairs() {
    const [reparacionesId, setReparacionesId] = useState(0)
    const [cmvId, setcmvId] = useState(0)
    const [repuestosId, setRepuestosId] = useState(0)    
    const [payCategories, setPayCategories] = useState([])
    const [cajaId, setCajaId] = useState(0)
    const [pesosId, setPesosId] = useState(0)
    const [usdId, setusdId] = useState(0)
    const [mpId, setmpId] = useState(0)
    const [bancoId, setBancoId] = useState(0)
    const [encargadoId, setEncargadoId] = useState(0)
    const [cmvBelgId, setcmvBelgId] = useState(0)

    const [dolar, setDolar] = useState(500)
    const [valorRepuestosUsd, setValorRepuestosUsd] = useState([]);
    const [repuestosArr, setRepuestosArr] = useState([])

    const navigate = useNavigate();
    const location = useLocation();
    const orderId = Number(location.pathname.split("/")[2]);
    const branchId = JSON.parse(localStorage.getItem("branchId"))

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/movcategories`)
                .then(response => {
                    for (let i = 0; i < response.data.length; i++) {
                        if (response.data[i].tipo.includes("Pagar")) {
                            setPayCategories(prevArray => [...prevArray, response.data[i]])
                        }
                        if(response.data[i].categories === "Reparaciones") {
                            setReparacionesId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "CMV") {
                            setcmvId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "Repuestos") {
                            setRepuestosId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "Caja") {
                            setCajaId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "Pesos") {
                            setPesosId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "Dolares") {
                            setusdId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "MercadoPago") {
                            setmpId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "Banco") {
                            setBancoId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "Encargado") {
                            setEncargadoId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "CMVBelgrano") {
                            setcmvBelgId(response.data[i].idmovcategories)
                        } 
                    }
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
                const userId = JSON.parse(localStorage.getItem("userId"))
    
                const formData = new FormData(event.target);
    
                const cuentaVuelto = parseInt(document.getElementById("cuenta").value)
    
                const valueUsd = parseInt(formData.get('clienteUSD')) || 0
                const valuePesos = parseInt(formData.get('clientePesos')) || 0
                const valueTrans = parseInt(formData.get('clienteBanco')) || 0
                const valueMp = parseInt(formData.get('clienteMercadopago')) || 0
                const vueltoUsd = -parseInt(formData.get('cajaUSD')) || 0
                const vueltoPesos = -parseInt(formData.get('cajaPesos')) || 0
                const vueltoTrans = -parseInt(formData.get('cajaBanco')) || 0
                const vueltoMp = -parseFloat(formData.get('cajaMercadopago')) || 0
                
                const dolarArr = [valueUsd, vueltoUsd]
                const pesosArr = [valuePesos, valueTrans, valueMp, vueltoPesos, vueltoTrans, vueltoMp]
                
                const montoUSD = dolarArr.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
                const montoPesos = pesosArr.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
                const montoTotal = montoPesos + (montoUSD * dolar)
                const vuelto = (vueltoUsd * dolar) + vueltoTrans + vueltoPesos + vueltoMp

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
                if (vuelto !== 0 && isNaN(cuentaVuelto)) {
                    setIsNotLoading(true)
                    return alert('Agregar caja para el vuelto')
                }
    
                const arrayMovements = []
    
                const fechaHoraBuenosAires = new Date().toLocaleString("en-IN", {timeZone: "America/Argentina/Buenos_Aires", hour12: false}).replace(',', '');

                const cobrosValues = {}

                if (cuentaVuelto === cajaId) {
                    if (vueltoUsd !== 0 || valueUsd !== 0){
                        cobrosValues.dolares = (valueUsd + vueltoUsd)
                        arrayMovements.push([usdId, (valueUsd + vueltoUsd)])
                    }
                    if (vueltoTrans !== 0 || valueTrans !== 0){
                        cobrosValues.banco = (valueTrans + vueltoTrans)
                        arrayMovements.push([bancoId, (valueTrans + vueltoTrans)])
                    }
                    if (vueltoPesos !== 0 || valuePesos !== 0){
                        cobrosValues.pesos = (valuePesos + vueltoPesos)
                        arrayMovements.push([pesosId, (valuePesos + vueltoPesos)])
                    }
                    if (vueltoMp !== 0 || valueMp !== 0){
                        cobrosValues.mercado_pago = (valueMp + vueltoMp)
                        arrayMovements.push([mpId, (valueMp + vueltoMp)])
                    }
                }  else {
                    if (valueUsd !== 0){
                        cobrosValues.dolares = valueUsd
                        arrayMovements.push([usdId, valueUsd])
                    }
                    if (valueTrans !== 0){
                        cobrosValues.banco = valueTrans
                        arrayMovements.push([bancoId, valueTrans])
                    }
                    if (valuePesos !== 0){
                        cobrosValues.pesos = valuePesos
                        arrayMovements.push([pesosId, valuePesos])
                    }
                    if (valueMp !== 0){
                        cobrosValues.mercado_pago = valueMp
                        arrayMovements.push([mpId, valueMp])
                    }
                    if (cuentaVuelto === encargadoId) {
                        if (vuelto !== 0){
                            cobrosValues.encargado = vuelto
                            arrayMovements.push([encargadoId, vuelto])
                        }
                    }
                }
                
                const cmvBelg = repuestosArr.filter((repuesto) => repuesto.branch_id === 1).reduce((accumulator, currentValue) => accumulator + currentValue, 0)
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
                    cobrosValues,
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
                                <label className='font-bold'>${valorRepuestosUsd * dolar}</label>
                            </div>
                        </div>
                        {/* Valores Cliente */}
                        <div className='flex items-end bg-blue-100 mb-1 p-2'>
                            <div className='w-full text-center'>
                                <label className="block text-gray-700 font-bold mb-2 border-b-2">Pago *</label>
                                <div className='flex'>
                                    <div className='w-full'>
                                        <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Pesos:</label>
                                        <input 
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                            type="number"
                                            step="0.01" 
                                            defaultValue="0"
                                            id="clientePesos" 
                                            name='clientePesos'
                                        />
                                    </div>     
                                    <div className='w-full'>
                                        <label className="block text-gray-700 font-bold mb-2" htmlFor="name">USD:</label>
                                        <input 
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                            type="number"
                                            step="0.01" 
                                            defaultValue="0"
                                            id="clienteUSD" 
                                            name='clienteUSD'
                                        />
                                    </div>    
                                    <div className='w-full'>
                                        <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Banco:</label>
                                        <input 
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                            type="number"
                                            step="0.01" 
                                            defaultValue="0"
                                            id="clienteBanco" 
                                            name='clienteBanco'
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <label className="block text-gray-700 font-bold mb-2" htmlFor="name">MercadoPago:</label>
                                        <input 
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                            type="number"
                                            step="0.01" 
                                            defaultValue="0"
                                            id="clienteMercadopago" 
                                            name='clienteMercadopago'
                                        />
                                    </div>                                
                                </div>
                            </div>
                        </div>
                        {/* Valores Vuelto */}
                        <div className='flex items-end bg-blue-100 mb-1 p-2'>
                            <div className='w-1/2'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Cuenta: *</label>
                                <select name="cuenta" id="cuenta" defaultValue={""} className='w-full shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline' >
                                    <option value="" disabled >Cuenta</option>
                                    {payCategories.map((category) => (
                                        <option key={category.idmovcategories} value={category.idmovcategories}>{category.categories}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='w-full text-center'>
                                <label className="block text-gray-700 font-bold mb-2 border-b-2">Vuelto *</label>
                                <div className='flex'>
                                    <div className='w-full'>
                                        <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Pesos:</label>
                                        <input 
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                            type="number"
                                            defaultValue="0"
                                            id="cajaPesos" 
                                            name='cajaPesos'
                                        />
                                    </div>     
                                    <div className='w-full'>
                                        <label className="block text-gray-700 font-bold mb-2" htmlFor="name">USD:</label>
                                        <input 
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                            type="number"
                                            defaultValue="0"
                                            id="cajaUSD" 
                                            name='cajaUSD'
                                        />
                                    </div>    
                                    <div className='w-full'>
                                        <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Banco:</label>
                                        <input 
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                            type="number"
                                            defaultValue="0"
                                            id="cajaBanco" 
                                            name='cajaBanco'
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <label className="block text-gray-700 font-bold mb-2" htmlFor="name">MercadoPago:</label>
                                        <input 
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                            type="number"
                                            defaultValue="0"
                                            id="cajaMercadopago" 
                                            name='cajaMercadopago'
                                        />
                                    </div>                                
                                </div>
                            </div>
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