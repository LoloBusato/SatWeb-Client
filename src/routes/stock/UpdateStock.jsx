import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';


function UpdateStock() {
  const [proveedores, setProveedores] = useState([]);
  const [repuestos, setRepuestos] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const stockId = location.pathname.split("/")[2];

  useEffect(() => {
    const fetchSupplier = async () => {
      
      await axios.get('http://localhost:3001/supplier')
        .then(response => {
          setProveedores(response.data);
        })
        .catch(error => {
          console.error(error);
          // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
        });
  
      await axios.get('http://localhost:3001/stock/item')
      .then(response => {
        setRepuestos(response.data);
      })
      .catch(error => {
        console.error(error);
        // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
      });
  
      await axios.get('http://localhost:3001/stock')
      .then(response => {
        for (let i = 0; i < response.data.length; i++) {
          if (response.data[i].idstock === Number(stockId)) {
            document.getElementById("repuesto_nombre").value = response.data[i].repuesto;
            document.getElementById("cantidad").value = response.data[i].cantidad;
            document.getElementById("precio_compra").value = response.data[i].precio_compra;
            document.getElementById("fecha_ingreso").value = response.data[i].fecha_compra.slice(0, 10);
            document.getElementById("proveedor_nombre").value = response.data[i].nombre;
          }
        }
      })
      .catch(error => {
        console.error(error);
        // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
      });
    }
    fetchSupplier()
    // eslint-disable-next-line
  }, []);

  function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const stockData = {
      repuesto_nombre: formData.get('repuesto_nombre'),
      cantidad: formData.get('cantidad'),
      precio_compra: formData.get('precio_compra'),
      fecha_compra: formData.get('fecha_ingreso'),
      proveedor_nombre: formData.get('proveedor_nombre'),
    };

    axios.get(`http://localhost:3001/supplier/${stockData.proveedor_nombre}`)
      .then(response => {
        const proveedorId = response.data;
        stockData.proveedor_id = proveedorId;

        axios.get(`http://localhost:3001/item/${stockData.repuesto_nombre}`)
          .then(info => {
            const repuestoId = info.data;
            stockData.repuesto_id = repuestoId;

            axios.put(`http://localhost:3001/stock/${stockId}`, stockData)
              .then(response => {
                alert("Stock modificado con exito");
                navigate("/stockCount");
                // Aquí puedes hacer algo con la respuesta del backend, como mostrar un mensaje de éxito al usuario
                })
              .catch(error => {
                console.error(error);
                // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
                });
        })

      })
      .catch(error => {
        console.error(error);
        // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
      });
  }

  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
      <MainNavBar />
      <div className='bg-white m-2 py-8 px-2'>
        <h1 className="text-center text-5xl">Modificar stock</h1>
        <div>
          <form onSubmit={handleSubmit} className='max-w-md mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4'>
            <div className='mb-4'>
              <label htmlFor="input" className='block text-gray-700 font-bold mb-2'>
                Repuesto:
              </label>
              <div className='relative'>
                <select name="repuesto_nombre" id="repuesto_nombre" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline">
                  {repuestos.map((repuesto) => (
                    <option key={repuesto.idrepuestos} value={repuesto.repuesto}>{repuesto.repuesto}</option>
                  ))}
                </select>
                <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700'>
                  <svg className='fill-current h-4 w-4' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><path d='M10 12a2 2 0 100-4 2 2 0 000 4z'/></svg>
                </div>
              </div>
              <button className="mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => { navigate(`/items`) }} >
                  Agregar productos
              </button>
            </div>
            <div className='mb-4'>
              <label htmlFor="cantidad" className='block text-gray-700 font-bold mb-2'>
                Cantidad:
              </label>
              <input type="number" name="cantidad" id="cantidad" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div className='mb-4'>
              <label htmlFor="precio_compra" className='block text-gray-700 font-bold mb-2'>
                Precio de compra (USD):
              </label>
              <input type="number" name="precio_compra" id="precio_compra" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div className='mb-4'>
              <label htmlFor="proveedor_nombre" className='block text-gray-700 font-bold mb-2'>
                Proveedor:
              </label>
              <div className='relative'>
                <select name="proveedor_nombre" id="proveedor_nombre" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline">
                  {proveedores.map(proveedor => (
                    <option key={proveedor.idproveedores} value={proveedor.nombre}>{proveedor.nombre}</option>
                  ))}
                </select>
                <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700'>
                  <svg className='fill-current h-4 w-4' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><path d='M10 12a2 2 0 100-4 2 2 0 000 4z'/></svg>
                </div>
              </div>
              <button className="mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => { navigate(`/supplier`) }} >
                  Agregar/ver proveedores
              </button>
            </div>
            <div className='mb-4'>
              <label htmlFor="fecha_ingreso" className='block text-gray-700 font-bold mb-2'>
                Fecha de compra:
              </label>
              <input type="date" name="fecha_ingreso" id="fecha_ingreso" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div className='flex items-center justify-between px-10'>
              <button type="submit" className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'>
                Guardar
              </button>
              <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={() => { navigate(`/stock`) }} >
                    Volver
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UpdateStock;