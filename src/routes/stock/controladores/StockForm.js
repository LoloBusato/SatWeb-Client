import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import SERVER from '../../server';
import Select from 'react-select';

function StockForm({ stock_id, branch_id, update_boolean }) {
    const [proveedores, setProveedores] = useState([]);
    const [repuestos, setRepuestos] = useState([]);

    const [defaultRepuesto, setDefaultRepuesto] = useState([])
    const [defaultProveedor, setDefaultProveedor] = useState([])

    const [repuesto, setRepuesto] = useState([])
    const [proveedor, setProveedor] = useState([])

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
                        const stock = respuesta.filter(item => item.stock_id === parseInt(stock_id))[0]

                        setDefaultProveedor(stock.proveedor_id)
                        setDefaultRepuesto(stock.idrepuestos)

                        document.getElementById("cantidad").value = stock.cantidad;
                        document.getElementById("precio_compra").value = stock.precio_compra;
                        document.getElementById("fecha_ingreso").value = stock.fecha_compra.slice(0, 10);
                    })
                    .catch(error => {
                        console.error(error);
                });
            }
        }
        fetchSupplier()
        // eslint-disable-next-line
    }, []);
    useEffect(() => {
        setProveedor(proveedores
            .filter(proveedor => proveedor.idproveedores === defaultProveedor)
            .map((proveedor) => ({label: proveedor.nombre, value: proveedor.idproveedores})))
    }, [proveedores, defaultProveedor])
    useEffect(() => {
        setRepuesto(repuestos
            .filter(repuesto => repuesto.idrepuestos === defaultRepuesto)
            .map((repuesto) => ({label: repuesto.repuesto, value: repuesto.idrepuestos})))
    }, [repuestos, defaultRepuesto])

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
          repuesto_id: repuesto[0].value,
          cantidad: parseInt(formData.get('cantidad')),
          precio_compra: parseFloat(formData.get('precio_compra')),
          fecha_compra,
          proveedor_id: proveedor[0].value,
        };
        await axios.put(`${SERVER}/stock/${stock_id}`, stockData)
            .then(response => {
              alert("Stock modificado con exito");
              navigate("/stockCount");
              })
            .catch(error => {
              console.error(error);
            });
        }

    const customFilterOption = (option, searchText) => {

        const optionValue = option.data.label;
        const palabras = searchText.split(' ').filter(Boolean)
    
        return palabras.every((palabra) => optionValue.toLowerCase().includes(palabra.toLowerCase()))
        };

    return (
        <form onSubmit={handleSubmit} className='max-w-md mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4'>
            {/* Seleccionar Repuesto y boton para agregarlo */}
            <div className='mb-4'>
                <label htmlFor="input" className='block text-gray-700 font-bold mb-2'>
                    Repuesto:
                </label>
                <Select 
                required
                value={repuesto}
                options={ repuestos.map((repuesto) => ({label: repuesto.repuesto, value: repuesto.idrepuestos})) }
                onChange={ (e) => setRepuesto([e]) }
                placeholder='Repuesto'
                filterOption={customFilterOption}
                />
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
            <Select 
                required
                value={proveedor}
                options={proveedores.map((proveedor) => ({label: proveedor.nombre, value: proveedor.idproveedores}))}
                placeholder='Proveedor'
                onChange={ (e) => setProveedor([e])  }
            />
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