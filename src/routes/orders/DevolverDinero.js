import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'
import Select from 'react-select';

function DevolverDinero() {
    const [payCategories, setPayCategories] = useState([])
    const [selectCobro, setSelectCobro] = useState([])

    const [cajaId, setCajaId] = useState(0)
    const [pesosId, setPesosId] = useState(0)
    const [usdId, setusdId] = useState(0)
    const [mpId, setmpId] = useState(0)
    const [bancoId, setBancoId] = useState(0)

    const [account, setAccount] = useState({})

    const [dolar, setDolar] = useState(500)
    const branchId = JSON.parse(localStorage.getItem("branchId"))                
    const userId = JSON.parse(localStorage.getItem("userId"))

    const location = useLocation();
    const movnameId = parseInt(location.pathname.split("/")[2]);
    const [orderId, setOrderId] = useState([])

    const navigate = useNavigate();

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/cobros/movname/${movnameId}`)
                .then(response => {
                    const valoresCobro = response.data[0]
                    setSelectCobro(valoresCobro)
                    setOrderId(valoresCobro.order_id)
                })
                .catch(error => {
                    console.error(error)
                })

            await axios.get(`${SERVER}/movcategories`)
                .then(response => {
                    for (let i = 0; i < response.data.length; i++) {
                        if (response.data[i].tipo.includes("Pagar")) {
                            setPayCategories(prevArray => [...prevArray, response.data[i]])
                        }
                        if(response.data[i].categories === "Caja") {
                            setCajaId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "Pesos") {
                            setPesosId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "Dolares") {
                            setusdId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "MercadoPago") {
                            setmpId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "Banco") {
                            setBancoId(response.data[i].idmovcategories)
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
        }
        fetchStates()
        // eslint-disable-next-line
    }, []);

    const [isNotLoading, setIsNotLoading] = useState(true);

    async function handleSubmit(event) {
        event.preventDefault();
        if (isNotLoading) {
            setIsNotLoading(false)
            try {    
                const valueUsd = parseInt(document.getElementById('clienteUSD').value) || 0
                const valuePesos = parseInt(document.getElementById('clientePesos').value) || 0
                const valueTrans = parseInt(document.getElementById('clienteBanco').value) || 0
                const valueMp = parseInt(document.getElementById('clienteMercadopago').value) || 0
                
                const dolarArr = [valueUsd]
                const pesosArr = [valuePesos, valueTrans, valueMp]
    
                const montoUSD = dolarArr.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
                const montoPesos = pesosArr.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
                const montoTotal = montoPesos + (montoUSD * dolar)
                const montoTotalUsd = montoTotal / dolar
            
    
                if(montoTotal === 0){
                    setIsNotLoading(true)
                    return alert("Ingresar montos")
                }
        
                const fechaHoraBuenosAires = new Date().toLocaleString("en-IN", {timeZone: "America/Argentina/Buenos_Aires", hour12: false}).replace(',', '');
                
                const arrayMovements = []
                if(cajaId === account.value.idmovcategories) {
                    if (valueUsd !== 0){
                        arrayMovements.push([usdId, -valueUsd])
                    }
                    if (valueTrans !== 0){
                        arrayMovements.push([bancoId, -valueTrans])
                    }
                    if (valuePesos !== 0){
                        arrayMovements.push([pesosId, -valuePesos])
                    }
                    if (valueMp !== 0){
                        arrayMovements.push([mpId, -valueMp])
                    }
                } else {
                    arrayMovements.push([account.value.idmovcategories, -montoTotalUsd])
                }

                const valuesMovname = {
                    ingreso: "Reparaciones", 
                    egreso: account.value.categories, 
                    operacion: `Devolucion dinero Order #${orderId}`, 
                    monto: montoTotal,
                    userId,
                    branch_id: branchId,
                    fecha: fechaHoraBuenosAires,
                    order_id: orderId,
                    arrayMovements,
                }

                setIsNotLoading(true)
                console.log(valuesMovname)
                /*
                // movname
                await axios.post(`${SERVER}/movname`, valuesMovname)
                    .then(response => {
                        if (response.status === 200){ 
                            setIsNotLoading(true)
                            alert("Pago agregado")
                            navigate('/movements');
                        } 
                    })
                    .catch(error => {
                        console.error(error);
                    });
                    */
            } catch (error) {
                setIsNotLoading(true)
                alert(error);
            }
        }
    }

    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className='bg-white my-2 py-8 px-2 max-w-4xl mx-auto'>
                <h1 className="text-center text-5xl">Devolver dinero Orden #{orderId}</h1>
                {/* Sucursal */}
                <div className="p-4 max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="mb-4">
                        <div className="mb-2">
                            <div className='flex justify-center my-2'>
                                <table>
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-2 border border-black">Pesos</th>
                                            <th className="px-4 py-2 border border-black">Dolares</th>
                                            <th className="px-4 py-2 border border-black">Banco</th>
                                            <th className="px-4 py-2 border border-black">Mercado Pago</th>
                                            <th className="px-4 py-2 border border-black">Encargado</th>
                                        </tr>
                                    </thead>
                                    <tbody className='text-center'>
                                        <tr className="border border-black">
                                            <td className="px-4 py-2">{selectCobro.pesos}</td>
                                            <td className="px-4 py-2">{selectCobro.dolares}</td>
                                            <td className="px-4 py-2">{selectCobro.banco}</td>
                                            <td className="px-4 py-2">{selectCobro.mercado_pago}</td>
                                            <td className="px-4 py-2">{selectCobro.encargado}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className='flex items-end bg-blue-100 mb-1 p-2'>
                                <div className='w-full'>
                                    <label className="block text-gray-700 font-bold mb-2">Quien: *</label>
                                    <Select 
                                    required
                                    options={ payCategories.map((category) => ({label: category.categories, value: category})) }
                                    onChange={ (e) => setAccount(e) }
                                    placeholder='Quien'
                                    />
                                </div>
                            </div>
                            {/* Valores Cliente */}
                            <div className='flex items-end bg-blue-100 mb-1 p-2'>
                                <div className='w-full text-center'>
                                    <label className="block text-gray-700 font-bold mb-2 border-b-2">Pago *</label>
                                    <div className='flex'>
                                        <div className='w-full'>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor="clientePesos">Pesos:</label>
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="number"
                                                defaultValue="0"
                                                min="0"
                                                id="clientePesos" 
                                            />
                                        </div>     
                                        <div className='w-full'>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor="clienteUSD">USD:</label>
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="number"
                                                defaultValue="0"
                                                min="0"
                                                id="clienteUSD" 
                                            />
                                        </div>    
                                        <div className='w-full'>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor="clienteBanco">Banco:</label>
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="number"
                                                defaultValue="0"
                                                min="0"
                                                id="clienteBanco" 
                                            />
                                        </div>
                                        <div className='w-full'>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor="clienteMercadopago">MercadoPago:</label>
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="number"
                                                min="0"
                                                defaultValue="0"
                                                id="clienteMercadopago" 
                                            />
                                        </div>                                
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

export default DevolverDinero