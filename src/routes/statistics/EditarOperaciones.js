import React, {useState, useEffect} from 'react'
import axios from 'axios'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'
import { useLocation } from 'react-router-dom';

function EditarOperaciones() {
    const [selectMovname, setSelectMovname] = useState([])

    const [cuentasCategories, setCuentasCategories] = useState([])

    const [isNotLoading, setIsNotLoading] = useState(true);
    
    const [dolar, setDolar] = useState(800)
    
    const location = useLocation();
    const movnameId = parseInt(location.pathname.split("/")[2]);
    const branchId = JSON.parse(localStorage.getItem("branchId"))

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/movname/${branchId}`)
                .then(response => {
                    const allMovNames = response.data
                    const filteredMovname = allMovNames.filter((item) => item.idmovname === movnameId)[0]
                    setSelectMovname(filteredMovname)
                })
                .catch(error => {
                    console.error(error)
                })

            const cuentasResponse = await axios.get(`${SERVER}/movcategories`)
            const cuentas = cuentasResponse.data
            .filter((cuenta) => cuenta.tipo.includes("Cuentas"))
            .filter((cuenta) => cuenta.branch_id === branchId || cuenta.branch_id === null)

            setCuentasCategories(cuentas)

            const movementsResponse = await axios.get(`${SERVER}/movements/${branchId}`)
            const allMovements = movementsResponse.data
            const filteredMovements = allMovements.filter((item) => item.movname_id === movnameId)

            filteredMovements.forEach(element => {
                if (document.getElementById(element.categories) !== null) {
                    document.getElementById(element.categories).value = parseFloat(element.unidades)
                }
            });

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

    async function handleSubmit(event) {
        event.preventDefault();
        if (isNotLoading) {
            try {        
                const arrayMovements = []

                let montoTotal = 0
                cuentasCategories.forEach((cuenta) => {
                    const value = parseInt(document.getElementById(cuenta.categories).value) || 0
                    if (value !== 0) {
                        arrayMovements.push([cuenta.idmovcategories, value, movnameId, branchId])
                    }
                    if (cuenta.es_dolar === 1) {
                        montoTotal += (value * dolar)
                    } else {
                        montoTotal += value
                    }
                })
                if (montoTotal === 0) {
                    setIsNotLoading(true)
                    return alert("Insertar valores")
                }

                const responseMovements = await axios.put(`${SERVER}/movements/${movnameId}`, {
                    arrayInsert: arrayMovements,
                    montoTotal,                    
                })
                if (responseMovements.status === 200) {
                    setIsNotLoading(true)
                    alert("Valores actualizados")
                    window.location.reload();
                }
            } catch (error) {
                setIsNotLoading(true)
                alert(error.response.data)
            }   
        }  
    }

    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className="bg-white my-2 py-4 max-w-7xl mx-auto">
              <div className='text-center'>
                <h1 className="text-5xl font-bold mb-6">Editar operacion</h1>
                {/* Tabla con informacion que se esta cambiando */}
                <table className="mt-4 w-full">
                    <thead>
                        <tr>
                        <th className="px-4 py-2 border border-black">Id</th>
                        <th className="px-4 py-2 border border-black">Operacion</th>
                        <th className="px-4 py-2 border border-black">Monto</th>
                        <th className="px-4 py-2 border border-black">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className='text-center'>
                        <tr className="hover:bg-gray-100 border border-black">
                            <td className="px-4 py-2">{selectMovname.idmovname}</td>
                            <td className="px-4 py-2">{selectMovname.operacion}</td>
                            <td className="px-4 py-2">{selectMovname.monto}</td>
                            <td className="px-4 py-2">{selectMovname.fecha}</td>
                        </tr>
                    </tbody>
                </table>    
                {/* Agregar gasto y quien puso la mosca */}
                <form onSubmit={handleSubmit}>
                    {/* Valores de la Caja */}
                    <div className='w-full text-center'>
                        <label className="block text-gray-700 font-bold my-2 border-b-2">Caja</label>
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
                    {/* Boton para enviar */}
                    <button type='submit' className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded">
                        Actualizar
                    </button>
                </form>
              </div>
            </div>
        </div>
    );
}

export default EditarOperaciones