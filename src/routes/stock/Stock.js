import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'
import Select from 'react-select'

function StockForm() {
  const [proveedores, setProveedores] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [stock, setStock] = useState([]);

  const [stockCategories, setStockCategories] = useState([])
  const [cajaId, setCajaId] = useState(0)
  const [pesosId, setPesosId] = useState(0)
  const [usdId, setusdId] = useState(0)
  const [mpId, setmpId] = useState(0)
  const [bancoId, setBancoId] = useState(0)
  const [repuestosId, setRepuestosId] = useState(0)
  const branchId = JSON.parse(localStorage.getItem("branchId"))

  const [dolar, setDolar] = useState(500)

  const navigate = useNavigate();

  useEffect(() => {    
    const fetchData = async () => {
      
      await axios.get(`${SERVER}/supplier`)
      .then(response => {
        setProveedores(response.data);
      })
      .catch(error => {
        console.error(error);
        // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
      });

      await axios.get(`${SERVER}/stockitem`)
      .then(response => {
        setRepuestos(response.data);
      })
      .catch(error => {
        console.error(error);
        // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
      });

      await axios.get(`${SERVER}/stock/${branchId}`)
        .then(response => {
          setStock(response.data);
        })
        .catch(error => {
          console.error(error);
          // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
        });

      await axios.get(`${SERVER}/movcategories`)
          .then(response => {
            setStockCategories(response.data.filter((repuesto) => repuesto.tipo.includes("Repuestos")))
              for (let i = 0; i < response.data.length; i++) {
                  if(response.data[i].categories === "Caja") {
                      setCajaId(response.data[i].idmovcategories)
                  } else if(response.data[i].categories === "Pesos") {
                      setPesosId(response.data[i].idmovcategories)
                  } else if(response.data[i].categories === "Dolares") {
                      setusdId(response.data[i].idmovcategories)
                  } else if(response.data[i].categories === "MercadoPago") {
                      setmpId(response.data[i].idmovcategories)
                  } else if(response.data[i].categories === "Banco") {
                      setBancoId(response.data[i].idmovcategories)
                  } else if(response.data[i].categories === "Repuestos") {
                    setRepuestosId(response.data[i].idmovcategories)
                  }          
              }
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
            const userId = JSON.parse(localStorage.getItem("userId"))
              
            const formData = new FormData(event.target);
  
            let fecha_compra = document.getElementById('fecha_ingreso').value
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
            let montoTotalUsd = 0
            let valueUsd
            let valuePesos
            let valueTrans
            let valueMp
            if (categoriaValue.idmovcategories === cajaId) {
              valueUsd = parseInt(formData.get('USD')) || 0
              valuePesos = parseInt(formData.get('pesos')) || 0
              valueTrans = parseInt(formData.get('banco')) || 0
              valueMp = parseInt(formData.get('mercadopago')) || 0
              
              const dolarArr = [valueUsd]
              const pesosArr = [valuePesos, valueTrans, valueMp]
    
              const montoUSD = dolarArr.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
              const montoPesos = pesosArr.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
              montoTotal = montoPesos + (montoUSD * dolar)
              montoTotalUsd = montoTotal / dolar
            }
  
            if(montoTotal === 0 && categoriaValue.idmovcategories === cajaId){
              setIsNotLoading(true)
              return alert("Ingresar montos")
            } else {
              montoTotalUsd = parseInt(stockData.cantidad) * parseFloat(stockData.precio_compra)  
            }
  
            const fechaHoraBuenosAires = new Date().toLocaleString("en-IN", {timeZone: "America/Argentina/Buenos_Aires", hour12: false}).replace(',', '');
  
            let stockId;
            await axios.post(`${SERVER}/stock`, stockData)
                .then(response => {
                  stockId = response.data.stockId
                  })
                .catch(error => {
                  console.error(error);
                  });
  
            // movname
            const movNameData = {
                ingreso: "Repuestos", 
                egreso: categoriaValue.categories, 
                operacion: `Repuesto ${repuestoValue.repuesto} x${stockData.cantidad}`, 
                monto: montoTotalUsd,
                userId,
                branch_id: branchId,
                fecha: fechaHoraBuenosAires.split(' ')[0]
            }
            await axios.post(`${SERVER}/movname`, movNameData)
                .then(response => {
                    const movNameId = response.data.insertId
                    arrayMovements.push([repuestosId, montoTotalUsd, movNameId, branchId])
                    //libro
                    if(cajaId === categoriaValue.idmovcategories) {
                        if (valueUsd !== 0){
                            arrayMovements.push([usdId, -valueUsd, movNameId, branchId])
                        }
                        if (valueTrans !== 0){
                            arrayMovements.push([bancoId, -valueTrans, movNameId, branchId])
                        }
                        if (valuePesos !== 0){
                            arrayMovements.push([pesosId, -valuePesos, movNameId, branchId])
                        }
                        if (valueMp !== 0){
                            arrayMovements.push([mpId, -valueMp, movNameId, branchId])
                        }
                    } else {
                        arrayMovements.push([categoriaValue.idmovcategories, -montoTotalUsd, movNameId, branchId])
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
                        navigate(`/printCode/${stockId}`);
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
        await axios.delete(`${SERVER}/stock/${id}`)
        alert("Stock eliminado correctamente")
        window.location.reload();
    } catch (error) {
        console.error(error)
    }
  }

  const [repuestoValue, setRepuestoValue] = useState([])
  const [proveedorValue, setProveedorValue] = useState([])

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
                          <div className='w-full'>
                              <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Pesos:</label>
                              <input 
                                  className="mb-2 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" 
                                  type="number" 
                                  id="pesos" 
                                  name='pesos'
                                  defaultValue={0}
                              />
                          </div>     
                          <div className='w-full'>
                              <label className="block text-gray-700 font-bold mb-2" htmlFor="name">USD:</label>
                              <input 
                                  className="mb-2 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" 
                                  type="number" 
                                  id="USD" 
                                  name='USD'
                                  defaultValue={0}
                              />
                          </div>    
                          <div className='w-full'>
                              <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Banco:</label>
                              <input 
                                  className="mb-2 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" 
                                  type="number" 
                                  id="banco" 
                                  name='banco'
                                  defaultValue={0}
                              />
                          </div>
                          <div className='w-full'>
                              <label className="block text-gray-700 font-bold mb-2" htmlFor="name">MercadoPago:</label>
                              <input 
                                  className="mb-2 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" 
                                  type="number" 
                                  id="mercadopago" 
                                  name='mercadopago'
                                  defaultValue={0}
                              />
                          </div>                                
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
            <table className="table-auto hidden sm:block">
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
            <div className="sm:hidden">
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