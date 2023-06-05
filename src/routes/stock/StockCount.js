import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

function StockCount() {
  const [stock, setStock] = useState([]);
  const [searchStock, setsearchStock] = useState([]);

  const [codigoSearch, setCodigoSearch] = useState("");
  const [repuestoSearch, setRepuestoSearch] = useState("");
  const [cantidadSearch, setCantidadSearch] = useState("");
  const [precioSearch, setPrecioSearch] = useState("");
  const [proveedorSearch, setProveedorSearch] = useState("");
  const [fechaSearch, setFechaSearch] = useState("");

  const navigate = useNavigate();
  
  async function handleSearch (event) {
    event.preventDefault();
    setsearchStock(stock.filter((item) => 
        item.idstock.toString().toLowerCase().includes(codigoSearch.toLowerCase()) &&
        item.repuesto.toLowerCase().includes(repuestoSearch.toLowerCase()) &&
        item.cantidad.toString().toLowerCase().includes(cantidadSearch.toLowerCase()) &&
        item.precio_compra.toString().toLowerCase().includes(precioSearch.toLowerCase()) &&
        item.nombre.toLowerCase().includes(proveedorSearch.toLowerCase()) &&
        item.fecha_compra.includes(fechaSearch)
    ));
  };

  useEffect(() => {
    const fetchData = async () => {
        
        await axios.get(`${SERVER}/stock`)
        .then(response => {
          setStock(response.data);
          setsearchStock(response.data)
        })
        .catch(error => {
          console.error(error);
          // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
        });
    }
    fetchData()

  }, []);

  const eliminarElemento = async (id) => {
    try {        
        await axios.delete(`${SERVER}/stock/${id}`)
        setsearchStock(stock.filter((item) => item.idstock !== id));
        setStock(stock.filter((item) => item.idstock !== id));
    } catch (error) {
        console.error(error)
    }
  }

  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <div className='bg-white m-2 py-8 px-2'>
            <h1 className="text-2xl font-bold text-center">Productos en Stock</h1>
            <div className="border my-6 border-gray-300">
                <form onSubmit={handleSearch} className="p-1 bg-blue-100">
                    <div className='grid grid-cols-3 gap-y-1  justify-items-center'>
                        <div>
                            <input
                                className="px-4 py-2 rounded-lg shadow-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                type="text"
                                placeholder="Buscar por Codigo"
                                value={codigoSearch}
                                onChange={(e) => setCodigoSearch(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                className="px-4 py-2 rounded-lg shadow-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                type="text"
                                placeholder="Buscar por repuesto"
                                value={repuestoSearch}
                                onChange={(e) => setRepuestoSearch(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                className="px-4 py-2 rounded-lg shadow-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                type="text"
                                placeholder="Buscar por cantidad"
                                value={cantidadSearch}
                                onChange={(e) => setCantidadSearch(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                className="px-4 py-2 rounded-lg shadow-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                type="text"
                                placeholder="Buscar por precio"
                                value={precioSearch}
                                onChange={(e) => setPrecioSearch(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                className="px-4 py-2 rounded-lg shadow-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                type="text"
                                placeholder="Buscar por proveedor"
                                value={proveedorSearch}
                                onChange={(e) => setProveedorSearch(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                className="px-4 py-2 rounded-lg shadow-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                type="text"
                                placeholder="Buscar por fecha (aaaa/mm/dd)"
                                value={fechaSearch}
                                onChange={(e) => setFechaSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className='flex justify-end'>
                        <button
                            type='submit'
                            className="px-4 py-2 text-white bg-indigo-500 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        >
                            Buscar
                        </button>
                    </div>
                </form>
            </div> 
            <div className="flex justify-center mb-10">
                <table className="table-auto bg-gray-300">
                    <thead>
                        <tr className='bg-lime-400'>
                            <th className="py-2 px-4"></th>
                            <th className="px-4 py-2">Cod</th>
                            <th className="px-4 py-2">Repuesto</th>
                            <th className="px-4 py-2">Cantidad</th>
                            <th className="px-4 py-2">Precio (USD)</th>
                            <th className="px-4 py-2">Proveedor</th>
                            <th className="px-4 py-2">Fecha (aaaa/mm/dd)</th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {searchStock.map(stock => (
                        <tr key={stock.idstock}>
                            <td className='flex justify-center'>
                                <button className="bg-blue-500 border px-4 py-2 color"
                                onClick={() => { navigate(`/printCode/${stock.idstock + stock.repuesto.split(" ")[0].slice(0,2) + stock.repuesto.split(" ")[1].slice(0,1) + stock.repuesto.split(" ")[3] + stock.repuesto.split(" ")[4].slice(0,1) + stock.fecha_compra.slice(0, 10).split("-")[0].slice(2,4) + stock.fecha_compra.slice(0, 10).split("-")[1] + stock.fecha_compra.slice(0, 10).split("-")[2]}`) }} >
                                    Print
                                </button>
                            </td>
                            <td className="border px-4 py-2" values={stock.idstock}>
                                {stock.idstock + stock.repuesto.split(" ")[0].slice(0,2) + stock.repuesto.split(" ")[1].slice(0,1) + stock.repuesto.split(" ")[3] + stock.repuesto.split(" ")[4].slice(0,1) + stock.fecha_compra.slice(0, 10).split("-")[0].slice(2,4) + stock.fecha_compra.slice(0, 10).split("-")[1] + stock.fecha_compra.slice(0, 10).split("-")[2]} 
                            </td>
                            <td className="border px-4 py-2" value={stock.repuesto}>{stock.repuesto}</td>
                            <td className={`${stock.cantidad <= stock.cantidadLimite ? "bg-red-600" : ""} border px-4 py-2 text-center`} value={stock.cantidad}>{stock.cantidad}</td>
                            <td className="border px-4 py-2 text-center" value={stock.precio_compra}>{stock.precio_compra}</td>
                            <td className="border px-4 py-2" value={stock.nombre}>{stock.nombre}</td>
                            <td className="border px-4 py-2 text-center" value={stock.fecha_compra}>{stock.fecha_compra.slice(0, 10)}</td>
                            <td>
                                <button className="bg-red-500 border px-4 py-2 color" onClick={() => eliminarElemento(stock.idstock)}>Eliminar</button>
                            </td>
                            <td>
                                <button className="bg-green-500 border px-4 py-2 color"
                                onClick={() => { navigate(`/updateStock/${stock.idstock}`) }} >
                                    Editar
                                </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}

export default StockCount;