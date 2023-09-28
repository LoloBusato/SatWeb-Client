import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

function MovesOthers() {
    const [otherCategories, setOtherCategories] = useState([])
    const [payCategories, setPayCategories] = useState([])
    const [cuentasCategories, setCuentasCategories] = useState([])

    const [cajaId, setCajaId] = useState(0)

    const [dolar, setDolar] = useState(500)
    
    const navigate = useNavigate();
    const branchId = JSON.parse(localStorage.getItem("branchId"))
    const userId = JSON.parse(localStorage.getItem("userId"))

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/movcategories`)
                .then(response => {
                    const tempCategories = {
                        other: [],
                        pay: [],
                        };
            
                        response.data.forEach((category) => {
                            if (category.tipo.includes("Otros")) {
                                tempCategories.other.push(category);
                            }
                            if (category.tipo.includes("Pagar")) {
                                tempCategories.pay.push(category);
                            }
                            if (category.categories === "Caja") {
                                setCajaId(category.idmovcategories)
                            }
                        });
                        const cuentas = response.data
                        .filter((cuenta) => cuenta.tipo.includes("Cuentas"))
                        .filter((cuenta) => cuenta.branch_id === branchId || cuenta.branch_id === null)
            
                        setCuentasCategories(cuentas)
                        setOtherCategories(tempCategories.other);
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

                const otherValue = document.getElementById("other").value
                const other = JSON.parse(otherValue)
                const accountValue = document.getElementById("account").value
                const account = JSON.parse(accountValue)

                const arrayMovements = []

                const gasto = document.getElementById('gasto').value
                if(gasto.trim() === ""){
                    setIsNotLoading(true)
                    return alert("Ingresar el nombre del gasto")
                }

                let montoTotal = 0
                cuentasCategories.forEach((cuenta) => {
                    const value = parseInt(document.getElementById(cuenta.categories).value) || 0
                    if(cajaId === account.idmovcategories) {
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
    
                if (other.categories === 'PcKing' || other.categories === 'Encargado') {
                    arrayMovements.push([other.idmovcategories, (montoTotal / dolar)])
                } else {
                    arrayMovements.push([other.idmovcategories, montoTotal])
                }
                if(cajaId !== account.idmovcategories) {
                    arrayMovements.push([account.idmovcategories, -(montoTotal / dolar)])
                }    
    
                // movname
                await axios.post(`${SERVER}/movname`, {
                    ingreso: other.categories, 
                    egreso: account.categories, 
                    operacion: gasto, 
                    monto: montoTotal,
                    userId,
                    branch_id: branchId,
                    fecha: fechaHoraBuenosAires,
                    order_id: null,
                })
                    .then(response => {
                        const movNameId = response.data.insertId
                        for (let i = 0; i < arrayMovements.length; i++) {
                            arrayMovements[i].push(movNameId, branchId);
                        }               
                    })
                    .catch(error => {
                        console.error(error);
                    });
    
                await axios.post(`${SERVER}/movements`, {
                    arrayInsert: arrayMovements
                })
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
            } catch (error) {
                alert(error.response.data);
            }
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
                                    <select required name="account" id="account" defaultValue={""} className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline' >
                                        <option value="" disabled >Quien</option>
                                        {payCategories.map((category) => (
                                            <option key={category.idmovcategories} value={JSON.stringify(category)}>{category.categories}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className='w-full'>
                                    <label className="block text-gray-700 font-bold mb-2">Categorias: *</label>
                                    <select required name="other" id="other" defaultValue={""} className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline' >
                                        <option value="" disabled>Categoria</option>
                                        {otherCategories.map((category) => (
                                            <option key={category.idmovcategories} value={JSON.stringify(category)}>{category.categories}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className='w-full'>
                                    <label htmlFor='gasto' className="block text-gray-700 font-bold mb-2">Gasto: *</label>
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

export default MovesOthers