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

    const branchId = JSON.parse(localStorage.getItem("branchId"))

    const navigate = useNavigate();
    const location = useLocation();
    const movnameId = parseInt(location.pathname.split("/")[2]);

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/movname/${branchId}`)
                .then(response => {
                    const allMovNames = response.data
                    console.log(response.data)
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
                    console.log(response.data)
                    setAllMovements(allMovements)
                    const filteredMovements = allMovements.filter((item) => item.movname_id === movnameId)
                    setSelectMovements(filteredMovements)
                    filteredMovements.forEach(element => {
                        if (document.getElementById(element.categories).value) {
                            document.getElementById(element.categories).value = parseFloat(element.unidades)
                        }
                    });
                })
                .catch(error => {
                    console.error(error)
                })
        }
        fetchStates()
    // eslint-disable-next-line
    }, []);

    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className="bg-white my-2 px-2 max-w-7xl mx-auto">
              <div className='text-center'>
                <h1 className="text-5xl font-bold pt-6 mb-6">Editar operacion</h1>
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
                <div className=''>
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
                </div>
              </div>
            </div>
        </div>
    );
}

export default EditarOperaciones