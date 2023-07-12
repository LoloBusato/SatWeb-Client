import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

function StockCount() {
    const [stock, setStock] = useState([]);
    const [ordenPrecioCompra, setOrdenPrecioCompra] = useState(null);
    const [searchStock, setsearchStock] = useState([]);
    const [branches, setBranches] = useState([]);

    const [codigoSearch, setCodigoSearch] = useState("");
    const [repuestoSearch, setRepuestoSearch] = useState("");
    const [cantidadSearch, setCantidadSearch] = useState("");
    const [precioSearch, setPrecioSearch] = useState("");
    const [proveedorSearch, setProveedorSearch] = useState("");
    const [fechaSearch, setFechaSearch] = useState("");

    const [mostrarGruposDeRepuestos, setMostrarGruposDeRepuestos] = useState(true);
    const [mostrarTablaCheck, setMostrarTablaCheck] = useState(true);

    const navigate = useNavigate();

    const branchId = JSON.parse(localStorage.getItem("branchId"))
    const permisos = JSON.stringify(localStorage.getItem("permisos"))

    async function handleSearch (event) {
        event.preventDefault();
        setsearchStock(stock.filter((item) => 
            (item.idstock === parseInt(codigoSearch) || codigoSearch === "") &&
            item.repuesto.toLowerCase().includes(repuestoSearch.toLowerCase()) &&
            item.cantidad.toString().toLowerCase().includes(cantidadSearch.toLowerCase()) &&
            item.precio_compra.toString().toLowerCase().includes(precioSearch.toLowerCase()) &&
            item.nombre.toLowerCase().includes(proveedorSearch.toLowerCase()) &&
            item.fecha_compra.includes(fechaSearch)
        ));
    };

    useEffect(() => {
        const fetchData = async () => {
            await axios.get(`${SERVER}/stock/${branchId}`)
              .then(response => {
                setStock(response.data);
                setsearchStock(response.data)
                setAllStocks({
                    [branchId]: response.data
                })
            })
              .catch(error => {
                console.error(error);
            });
            await axios.get(`${SERVER}/branches`)
                .then(response => {
                    setBranches(response.data);
                })
                .catch(error => {
                    console.error(error);
                });
        }
        fetchData()
        // eslint-disable-next-line
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

    const handleOrdenarPorPrecioCompra = () => {
        if (ordenPrecioCompra === 'asc') {
          setsearchStock([...searchStock.sort((a, b) => a.precio_compra - b.precio_compra)]);
          setOrdenPrecioCompra('desc');
        } else {
          setsearchStock([...searchStock.sort((a, b) => b.precio_compra - a.precio_compra)]);
          setOrdenPrecioCompra('asc');
        }
      };
    
    const [currentBranch, setCurrentBranch] = useState(branchId);
    const [allStocks, setAllStocks] = useState({})
    async function handleBranchesStock(id) {
        if (currentBranch !== id){
            if (id in allStocks){
                setStock(allStocks[id]);
                setsearchStock(allStocks[id])
                setMostrarTablaCheck(true)
            } else if (id === 'comprar') {
                const buyStock = groupedProducts.filter(item => {
                    return item.cantidad_restante <= item.cantidad_limite
                })
                setMostrarTablaCheck(false)
                setStock(buyStock);
                setsearchStock(buyStock)
            } else {
                await axios.get(`${SERVER}/stock/${id}`)
                  .then(response => {
                    setAllStocks(prev => ({
                        ...prev,
                        [id]: response.data
                    }))
                    setStock(response.data);
                    setsearchStock(response.data)   
                    setMostrarTablaCheck(true)
                })
                  .catch(error => {
                    console.error(error);
                });
            }
            setCurrentBranch(id)
        }
    }

    const groupedProducts = searchStock.reduce((acumulador, diccionario) => {
        const repuesto = diccionario.repuesto;
        const cantidadRestante = diccionario.cantidad_restante;
        const cantidadLimite = diccionario.cantidad_limite;
      
        // Verificar si el repuesto ya está en el acumulador
        const repuestoExistente = acumulador.find(item => item.repuesto === repuesto);
        if (repuestoExistente) {
            // Sumar los valores de cantidad_restante y cantidad_limite al repuesto existente
            repuestoExistente.cantidad_restante += cantidadRestante;
        } else {
            // Agregar un nuevo objeto al acumulador
            acumulador.push({
                repuesto: repuesto,
                cantidad_restante: cantidadRestante,
                cantidad_limite: cantidadLimite,
                repuesto_id: diccionario.repuesto_id
            });
        }
      
        return acumulador;
    }, []);
  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <div className='bg-white m-2 py-8 px-2'>
            <h1 className="text-2xl mb-6 font-bold text-center">Productos en Stock</h1>
            {/* Buscador */}
            {mostrarTablaCheck && (
                <div className="border border-gray-300">
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
                                    className="px-9 text-gray-400 py-2 rounded-lg shadow-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                    type="date"
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
            )}
            {/* Seleccionador de sucursal */}
            {permisos.includes("Stock") && (
                <div className="flex justify-around py-1 bg-lime-400 border-b">
                    {branches.map(branch => (
                        <button 
                        className='bg-blue-400 px-4 py-2'
                        onClick={() => handleBranchesStock(branch.idbranches)}>
                            {branch.branch}
                        </button>
                    ))}
                    <button 
                        className='bg-blue-400 px-4 py-2'
                        onClick={() => handleBranchesStock('comprar')}>
                            Comprar
                    </button>
                </div>
            )}
            {/* Tabla de repuestos agrupados */}
            <div>
                <div className="flex justify-center">
                    <button
                    className="bg-blue-500 border px-4 py-2 color"
                    onClick={() => setMostrarGruposDeRepuestos(!mostrarGruposDeRepuestos)}
                    >
                        Ocultar/Mostar Tabla
                    </button>
                </div>
                {mostrarGruposDeRepuestos && (
                    <div className="flex justify-center mb-10">
                        <table className="table-auto bg-gray-300">
                            <thead>
                                <tr className='bg-lime-400'>
                                    <th className="py-2 px-4">Repuesto</th>
                                    <th className="py-2 px-4">Cantidad</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupedProducts.map((item) => (
                                    <tr key={item.repuesto}>
                                        <td className="border px-4 py-2">{item.repuesto}</td>
                                        <td className={`${item.cantidad_restante <= item.cantidad_limite ? "bg-red-600" : ""} border px-4 py-2 text-center`}>{item.cantidad_restante}</td>
                                        <td>
                                            {permisos.includes("Stock") && (
                                                <button className="bg-green-500 border px-4 py-2 color" 
                                                onClick={() => navigate(`/updateItem/${item.repuesto_id}`)}>
                                                    Editar cantidad limite
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {/* Tabla con las compras de repuestos */}
            {mostrarTablaCheck && (
                <div className="flex justify-center mb-10">
                    <table className="table-auto bg-gray-300">
                        <thead>
                            <tr className='bg-lime-400'>
                                <th className="py-2 px-4"></th>
                                <th className="px-4 py-2">Cod</th>
                                <th className="px-4 py-2">Repuesto</th>
                                <th className="px-4 py-2">Cantidad</th>
                                <th className="px-4 py-2" onClick={handleOrdenarPorPrecioCompra}>Precio (USD)</th>
                                <th className="px-4 py-2">Proveedor</th>
                                <th className="px-4 py-2">Fecha</th>
                                <th></th>
                                <th></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {searchStock.map(stock => (
                            <tr key={stock.idstock}>
                                <td className='flex justify-center'>
                                    {permisos.includes("Stock") && (
                                        <button className="bg-blue-500 border px-4 py-2 color"
                                        onClick={() => { navigate(`/printCode/${stock.idstock}`) }} >
                                            Print
                                        </button>
                                    )}
                                </td>
                                <td className="border px-4 py-2" values={stock.idstock}>
                                    {stock.idstock} 
                                </td>
                                <td className="border px-4 py-2" value={stock.repuesto}>{stock.repuesto}</td>
                                <td className={`${stock.cantidad <= stock.cantidad_limite ? "bg-red-600" : ""} border px-4 py-2 text-center`} value={stock.cantidad}>{stock.cantidad}</td>
                                <td className="border px-4 py-2 text-center" value={stock.precio_compra}>{stock.precio_compra}</td>
                                <td className="border px-4 py-2" value={stock.nombre}>{stock.nombre}</td>
                                <td className="border px-4 py-2 text-center" value={stock.fecha_compra}>{stock.fecha_compra.slice(0, 10)}</td>
                                <td>
                                    {permisos.includes("Stock") && (
                                        <button className="bg-red-500 border px-4 py-2 color" 
                                        onClick={() => eliminarElemento(stock.idstock)}>
                                            Eliminar
                                        </button>
                                    )}
                                </td>
                                <td>
                                    {permisos.includes("Stock") && (
                                        <button className="bg-green-500 border px-4 py-2 color"
                                        onClick={() => { navigate(`/updateStock/${stock.idstock}`) }} >
                                            Editar
                                        </button>
                                    )}
                                </td>
                                <td>
                                    {permisos.includes("Stock") && (
                                        <button className="bg-blue-500 border px-4 py-2 color"
                                        onClick={() => { navigate(`/distributeStock/${stock.idstock}`) }} >
                                            Enviar
                                        </button>
                                    )}
                                </td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    </div>
  );
}

export default StockCount;