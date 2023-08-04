import React, {useState, useEffect} from 'react'
import axios from 'axios'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'
import { useLocation, useNavigate } from 'react-router-dom';

function EditarOperaciones() {

    const [allMovements, setAllMovements] = useState([])
    const [allMovname, setAllMovname] = useState([])

    const [selectMovements, setSelectMovements] = useState([]);
    const [selectMovname, setSelectMovname] = useState([])

    const [payCategories, setPayCategories] = useState([])
    const [encargadoId, setEncargadoId] = useState(0)
    const [pesosId, setPesosId] = useState(0)
    const [usdId, setUsdId] = useState(0)
    const [mpId, setMercadoPagoId] = useState(0)
    const [bancoId, setBancoId] = useState(0)

    const branchId = JSON.parse(localStorage.getItem("branchId"))

    const location = useLocation();
    const movnameId = parseInt(location.pathname.split("/")[2]);

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/movname/${branchId}`)
                .then(response => {
                    const allMovNames = response.data
                    setAllMovname(allMovNames)
                    const filteredMovname = allMovNames.filter((item) => item.idmovname === movnameId)[0]
                    setSelectMovname(filteredMovname)
                })
                .catch(error => {
                    console.error(error)
                })
                
            await axios.get(`${SERVER}/movements/${branchId}`)
                .then(response => {
                    const allMovements = response.data
                    setAllMovements(allMovements)
                    const filteredMovements = allMovements.filter((item) => item.movname_id === movnameId)
                    setSelectMovements(filteredMovements)
                    filteredMovements.forEach(element => {
                        if (document.getElementById(element.categories) !== null) {
                            document.getElementById(element.categories).value = parseFloat(element.unidades)
                        }
                    });
                })
                .catch(error => {
                    console.error(error)
                })

                await axios.get(`${SERVER}/movcategories`)
                    .then(response => {
                        setPayCategories(response.data.filter((item) => item.tipo.includes("Pagar")))
                        for (let i = 0; i < response.data.length; i++) {
                            if(response.data[i].categories === "Encargado") {
                                setEncargadoId(response.data[i].idmovcategories)
                            } else if(response.data[i].categories === "Pesos") {
                                setPesosId(response.data[i].idmovcategories)
                            } else if(response.data[i].categories === "Dolares") {
                                setUsdId(response.data[i].idmovcategories)
                            } else if(response.data[i].categories === "MercadoPago") {
                                setMercadoPagoId(response.data[i].idmovcategories)
                            } else if(response.data[i].categories === "Banco") {
                                setBancoId(response.data[i].idmovcategories)
                            } 
                        }
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
            try {        
                const formData = new FormData(event.target);

                const pesos = parseFloat(formData.get('Pesos')) || 0
                const usd = parseFloat(formData.get('USD')) || 0
                const banco = parseFloat(formData.get('Banco')) || 0
                const mp = parseFloat(formData.get('MercadoPago')) || 0
                const encargado = parseFloat(formData.get('Encargado')) || 0

                if (pesos === 0 && usd === 0 && banco === 0 && mp === 0 && encargado === 0) {
                    setIsNotLoading(true)
                    return alert("Insertar valores")
                }

                //libro
                const arrayMovements = []

                if (usd !== 0){
                    arrayMovements.push([usdId, usd, movnameId, branchId])
                }
                if (pesos !== 0){
                    arrayMovements.push([bancoId, banco, movnameId, branchId])
                }
                if (banco !== 0){
                    arrayMovements.push([pesosId, pesos, movnameId,branchId])
                }
                if (mp !== 0){
                    arrayMovements.push([mpId, mp, movnameId, branchId])
                }
                if (encargado !== 0){
                    arrayMovements.push([encargadoId, encargado, movnameId, branchId])
                }

                // Movements
                const responseMovements = await axios.put(`${SERVER}/movements/${movnameId}`, {
                    arrayInsert: arrayMovements
                })
                if (responseMovements.status === 200) {
                    setIsNotLoading(true)
                    alert("Valores actualizados")
                    window.location.reload();
                }

            } catch (error) {
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
                        <th className="px-4 py-2 border border-black">Usuario</th>
                        <th className="px-4 py-2 border border-black">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className='text-center'>
                        <tr className="hover:bg-gray-100 border border-black">
                            <td className="px-4 py-2">{selectMovname.idmovname}</td>
                            <td className="px-4 py-2">{selectMovname.operacion}</td>
                            <td className="px-4 py-2">{selectMovname.monto}</td>
                            <td className="px-4 py-2">{selectMovname.username}</td>
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
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Pesos:</label>
                                <input 
                                    className="mb-2 text-center appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" 
                                    type="number" 
                                    id="Pesos" 
                                    name='Pesos'
                                    defaultValue={0}
                                />
                            </div>     
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="name">USD:</label>
                                <input 
                                    className="mb-2 text-center appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" 
                                    type="number" 
                                    id="USD" 
                                    name='USD'
                                    defaultValue={0}
                                />
                            </div>    
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Banco:</label>
                                <input 
                                    className="mb-2 text-center appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" 
                                    type="number" 
                                    id="Banco" 
                                    name='Banco'
                                    defaultValue={0}
                                />
                            </div>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="name">MercadoPago:</label>
                                <input 
                                    className="mb-2 text-center appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" 
                                    type="number" 
                                    id="MercadoPago" 
                                    name='MercadoPago'
                                    defaultValue={0}
                                />
                            </div>                                
                        </div>
                    </div>
                    {/* Valores de encargado */}
                    <div className='text-center w-full'>
                        <label className="block text-gray-700 font-bold my-2 border-b-2">Encargado</label>
                        <div className='flex'>
                            <div className='w-full'>
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="name">USD:</label>
                                <input 
                                    className="mb-2 text-center appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" 
                                    type="number" 
                                    id="Encargado" 
                                    name='Encargado'
                                    defaultValue={0}
                                />
                            </div>                       
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