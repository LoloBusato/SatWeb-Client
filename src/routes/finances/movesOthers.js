import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';

function MovesOthers() {
    const [otherCategories, setOtherCategories] = useState([])
    const [payCategories, setPayCategories] = useState([])
    const [cajaId, setCajaId] = useState(0)
    const [pesosId, setPesosId] = useState(0)
    const [usdId, setusdId] = useState(0)
    const [mpId, setmpId] = useState(0)
    const [bancoId, setBancoId] = useState(0)

    const [dolar, setDolar] = useState(500)

    const navigate = useNavigate();

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get('http://localhost:3001/movcategories')
                .then(response => {
                    for (let i = 0; i < response.data.length; i++) {
                        if (response.data[i].tipo.includes("Otros")) {
                            setOtherCategories(prevArray => [...prevArray, response.data[i]])
                        }
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
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        // Aquí es donde enviarías la información de inicio de sesión al servidor
        try {
            const userId = JSON.parse(localStorage.getItem("userId"))

            const formData = new FormData(event.target);

            const valueUsd = parseInt(formData.get('clienteUSD'))
            const valuePesos = parseInt(formData.get('clientePesos'))
            const valueTrans = parseInt(formData.get('clienteBanco'))
            const valueMp = parseInt(formData.get('clienteMercadopago'))
            
            const dolarArr = [valueUsd]
            const pesosArr = [valuePesos, valueTrans, valueMp]

            const montoUSD = dolarArr.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
            const montoPesos = pesosArr.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
            const montoTotal = montoPesos + (montoUSD * dolar)

            const arrayMovements = []

            const gasto = formData.get('gasto')

            const otherValue = document.getElementById("other").value
            const accountValue = document.getElementById("account").value

            if(montoTotal === 0){
                return alert("Ingresar montos")
            } else if(otherValue === "" || accountValue === ""){
                return alert("Seleccionar cajas")
            } else if(gasto.trim() === ""){
                return alert("Ingresar el nombre del gasto")
            }

            const other = JSON.parse(otherValue)
            const account = JSON.parse(accountValue)


            // movname
            await axios.post('http://localhost:3001/movname', {
                ingreso: other.categories, 
                egreso: account.categories, 
                operacion: gasto, 
                monto: montoTotal,
                userId
            })
                .then(response => {
                    const movNameId = response.data.insertId
                    arrayMovements.push([other.idmovcategories, montoTotal, movNameId])
                    //libro
                    if(cajaId === account.idmovcategories) {
                        if (valueUsd !== 0){
                            arrayMovements.push([usdId, -valueUsd, movNameId])
                        }
                        if (valueTrans !== 0){
                            arrayMovements.push([bancoId, -valueTrans, movNameId])
                        }
                        if (valuePesos !== 0){
                            arrayMovements.push([pesosId, -valuePesos, movNameId])
                        }
                        if (valueMp !== 0){
                            arrayMovements.push([mpId, -valueMp, movNameId])
                        }
                    } else {
                        arrayMovements.push([account.idmovcategories, -montoTotal, movNameId])
                    }
                })
                .catch(error => {
                    console.error(error);
                });

            await axios.post('http://localhost:3001/movements', {
                arrayInsert: arrayMovements
            })
                .then(response => {
                    console.log(response)
                    if (response.status === 200){ 
                        alert("Pago agregado")
                        navigate('/movements');
                    } 
                })
                .catch(error => {
                    console.error(error);
                });
        } catch (error) {
            alert(error.response.data);
        }
    }

    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className='bg-white my-2 py-8 px-2 max-w-4xl mx-auto'>
                <h1 className="text-center text-5xl">Pagos varios</h1>
                {/* Sucursal */}
                <div className="p-4 max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="mb-4">
                        <div className="mb-2">
                            <div className='flex items-end bg-blue-100 mb-1 p-2'>
                                <div className='w-full'>
                                    <label className="block text-gray-700 font-bold mb-2">Quien: *</label>
                                    <select name="account" id="account" defaultValue={""} className='w-full shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline' >
                                        <option value="" disabled >Quien</option>
                                        {payCategories.map((category) => (
                                            <option key={category.idmovcategories} value={JSON.stringify(category)}>{category.categories}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className='w-full'>
                                    <label className="block text-gray-700 font-bold mb-2">Categorias: *</label>
                                    <select name="other" id="other" defaultValue={""} className='w-full shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline' >
                                        <option value="" disabled>Categoria</option>
                                        {otherCategories.map((category) => (
                                            <option key={category.idmovcategories} value={JSON.stringify(category)}>{category.categories}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className='w-full'>
                                    <label className="block text-gray-700 font-bold mb-2">Gasto: *</label>
                                    <input 
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text"
                                        id="gasto" 
                                        name='gasto'
                                        defaultValue=""
                                    />
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
                                                min="0"
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
                                                min="0"
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
                                                min="0"
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
                                                min="0"
                                                defaultValue="0"
                                                id="clienteMercadopago" 
                                                name='clienteMercadopago'
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

export default MovesOthers