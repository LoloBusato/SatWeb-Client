import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from './MainNavBar';
import SERVER from '../server'

function Home() {
    const [listOrders, setListOrders] = useState([])

    const navigate = useNavigate();
    const grupoId = JSON.parse(localStorage.getItem("grupoId"))
    const username = JSON.stringify(localStorage.getItem("username"))

    const permisos = JSON.stringify(localStorage.getItem("permisos"))

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/orders`)
                .then(response => {
                    const orders = []
                    for (let i = 0; i < response.data.length; i++) {
                        let orderIdUser = response.data[i].idusers
                        if (orderIdUser === grupoId){
                            orders.push(response.data[i])
                        }
                    }
                    setListOrders(orders)
                })
                .catch(error => {
                    console.error(error)
                })
        }
        fetchStates()
        // eslint-disable-next-line
    }, []);

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
  
    // Función para realizar la paginación de los datos
    const paginateData = () => {
      const startIndex = (currentPage - 1) * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      return listOrders.slice(startIndex, endIndex);
    };
  
    // Controlador de evento para avanzar a la siguiente página
    const nextPage = () => {
      if (currentPage < Math.ceil(listOrders.length / rowsPerPage)) {
        setCurrentPage(currentPage + 1);
      }
    };
  
    // Controlador de evento para retroceder a la página anterior
    const prevPage = () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    };
  
    // Obtener las filas correspondientes a la página actual
    const paginatedRows = paginateData();

    const countByCategory = (array, category) => {
        return array.reduce((count, item) => {
          if (item.color === category) {
            return count + 1;
          }
          return count;
        }, 0);
    };
  
    return (
        <div className='bg-gray-300 min-h-screen'>
            <MainNavBar />
            <div className='mt-2 w-full border border-black-700 shadow-lg md:w-5/6 mx-auto bg-white px-4 py-10'>
                <div className='grid grid-cols-5 gap-32 mb-5 justify-between items-center text-center'>
                    <div className='text-center py-2'>
                        <h1 className='text-4xl'>{username}</h1>
                    </div>
                    <div className='border shadow-md py-2'>
                        <h1 className='text-5xl'>{listOrders.length}</h1>
                    </div>
                    <div className='border shadow-md py-2 bg-red-500'>
                        <h1 className='text-4xl'>{countByCategory(listOrders, "rojo")}</h1>
                    </div>
                    <div className='border shadow-md py-2 bg-green-500'>
                        <h1 className='text-4xl'>{countByCategory(listOrders, "verde")}</h1>
                    </div>
                    <div className='border shadow-md py-2 bg-blue-500'>
                        <h1 className='text-4xl'>{countByCategory(listOrders, "azul")}</h1>
                    </div>
                </div>
                <div className="flex justify-between">
                    <h1 className="text-lg font-bold">Reparaciones en taller</h1>
                    {permisos.includes("ManipularOrdenes") && (
                        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                            onClick={() => { navigate(`/orders`) }} >
                            Agregar orden
                        </button>
                    )}
                </div>
                <div className="flex flex-col justify-center">
                    <table className="table-fixed">
                        <thead>
                            <tr className='bg-lime-400'>
                                <th className="px-4 py-1 w-16 ">#</th>
                                <th className="px-4 py-1 w-44 ">Cliente</th>
                                <th className="px-4 py-1 ">Modelo</th>
                                <th className="px-4 py-1 w-4/12 ">Problema</th>
                                <th className="px-2 py-1 w-32 ">Estado</th>
                                <th className="px-2 py-1 w-32 ">Antigüedad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRows.map(function(order){
                                const fecha1 = new Date();
                                const fecha2String = order.created_at;
                                const partesFecha2 = fecha2String.split('/');
                                const fecha2 = new Date(
                                  2000 + parseInt(partesFecha2[2], 10), // Asumiendo que los años están en formato yy
                                  parseInt(partesFecha2[1], 10) - 1, // Restar 1 al mes ya que en Date los meses van de 0 a 11
                                  parseInt(partesFecha2[0], 10)
                                );
                                
                                // Calcular la diferencia en meses y días
                                const tiempoEnMilisegundos = fecha1 - fecha2;
                                
                                const meses = Math.floor(tiempoEnMilisegundos / (1000 * 60 * 60 * 24 * 30));
                                const dias = Math.ceil((tiempoEnMilisegundos % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));

                                const diferencia = meses > 0 ? `${meses} meses y ${dias} días.`: `${dias} días.`;

                                return (
                                <tr key={order.order_id} className='text-sm cursor-pointer' onClick={() => { navigate(`/messages/${order.order_id}`) }} >
                                    <td className="border px-2 py-2 text-center">{order.order_id}</td>
                                    <td className="border px-2 py-2">{order.name} {order.surname}</td>
                                    <td className="border px-2 overflow-hidden">{order.brand} {order.type} {order.model} {order.device_color} - SN: {order.serial}</td>
                                    <td className="border px-2 py-2">{order.problem}</td>
                                    <td className={`text-center border py-2 ${order.color.toLowerCase() === 'rojo' ? "bg-red-400" : ""} ${order.color.toLowerCase() === 'azul' ? "bg-blue-400" : ""} ${order.color.toLowerCase() === 'verde' ? "bg-green-400" : ""}`}>{order.state}</td>
                                    <td className="border px-2 py-2 text-center">{diferencia}</td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                    <div className='flex bg-blue-300 justify-between py-1 px-1'>
                        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                            onClick={prevPage} >
                            Prev
                        </button>
                        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                            onClick={nextPage} >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home