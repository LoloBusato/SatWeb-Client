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

    const [precioTotalRepuestos, setPrecioTotalRepuestos] = useState(0)

    const [codigoSearch, setCodigoSearch] = useState("");
    const [repuestoSearch, setRepuestoSearch] = useState("");
    const [cantidadSearch, setCantidadSearch] = useState("");
    const [precioSearch, setPrecioSearch] = useState("");
    const [proveedorSearch, setProveedorSearch] = useState("");
    const [fechaSearch, setFechaSearch] = useState("");

    const [mostrarGruposDeRepuestos, setMostrarGruposDeRepuestos] = useState(true);
    const [mostrarTablaCheck, setMostrarTablaCheck] = useState(false);

    const navigate = useNavigate();

    const branchId = JSON.parse(localStorage.getItem("branchId"))
    const permisos = JSON.stringify(localStorage.getItem("permisos"))

    useEffect(() => {
        const fetchData = async () => {
            await axios.get(`${SERVER}/stock/${branchId}`)
              .then(response => {
                const repuestosSucursal = response.data
                setStock(repuestosSucursal);
                setsearchStock(repuestosSucursal)
                setAllStocks({
                    [branchId]: repuestosSucursal
                })
                // Calcular la suma total de los repuestos
                const valorRepuestos = repuestosSucursal.reduce((acum, valor) => {
                    return acum + (valor.cantidad_restante * parseFloat(valor.precio_compra))
                }, 0)
                setPrecioTotalRepuestos(valorRepuestos.toFixed(2))
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

    useEffect(() => {
        handleSearch()
        // eslint-disable-next-line
    }, [stock])

    const eliminarElemento = async (id) => {
        try {        
            await axios.delete(`${SERVER}/stock/${id}`)
            setsearchStock(stock.filter((item) => item.idstock !== id));
            setStock(stock.filter((item) => item.idstock !== id));
        } catch (error) {
            console.error(error)
        }
    }

    async function handleSearch (event) {
        if (event) {
            event.preventDefault();
        }
        const palabras = repuestoSearch.split(' ').filter(Boolean)
        setsearchStock(stock.filter((item) => 
            (item.idstock === parseInt(codigoSearch) || codigoSearch === "") &&
            palabras.every((palabra) => item.repuesto.toLowerCase().includes(palabra.toLowerCase()))&&
            item.cantidad.toString().toLowerCase().includes(cantidadSearch.toLowerCase()) &&
            item.precio_compra.toString().toLowerCase().includes(precioSearch.toLowerCase()) &&
            item.nombre.toLowerCase().includes(proveedorSearch.toLowerCase()) &&
            item.fecha_compra.includes(fechaSearch)
        ));
    };

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
            let arrNewStock = []
            if (id in allStocks){
                arrNewStock = allStocks[id]
                setMostrarTablaCheck(true)
            } else if (id === 'comprar') {
                const buyStock = groupedProducts.filter(item => {
                    return item.cantidad_restante <= item.cantidad_limite
                })
                arrNewStock = buyStock
                setMostrarTablaCheck(false)
            } else {
                await axios.get(`${SERVER}/stock/${id}`)
                  .then(response => {
                    setAllStocks(prev => ({
                        ...prev,
                        [id]: response.data
                    }))
                    arrNewStock = response.data
                    setMostrarTablaCheck(true)
                })
                  .catch(error => {
                    console.error(error);
                });
            }
            setCurrentBranch(id)
            
            setStock(arrNewStock)
            setsearchStock(arrNewStock)
            
            // Calcular la suma total de los repuestos
            const valorRepuestos = arrNewStock.reduce((acum, valor) => {
                return acum + (valor.cantidad_restante * parseFloat(valor.precio_compra))
            }, 0)
            setPrecioTotalRepuestos(valorRepuestos.toFixed(2))
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
            if (cantidadRestante > 0){
                repuestoExistente.cantidad_restante += cantidadRestante;
                repuestoExistente.array_elementos.push(diccionario)
            }
        } else {
            // Agregar un nuevo objeto al acumulador
            acumulador.push({
                repuesto: repuesto,
                cantidad_restante: cantidadRestante,
                cantidad_limite: cantidadLimite,
                repuesto_id: diccionario.repuesto_id,
                array_elementos: [diccionario]
            });
        }
      
        return acumulador;
    }, []);

    const [selectProduct, setSelectProduct] = useState([]);
    const [idSelectProduct, setIdSelectProduct] = useState(null);

    const obtenerProductos = (id) => {
        const producto = groupedProducts.filter((product) => product.repuesto_id === id);
        setSelectProduct(producto[0].array_elementos);
      };
  
    const handleRowClick = (id) => {
        if (idSelectProduct === id) {
            setIdSelectProduct(null);
            setSelectProduct([]);
        } else {
            obtenerProductos(id);
            setIdSelectProduct(id);
        }
    };

    const [selectCompra, setSelectCompra] = useState([]);
    const [idSelectCompra, setIdSelectCompra] = useState(null);
    const [diccionarioStockSucursal, setDiccionarioStockSucursal] = useState({})

    const obtenerCompra = async (id) => {
        if (id in diccionarioStockSucursal) {
            setSelectCompra(diccionarioStockSucursal[id])
        } else {
            await axios.get(`${SERVER}/stock/distribute/${id}`)
                  .then(response => {
                    setDiccionarioStockSucursal({...diccionarioStockSucursal, [id]: response.data})
                    diccionarioStockSucursal.id = response.data
                    setSelectCompra(response.data);
                })
                  .catch(error => {
                    console.error(error);
                });
        }
      };
  
    const handleCompraRowClick = (id) => {
        if (idSelectCompra === id) {
            setIdSelectCompra(null);
            setSelectCompra([]);
        } else {
            obtenerCompra(id);
            setIdSelectCompra(id);
        }
    };
    
  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <div className='bg-white m-2 py-8 px-2'>
            <div className='mb-6'>
                <div className="text-2xl font-bold text-center">Productos en Stock</div>
                <div className='text-center'>Total ${precioTotalRepuestos}</div>
            </div>
            {/* Buscador */}
            <div className="border border-gray-300">
                <form onSubmit={handleSearch} className="p-1 bg-blue-100">
                    <div className='grid grid-cols-1 sm:grid-cols-3 gap-y-1  justify-items-center'>
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
            {/* Seleccionador de sucursal */}
            {permisos.includes("Stock") && (
                <div>
                    <div className="flex justify-around py-1 bg-lime-400 border-b">
                        {branches.map(branch => (
                            <button 
                            className={`${branch.idbranches === currentBranch ? "bg-blue-600 border border-white" : "bg-blue-400"} px-4 py-2`}
                            onClick={() => handleBranchesStock(branch.idbranches)}>
                                {branch.branch}
                            </button>
                        ))}
                    </div>
                    <div className="flex justify-around py-1 bg-lime-400 border-b">
                        <button 
                            className={`${'comprar' === currentBranch ? "bg-blue-600 border border-white" : "bg-blue-400"} px-4 py-2`} 
                            onClick={() => handleBranchesStock('comprar')}>
                                Comprar
                        </button>
                        <button 
                            className={`bg-blue-400 px-4 py-2`} 
                            onClick={() => navigate(`/enviarstock`)}>
                                Enviar repuestos
                        </button>
                    </div>
                </div>
            )}
            {/* Tabla de repuestos agrupados */}
            <div>
                <div className="flex justify-center">
                    <button
                    className="bg-blue-500 border px-4 py-2 color"
                    onClick={() => setMostrarGruposDeRepuestos(!mostrarGruposDeRepuestos)}
                    >
                        Ocultar/Mostrar
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
                                    <>
                                    <tr key={item.repuesto_id} onClick={() => handleRowClick(item.repuesto_id)}>
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
                                    {idSelectProduct === item.repuesto_id && (
                                        <tr>
                                            <td></td>
                                            <td colSpan={2}>
                                                <table className="my-2 w-full border border-black bg-white">
                                                    <thead>
                                                        <tr>
                                                            <th className="px-4 py-2 border border-black">Codigo</th>
                                                            <th className="px-4 py-2 border border-black">Cantidad</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className='text-center'>
                                                    {selectProduct.map((product) => (
                                                        <tr key={product.idstock}>
                                                            <td className="px-4 py-2 border border-black">{product.idstock}</td>
                                                            <td className="px-4 py-2 border border-black">{product.cantidad_restante}</td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {/* Tabla con las compras de repuestos */}    
            <div className="flex justify-center">
                <button
                className="bg-blue-500 border px-4 py-2 color"
                onClick={() => setMostrarTablaCheck(!mostrarTablaCheck)}
                >
                    Ocultar/Mostrar
                </button>
            </div>
            {mostrarTablaCheck && (
                <div className="flex justify-center mb-10">
                    {/* Tabla para dispositivos de tamanio sm y mayor */}
                    <table className="table-auto hidden sm:block bg-gray-300">
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
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {searchStock.map(stock => (
                                <>
                                    <tr key={stock.idstock} onClick={() => handleCompraRowClick(stock.idstock)}>
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
                                            {permisos.includes("Administrador") && (
                                                <button className="bg-blue-500 border px-4 py-2 color"
                                                onClick={() => { navigate(`/editdistributestock/${stock.idstock}`) }} >
                                                    Editar cantidad
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
                                                <button className="bg-red-500 border px-4 py-2 color" 
                                                onClick={() => eliminarElemento(stock.idstock)}>
                                                    Eliminar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    {idSelectCompra === stock.idstock && (
                                        <tr className='bg-gray-300'>
                                            <td colSpan={2}></td>
                                            <td colSpan="3">
                                                <table className="my-2 w-full border border-black bg-white">
                                                    <thead>
                                                        <tr>
                                                            <th className="px-4 py-2 border border-black">Sucursal</th>
                                                            <th className="px-4 py-2 border border-black">Cantidad Inicial</th>
                                                            <th className="px-4 py-2 border border-black">Cantidad Restante</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className='text-center'>
                                                    {selectCompra.map((repuestoSucursal) => (
                                                        <tr key={repuestoSucursal.stockbranchid}>
                                                            <td className="px-4 py-2 border border-black">{repuestoSucursal.branch_id}</td>
                                                            <td className="px-4 py-2 border border-black">{repuestoSucursal.cantidad_branch}</td>
                                                            <td className="px-4 py-2 border border-black">{repuestoSucursal.cantidad_restante}</td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                    {/* Tabla colapsable para dispositivos pequeños */}
                    <div className="sm:hidden">
                        {searchStock.map(stock => (
                            <details key={stock.order_id} className="border mb-1 rounded">
                                <summary className="px-4 py-2 cursor-pointer outline-none">
                                    {stock.idstock} - {stock.repuesto} - {stock.cantidad} - ${stock.precio_compra}
                                </summary>
                                <div className=" bg-gray-100">
                                    <tr className='flex flex-col' key={stock.idstock} onClick={() => handleCompraRowClick(stock.idstock)}>
                                        {permisos.includes("Stock") && (
                                            <button className="bg-blue-500 border px-4 py-2 color"
                                            onClick={() => { navigate(`/printCode/${stock.idstock}`) }} >
                                                Print
                                            </button>
                                        )}
                                        <p className="border px-4 py-2 text-center" value={stock.nombre}>Proveedor: {stock.nombre}</p>
                                        <p className="border px-4 py-2 text-center" value={stock.fecha_compra}>Fecha: {stock.fecha_compra.slice(0, 10)}</p>
                                        {permisos.includes("Administrador") && (
                                            <button className="bg-blue-500 border px-4 py-2 color"
                                            onClick={() => { navigate(`/editdistributestock/${stock.idstock}`) }} >
                                                Editar cantidad
                                            </button>
                                        )}
                                        {permisos.includes("Stock") && (
                                            <button className="bg-blue-500 border px-4 py-2 color"
                                            onClick={() => { navigate(`/distributeStock/${stock.idstock}`) }} >
                                                Enviar
                                            </button>
                                        )}
                                        {permisos.includes("Stock") && (
                                            <button className="bg-green-500 border px-4 py-2 color"
                                            onClick={() => { navigate(`/updateStock/${stock.idstock}`) }} >
                                                Editar
                                            </button>
                                        )}
                                        {permisos.includes("Stock") && (
                                            <button className="bg-red-500 border px-4 py-2 color" 
                                            onClick={() => eliminarElemento(stock.idstock)}>
                                                Eliminar
                                            </button>
                                        )}
                                    </tr>
                                    {idSelectCompra === stock.idstock && (
                                        <tr className='bg-gray-300'>
                                            <td colSpan={2}></td>
                                            <td colSpan="3">
                                                <table className="my-2 w-full border border-black bg-white">
                                                    <thead>
                                                        <tr>
                                                            <th className="px-4 py-2 border border-black">Sucursal</th>
                                                            <th className="px-4 py-2 border border-black">Cantidad Inicial</th>
                                                            <th className="px-4 py-2 border border-black">Cantidad Restante</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className='text-center'>
                                                    {selectCompra.map((repuestoSucursal) => (
                                                        <tr key={repuestoSucursal.stockbranchid}>
                                                            <td className="px-4 py-2 border border-black">{repuestoSucursal.branch_id}</td>
                                                            <td className="px-4 py-2 border border-black">{repuestoSucursal.cantidad_branch}</td>
                                                            <td className="px-4 py-2 border border-black">{repuestoSucursal.cantidad_restante}</td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    )}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}

export default StockCount;