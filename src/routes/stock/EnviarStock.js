import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select'
import { useNavigate } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

function EnviarStock() {
    const [stock, setStock] = useState([]);
    const [branches, setBranches] = useState([]);
    const [repuestoSeleccionado, setRepuestoSeleccionado] = useState(null)
    const [sucursalDesde, setSucursalDesde] = useState(null)
    const [sucursalHacia, setSucursalHacia] = useState(null)
    const [tableData, setTableData] = useState([]);
    const [cantidadEnviar, setCantidadEnviar] = useState('')
    const [cantidadMaxima, setCantidadMaxima] = useState(1)

    const navigate = useNavigate();

    const branchId = JSON.parse(localStorage.getItem("branchId"))
    const permisos = JSON.stringify(localStorage.getItem("permisos"))

    useEffect(() => {
        const fetchData = async () => {
            await axios.get(`${SERVER}/stock/${branchId}`)
              .then(response => {
                const repuestosSucursal = response.data
                setStock(repuestosSucursal);
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

  const handleAddToTable = () => {
    if (sucursalDesde.idbranches === sucursalHacia.idbranches) {
        return alert('No se pueden enviar repuestos a una misma sucursal')
    }
    if (repuestoSeleccionado && sucursalDesde && sucursalHacia) {
        const cantidadEnviar = document.getElementById('cantidadEnviar').value
        if (cantidadEnviar < 1 || cantidadEnviar > cantidadMaxima) {
            return alert(`Enviar una cantidad entre 0 y ${cantidadMaxima}`)
        }
        setTableData([...tableData, {...repuestoSeleccionado, cantidadEnviar, sucursalDesde: sucursalDesde.idbranches, sucursalHacia: sucursalHacia.idbranches}]);
        document.getElementById('cantidadEnviar').value = ''
        setRepuestoSeleccionado(null)
    }
  };

  const handleSelectCode = (event) => {
    setRepuestoSeleccionado(event.value)
    setCantidadMaxima(event.value.cantidad_restante)
  }

  const [currentBranch, setCurrentBranch] = useState(branchId);
  const [allStocks, setAllStocks] = useState({})
  const handleSelectBranch = async (event) => {
    setSucursalDesde(event.value)
    const id = event.value.idbranches
    if (currentBranch !== id){
        let arrNewStock = []
        if (id in allStocks){
            arrNewStock = allStocks[id]
        } else {
            await axios.get(`${SERVER}/stock/${id}`)
              .then(response => {
                setAllStocks(prev => ({
                    ...prev,
                    [id]: response.data
                }))
                arrNewStock = response.data
            })
              .catch(error => {
                console.error(error);
            });
        }
        setCurrentBranch(id)
        setStock(arrNewStock)
    }
  }

  const handleDeleteRow = (index) => {
    const updatedData = tableData.filter((_, i) => i !== index);
    setTableData(updatedData);
  };

  const handleSubmit = async () => {
    const arrSucursales = []
    tableData.forEach((item) => {
        arrSucursales.push([item.idstock, item.sucursalDesde, -parseInt(item.cantidadEnviar)])
        arrSucursales.push([item.idstock, item.sucursalHacia, parseInt(item.cantidadEnviar)])
    })
    if (arrSucursales.length === 0) {
        return alert("Realizar cambios en la distribucion")
    } else {
        // StockBranchId, StockId, BranchId, CantidadTotal, CantidadRestante
        // El 1 que se puso al final de /stock/distribute/1 es porque el backend pide un id aunque no sea necesario
        await axios.put(`${SERVER}/stock/distribute/1`, {
            arraySucursales: arrSucursales
        })
            .then(response => {
                alert('Stock Modificado');
                return navigate('/stockCount')
            })
            .catch(error => {
                console.error(error);
            });
    } 
  }

  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <div className='bg-white m-2 py-8 px-2 mx-auto w-3/4'>
            <div className='mb-6'>
                <div className="text-2xl font-bold text-center">Enviar Stock</div>
            </div>
            {permisos.includes("Stock") && (
            <div>
                {/* Seleccionar codigo del repuesto */}   
                <div className='md:w-1/2 mx-auto'>
                    <div className='flex md:flex-row flex-col   '>
                        <div className='w-full'>
                            <label>Desde:</label>
                            <Select 
                            required
                            placeholder='Seleccionar sucursal'
                            options={ branches.map(branch => ({ label: branch.branch, value: branch }))}
                            onChange={(e) => handleSelectBranch(e)}
                            />
                        </div>
                        <div className='w-full'>
                            <label>Hacia:</label>
                            <Select 
                            required
                            placeholder='Seleccionar sucursal'
                            options={ branches.map(branch => ({ label: branch.branch, value: branch }))}
                            onChange={(e) => setSucursalHacia(e.value)}
                            />
                        </div>
                    </div>
                    {sucursalDesde && sucursalHacia && (
                        <div className='mt-2'>
                            <Select 
                            required
                            placeholder='Codigo de Repuesto'
                            options={ stock.map((item) => ({label: item.idstock, value: item})) }
                            onChange={(e) => handleSelectCode(e)}
                            />
                            {repuestoSeleccionado && (
                                <div className='mt-2'>
                                    <div className='flex flex-col'>
                                        <label htmlFor='cantidadEnviar'>Elegir cantidad</label>
                                        <input
                                        className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline"
                                        id='cantidadEnviar'
                                        required
                                        type='number'
                                        min={0}
                                        max={cantidadMaxima}
                                        onChange={(e) => setCantidadEnviar(e.value)}
                                        />
                                    </div>
                                    {cantidadEnviar !== '' && (
                                        <div>
                                            <button 
                                            className='bg-green-500 hover:bg-green-700 text-white font-bold mt-2 py-1 px-4 rounded'
                                            onClick={handleAddToTable}>
                                                Insertar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div> 
                <div className='mt-4'>
                    <table className='w-full text-center'>
                        <thead>
                        <tr>
                            <th>Código</th>
                            <th>Repuesto</th>
                            <th>Cantidad</th>
                        </tr>
                        </thead>
                        <tbody>
                        {tableData.map((item, index) => (
                            <tr key={index}>
                                <td>{item.idstock}</td>
                                <td>{item.repuesto}</td>
                                <td>{item.cantidadEnviar}</td>
                                <td>
                                    <button 
                                    onClick={() => handleDeleteRow(index)}
                                    className="bg-red-500 border px-4 py-2 color" >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <div>
                    <button 
                    className='bg-green-500 hover:bg-green-700 text-white font-bold mt-2 py-1 px-4 rounded'
                    onClick={handleSubmit}>
                        Enviar Todo
                    </button>
                </div>
            </div>
            )}
        </div>
    </div>
  );
}

export default EnviarStock;