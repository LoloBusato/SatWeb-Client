import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'
import Select from 'react-select'

function StockForm() {
  const [stockCategories, setStockCategories] = useState([])
  const [cuentasCategories, setCuentasCategories] = useState([])

  const [cajaId, setCajaId] = useState(0)

  const [proveedores, setProveedores] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [stock, setStock] = useState([]);

  const [dolar, setDolar] = useState(500)
  
  const [repuestosId, setRepuestosId] = useState(0)
  
  const navigate = useNavigate();
  const branchId = JSON.parse(localStorage.getItem("branchId"))
  const userId = JSON.parse(localStorage.getItem("userId"))

  useEffect(() => {    
    const fetchData = async () => {
      
      await axios.get(`${SERVER}/supplier`)
      .then(response => {
        setProveedores(response.data);
      })
      .catch(error => {
        console.error(error);
      });

      await axios.get(`${SERVER}/stockitem`)
      .then(response => {
        setRepuestos(response.data);
      })
      .catch(error => {
        console.error(error);
      });

      await axios.get(`${SERVER}/stock/${branchId}`)
        .then(response => {
          setStock(response.data);
        })
        .catch(error => {
          console.error(error);
        });

      await axios.get(`${SERVER}/movcategories`)
          .then(response => {
            const tempCategories = {
              repuestos: [],
            };

            response.data.forEach((category) => {
                if (category.tipo.includes("Repuestos")) {
                    tempCategories.repuestos.push(category);
                }
                if (category.categories === "Caja") {
                    setCajaId(category.idmovcategories)
                } else if(category.categories === "Repuestos") {
                  setRepuestosId(category.idmovcategories)
                }   
            });
            const cuentas = response.data
            .filter((cuenta) => cuenta.tipo.includes("Cuentas"))
            .filter((cuenta) => cuenta.branch_id === branchId || cuenta.branch_id === null)

            setCuentasCategories(cuentas)
            setStockCategories(tempCategories.repuestos);
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
  fetchData()
// eslint-disable-next-line
  }, []);

  const [isNotLoading, setIsNotLoading] = useState(true);

  async function handleSubmit(event) {
      event.preventDefault();
      if (isNotLoading) {
        try {
            setIsNotLoading(false)
              
            const formData = new FormData(event.target);
  
            const fechaHoraBuenosAires = new Date().toLocaleString("en-IN", {timeZone: "America/Argentina/Buenos_Aires", hour12: false}).replace(',', '');
            
            const fechaActual = fechaHoraBuenosAires.split(' ')[0]
            const [dia, mes, anio] = fechaActual.split('/').map(Number);
            const mesFormateado = mes < 10 ? `0${mes}` : mes;
            const diaFormateado = dia < 10 ? `0${dia}` : dia;
            const fechaFormateada = `${anio}-${mesFormateado}-${diaFormateado}`;

            let fecha_compra = document.getElementById('fecha_ingreso').value || fechaFormateada
            if(fecha_compra === ""){
              const fechaActual = new Date();
              const anio = fechaActual.getFullYear();
              const mes = ('0' + (fechaActual.getMonth() + 1)).slice(-2);
              const dia = ('0' + fechaActual.getDate()).slice(-2);
              fecha_compra = anio + '-' + mes + '-' + dia;
            }
  
            const stockData = {
              repuesto_id: repuestoValue.idrepuestos,
              cantidad: parseInt(formData.get('cantidad')),
              precio_compra: parseFloat(formData.get('precio_compra')),
              fecha_compra,
              cantidad_limite: parseInt(formData.get('cantidad_limite')) || null,
              proveedor_id: proveedorValue,
              branch_id: branchId
            };
  
            const arrayMovements = []
  
            let montoTotal = 0
            let montoTotalUsd = (parseInt(stockData.cantidad) * parseFloat(stockData.precio_compra)).toFixed(2)
            if (categoriaValue.idmovcategories === cajaId) {
              cuentasCategories.forEach((cuenta) => {
                const value = parseInt(document.getElementById(cuenta.categories).value) || 0
                if (value !== 0) {
                    arrayMovements.push([cuenta.idmovcategories, -value])
                }
                if (cuenta.es_dolar === 1) {
                    montoTotal += (value * dolar)
                } else {
                    montoTotal += value
                }
              })
            } else {
              arrayMovements.push([categoriaValue.idmovcategories, -montoTotalUsd])
            }
            arrayMovements.push([repuestosId, montoTotalUsd])
              
            if(montoTotal === 0 && categoriaValue.idmovcategories === cajaId){
              setIsNotLoading(true)
              return alert("Ingresar montos")
            } 
    
            let stockId;

            // movname
            const movNameData = {
              ingreso: "Repuestos", 
              egreso: categoriaValue.categories, 
              operacion: `Repuesto ${repuestoValue.repuesto} x${stockData.cantidad}`, 
              monto: montoTotalUsd,
              userId,
              branch_id: branchId,
              fecha: fechaHoraBuenosAires,
              order_id: null,
          }
            await axios.post(`${SERVER}/stock`, stockData)
                .then(response => {
                  stockId = response.data.stockId
                  })
                .catch(error => {
                  console.error(error);
                  });

            await axios.post(`${SERVER}/movname`, movNameData)
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
                        alert("repuesto agregado")
                        setIsNotLoading(true)
                        navigate(`/printCode/${stockId}%20${repuestoValue.repuesto}`);
                    } 
                })
                .catch(error => {
                    console.error(error);
                });
      } catch (error) {
          alert(error);
      } 
      }
  }

  const [cajaIsSelected, setCajaIsSelected] = useState(false)
  const [categoriaValue, setCategoriaValue] = useState([])

  const handleCategoriaSelect = (event) => {
    const selectedValue = event.value;
    setCategoriaValue(selectedValue)

    setCajaIsSelected(selectedValue.idmovcategories === cajaId);
  };

  const eliminarElemento = async (id) => {
    try {        
        const response = await axios.delete(`${SERVER}/stock/${id}`)
        if (response.status === 200) {
          alert("Stock eliminado correctamente")
          window.location.reload();
        }
    } catch (error) {
        console.error(error)
    }
  }

  const [repuestoValue, setRepuestoValue] = useState([])
  const [proveedorValue, setProveedorValue] = useState([])

  const customFilterOption = (option, searchText) => {
    const optionValue = option.data.label;
    const palabras = searchText.split(' ').filter(Boolean)
    return palabras.every((palabra) => optionValue.toLowerCase().includes(palabra.toLowerCase()))
  };

  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
      <MainNavBar />
      <div className='bg-white m-2 py-8 px-2'>
        <h1 className="text-center text-5xl">Agregar stock</h1>
        <div>
          <form onSubmit={handleSubmit} className='max-w-md mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4'>
            {/* Seleccionar repuesto */}
            <div className='mb-4'>
              <label htmlFor="input" className='block text-gray-700 font-bold mb-2'>
                Repuesto:
              </label>
              <div className='relative'>
                <Select 
                required
                options={ repuestos.map((repuesto) => ({label: repuesto.repuesto, value: repuesto})) }
                onChange={ (e) => setRepuestoValue(e.value) }
                placeholder='Repuesto'
                filterOption={customFilterOption}
                />
              </div>
              <button className="mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => { navigate(`/items`) }} >
                  Agregar productos
              </button>
            </div>
            {/* Cantidad */}
            <div className='mb-4'>
              <label htmlFor="cantidad" className='block text-gray-700 font-bold mb-2'>
                Cantidad:
              </label>
              <input type="number" required name="cantidad" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            {/* Precio de compra */}
            <div className='mb-4'>
              <label htmlFor="precio_compra" className='block text-gray-700 font-bold mb-2'>
                Precio de compra (USD):
              </label>
              <input type="number" required step='0.01' min='0' name="precio_compra" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            {/* Proveedor */}
            <div className='mb-4'>
              <label className='block text-gray-700 font-bold mb-2'>
                Proveedor:
              </label>
              <div className='relative'>
                <Select 
                required
                options={proveedores.map((proveedor) => ({label: proveedor.nombre, value: proveedor.idproveedores}))}
                placeholder='Proveedor'
                onChange={ (e) => setProveedorValue(e.value)  }
                />
              </div>
              <button className="mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => { navigate(`/supplier`) }} >
                  Agregar/ver proveedores
              </button>
            </div>
            {/* Agregar gasto y quien puso la mosca */}
            <div className=''>
                {/* Valores */}
                <div className='w-full mb-2'>
                    <label className="block text-gray-700 font-bold mb-2">Cuenta: *</label>
                    <Select 
                    required
                    options={stockCategories.map((category) => ({label: category.categories, value: category}))}
                    placeholder='Cuenta'
                    onChange={ handleCategoriaSelect }
                    />
                </div>
                {cajaIsSelected && (
                  <div className='w-full text-center'>
                      <label className="block text-gray-700 font-bold my-2 border-b-2">Monto *</label>
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
                )}
            </div>
            {/* Fecha de compra */}
            <div className='mb-4'>
              <label htmlFor="fecha_ingreso" className='block text-gray-700 font-bold mb-2'>
                Fecha de compra:
              </label>
              <input type="date" name="fecha_ingreso" id="fecha_ingreso" defaultValue="" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            {/* Boton de guardar */}
            <div className='flex items-center justify-center px-10'>
              <button type="submit" className='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded'>
                Guardar
              </button>
            </div>
          </form>
          <div className="flex justify-center mb-10">
            {/* Tabla para dispositivos de tamanio sm y mayor */}
            <table className="table-auto hidden md:block">
              <thead>
                <tr>
                  <th className="px-4 py-2">Repuesto</th>
                  <th className="px-4 py-2">Cantidad</th>
                  <th className="px-4 py-2">Precio</th>
                  <th className="px-4 py-2">Proveedor</th>
                  <th className="px-4 py-2">Fecha (aaaa/mm/dd)</th>
                </tr>
              </thead>
              <tbody>
                {stock.map(stock => (
                  <tr key={stock.idstock}>
                    <td className="border px-4 py-2" value={stock.repuesto}>{stock.repuesto}</td>
                    <td className="border px-4 py-2" value={stock.cantidad}>{stock.cantidad}</td>
                    <td className="border px-4 py-2" value={stock.precio_compra}>{stock.precio_compra} USD</td>
                    <td className="border px-4 py-2" value={stock.nombre}>{stock.nombre}</td>
                    <td className="border px-4 py-2" value={stock.fecha_compra}>{stock.fecha_compra.slice(0, 10)}</td>
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
            {/* Tabla colapsable para dispositivos pequeños */}
            <div className="md:hidden">
              {stock.map(stock => (
                  <details key={stock.idstock} className="border mb-1 rounded">
                      <summary className="px-4 py-2 cursor-pointer outline-none">
                        {stock.idstock} - {stock.repuesto}
                      </summary>
                      <div className=" bg-gray-100 flex flex-col">
                        <p className="border px-4 py-2" value={stock.repuesto}>Repuesto: {stock.repuesto}</p>
                        <p className="border px-4 py-2" value={stock.cantidad}>Cantidad: {stock.cantidad}</p>
                        <p className="border px-4 py-2" value={stock.precio_compra}>${stock.precio_compra} USD</p>
                        <p className="border px-4 py-2" value={stock.nombre}>Proveedor: {stock.nombre}</p>
                        <p className="border px-4 py-2" value={stock.fecha_compra}>Fecha: {stock.fecha_compra.slice(0, 10)}</p>
                        <button className="bg-red-500 border px-4 py-2 color" onClick={() => eliminarElemento(stock.idstock)}>Eliminar</button>
                        <button className="bg-green-500 border px-4 py-2 color"
                        onClick={() => { navigate(`/updateStock/${stock.idstock}`) }} >
                            Editar
                        </button>
                      </div>
                  </details>
              ))}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockForm;