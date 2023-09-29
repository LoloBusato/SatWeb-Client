import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'
import Select from 'react-select';

function DevolverDinero() {
    const [payCategories, setPayCategories] = useState([])
    const [cuentasCategories, setCuentasCategories] = useState([])

    const [cajaId, setCajaId] = useState(0)
    const [garantiaId, setGarantiaId] = useState(0)

    const [account, setAccount] = useState({})
    const [orderId, setOrderId] = useState([])

    const [dolar, setDolar] = useState(500)

    const [listaCobros, setListaCobros] = useState([])
    const [categories, setCategories] = useState([])

    
    const navigate = useNavigate();
    const branchId = JSON.parse(localStorage.getItem("branchId"))                
    const userId = JSON.parse(localStorage.getItem("userId"))
    const location = useLocation();
    const movnameId = parseInt(location.pathname.split("/")[2]);


    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/cobros/movname/${movnameId}`)
                .then(response => {
                    const valoresCobro = response.data[0]
                    const categoriasUnicas = Array.from(
                        new Set(
                            response.data.reduce((categorias, fila) => {
                            return categorias.concat(Object.keys(fila.categoriasUnidades));
                          }, [])
                        )
                    );
                    setCategories(categoriasUnicas)
                    setListaCobros(response.data)
                    setOrderId(valoresCobro.order_id)
                })
                .catch(error => {
                    console.error(error)
                })

            await axios.get(`${SERVER}/movcategories`)
                .then(response => {
                    const tempCategories = {
                        branch: [],
                        pay: [],
                        };
            
                        response.data.forEach((category) => {
                            if (category.tipo.includes("Sucursal")) {
                                tempCategories.branch.push(category);
                            }
                            if (category.tipo.includes("Pagar")) {
                                tempCategories.pay.push(category);
                            }
                            if (category.categories === "Caja") {
                                setCajaId(category.idmovcategories)
                            } else if (category.categories === "Garantia") {
                                setGarantiaId(category.idmovcategories)
                            }
                        });
                        const cuentas = response.data
                        .filter((cuenta) => cuenta.tipo.includes("Cuentas"))
                        .filter((cuenta) => cuenta.branch_id === branchId || cuenta.branch_id === null)
            
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
                const fechaHoraBuenosAires = new Date().toLocaleString("en-IN", {timeZone: "America/Argentina/Buenos_Aires", hour12: false}).replace(',', '');
                
                const arrayMovements = []

                let montoTotal = 0
                cuentasCategories.forEach((cuenta) => {
                    const value = parseInt(document.getElementById(cuenta.categories).value) || 0
                    if(cajaId === account.value.idmovcategories) {
                        if (value !== 0) {
                            arrayMovements.push([cuenta.idmovcategories, -value])
                        }
                    }
                    if (cuenta.es_dolar === 1) {
                        montoTotal += (value * dolar)
                    } else {
                        montoTotal += value
                    }
                })
                if(montoTotal === 0){
                    setIsNotLoading(true)
                    return alert("Ingresar montos")
                }
        
                arrayMovements.push([garantiaId, montoTotal])
                if(cajaId !== account.value.idmovcategories) {
                    arrayMovements.push([account.value.idmovcategories, -((montoTotal / dolar).toFixed(2))])
                }

                const valuesMovname = {
                    ingreso: "Garantia", 
                    egreso: account.value.categories, 
                    operacion: `Devolucion dinero Order #${orderId}`, 
                    monto: montoTotal,
                    userId,
                    branch_id: branchId,
                    fecha: fechaHoraBuenosAires,
                    order_id: orderId,
                    arrayMovements,
                    movnameId,
                }

                await axios.post(`${SERVER}/cobros/devolverDinero`, valuesMovname)
                    .then(response => {
                        if (response.status === 200){ 
                            setIsNotLoading(true)
                            alert("Dinero devuelto")
                            navigate(`/messages/${orderId}`);
                        } 
                    })
                    .catch(error => {
                        setIsNotLoading(true)
                        console.error(error);
                    });
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
                                            {categories.map((categorie) => (
                                            <th key={categorie} className="px-4 py-2 border border-black">{categorie}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className='text-center'>
                                        {listaCobros.map((cobro) => (
                                            <tr key={cobro.idcobros}>
                                                {categories.map((categorie) => (
                                                <td key={categorie} className="border px-4 py-2 text-center border-black">
                                                    {cobro.categoriasUnidades[categorie]}
                                                </td>
                                                ))}
                                            </tr>
                                        ))}
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