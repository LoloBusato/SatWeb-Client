import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import SERVER from '../../server';

function StockForm({ stock_id, branch_id, update_boolean }) {
    const [proveedores, setProveedores] = useState([]);
    const [repuestos, setRepuestos] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchSupplier = async () => {

            await axios.get(`${SERVER}/supplier`)
                /*
                Realiza una llamada al BackEnd para obtener la lista
                    con todos los proveedores en formato diccionario:
                idproveedores
                nombre
                telefono
                direccion
                */
                .then(response => {
                    console.log(response.data)
                    setProveedores(response.data);
                })
                .catch(error => {
                    console.error(error);
            });
    
            await axios.get(`${SERVER}/stockitem`)
                /*
                Realiza una llamada al BackEnd para obtener la lista
                    con todos los repuestos en formato diccionario:
                idrepuestos
                repuesto
                cantidad_limite
                */
                .then(response => {
                    setRepuestos(response.data);
                })
                .catch(error => {
                    console.error(error);
            });

            if(update_boolean) {
                await axios.get(`${SERVER}/stock/${branch_id}`)
                    /*
                    Realiza una llamada al BackEnd para obtener la lista
                        con todos los productos en stock de la sucursal
                        en formato diccionario:
                    branch_id
                    cantidad
                    cantidad_branch
                    cantidad_limite
                    cantidad_restante
                    direccion
                    fecha_compra
                    idproveedores
                    idrepuestos
                    idstock
                    nombre
                    precio_compra
                    proveedor_id
                    repuesto
                    repuesto_id
                    stock_id
                    stockbranchid
                    telefono
                        Despues la recorre hasta encontrar el stock_id que coincide
                        y asigna los valores a los diferentes inputs
                    */
                    .then(response => {
                        const respuesta = response.data
                        const stock = respuesta.filter(item => item.stock_id === parseInt(stock_id))

                        document.getElementById("repuesto").value = stock[0].idrepuestos;
                        document.getElementById("cantidad").value = stock[0].cantidad;
                        document.getElementById("precio_compra").value = stock[0].precio_compra;
                        document.getElementById("fecha_ingreso").value = stock[0].fecha_compra.slice(0, 10);
                        document.getElementById("proveedor_nombre").value = stock[0].proveedor_id;
                    })
                    .catch(error => {
                        console.error(error);
                });
            }
        }
        fetchSupplier()
        // eslint-disable-next-line
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        
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
          repuesto_id: parseInt(formData.get('repuesto')),
          cantidad: parseInt(formData.get('cantidad')),
          precio_compra: parseFloat(formData.get('precio_compra')),
          fecha_compra,
          cantidad_limite: -1,
          proveedor_id: parseInt(formData.get('proveedor_nombre')),
        };
        console.log(stockData)
    
        await axios.put(`${SERVER}/stock/${stock_id}`, stockData)
            .then(response => {
              alert("Stock modificado con exito");
              navigate("/stockCount");
              })
            .catch(error => {
              console.error(error);
            });
        }

        return (
            <form onSubmit={handleSubmit} className='max-w-md mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4'>
                {/* Seleccionar Repuesto y boton para agregarlo */}
                <div className='mb-4'>
                    <label htmlFor="input" className='block text-gray-700 font-bold mb-2'>
                        Repuesto:
                    </label>
                    <div className='relative'>
                        <select name="repuesto" id="repuesto" defaultValue="" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline">
                        <option value="" disabled >Repuesto</option>
                        {repuestos.map((repuesto) => (
                            <option key={repuesto.idrepuestos} value={repuesto.idrepuestos}>{repuesto.repuesto}</option>
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
                {/* Cantidad */}
                <div className='mb-4'>
                <label htmlFor="cantidad" className='block text-gray-700 font-bold mb-2'>
                    Cantidad:
                </label>
                <input type="number" name="cantidad" id="cantidad" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" />
                </div>
                {/* Precio de Compra */}
                <div className='mb-4'>
                <label htmlFor="precio_compra" className='block text-gray-700 font-bold mb-2'>
                    Precio de compra (USD):
                </label>
                <input type="number" step='0.01' min='0' name="precio_compra" id="precio_compra" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" />
                </div>
                {/* Seleccionar proveedor y boton para agregarlo */}
                <div className='mb-4'>
                <label htmlFor="proveedor_nombre" className='block text-gray-700 font-bold mb-2'>
                    Proveedor:
                </label>
                <div className='relative'>
                    <select name="proveedor_nombre" id="proveedor_nombre" defaultValue="" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline">
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
                {/* Fecha de Compra */}
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
        )
}

export default StockForm