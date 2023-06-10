import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

function UpdateStock() {
  const [proveedores, setProveedores] = useState([]);
  const [repuestos, setRepuestos] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const stockId = location.pathname.split("/")[2];
  const branchId = JSON.parse(localStorage.getItem("branchId"))

  useEffect(() => {
    const fetchSupplier = async () => {
      
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
        for (let i = 0; i < response.data.length; i++) {
          if (response.data[i].idstock === Number(stockId)) {
            console.log(response.data[i])
            document.getElementById("repuesto").value = response.data[i].repuesto;
            document.getElementById("cantidad").value = response.data[i].cantidad;
            document.getElementById("precio_compra").value = response.data[i].precio_compra;
            document.getElementById("cantidad_limite").value = response.data[i].cantidad_limite;
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

    async function handleSubmit(event) {
    event.preventDefault();

    const repuestoValue = JSON.parse(document.getElementById("repuesto").value)

    const formData = new FormData(event.target);

    let fecha_compra = document.getElementById('fecha_ingreso').value

    if(fecha_compra === ""){
      const fechaActual = new Date();
      const anio = fechaActual.getFullYear();
      const mes = ('0' + (fechaActual.getMonth() + 1)).slice(-2);
      const dia = ('0' + fechaActual.getDate()).slice(-2);
      fecha_compra = anio + '-' + mes + '-' + dia;
    }

    const stockData =  {
      repuesto_id: repuestoValue.idrepuestos,
      cantidad: parseInt(formData.get('cantidad')),
      precio_compra: parseFloat(formData.get('precio_compra')),
      fecha_compra,
      cantidad_limite: parseInt(formData.get('cantidad_limite')),
      proveedor_id: parseInt(formData.get('proveedor_nombre')),
    };

    await axios.put(`${SERVER}/stock/${stockId}`, stockData)
        .then(response => {
          alert("Stock modificado con exito");
          navigate("/stockCount");
          // Aquí puedes hacer algo con la respuesta del backend, como mostrar un mensaje de éxito al usuario
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
                <select name="repuesto" id="repuesto" defaultValue="" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline">
                  <option value="" disabled >Repuesto</option>
                  {repuestos.map((repuesto) => (
                    <option key={repuesto.idrepuestos} value={JSON.stringify(repuesto)}>{repuesto.repuesto}</option>
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
              <label htmlFor="cantidad_limite" className='block text-gray-700 font-bold mb-2'>
                Cantidad para avisar:
              </label>
              <input type="number" name="cantidad_limite" id="cantidad_limite" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div className='mb-4'>
              <label htmlFor="precio_compra" className='block text-gray-700 font-bold mb-2'>
                Precio de compra (USD):
              </label>
              <input type="number" step='0.01' min='0' name="precio_compra" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div className='mb-4'>
              <label htmlFor="proveedor_nombre" className='block text-gray-700 font-bold mb-2'>
                Proveedor:
              </label>
              <div className='relative'>
                <select name="proveedor_nombre" defaultValue="" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline">
                  <option value="" disabled >Proveedor</option>
                  {proveedores.map(proveedor => (
                    <option key={proveedor.idproveedores} value={proveedor.idproveedores}>{proveedor.nombre}</option>
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
              <input type="date" name="fecha_ingreso" id="fecha_ingreso" defaultValue="" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div className='flex items-center justify-center px-10'>
              <button type="submit" className='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded'>
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UpdateStock;