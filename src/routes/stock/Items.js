import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

function Items() {

    const [repuesto, setRepuestos] = useState("");
    const [color, setColor] = useState("");
    const [listaRepuestos, setListaRepuestos] = useState([])
    const [listaDevice, setListaDevice] = useState([])
    const CALIDADES = [
        "Original",
        "Usado",
        "Generico"
    ]

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            await axios.get(`${SERVER}/stockitem`)
              .then(response => {
                setListaRepuestos(response.data);
              })
              .catch(error => {
                console.error(error);
                // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
              });
              
            await axios.get(`${SERVER}/devices`)
              .then(response => {
                  setListaDevice(response.data);
              })
              .catch(error => {
                  console.error(error);
              });
        }
        fetchData()
      }, []);

    function verificarRepuesto(repuesto) {
        for (let i = 0; i < listaRepuestos.length; i++) {
            if (listaRepuestos[i].repuesto === repuesto) {
            return true;
            }
        }
        return false;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const calidad = document.getElementById('calidad').value
        let item = `${repuesto} ${calidad} ${color}`
        // const modelIdArr = [];
        modelo.forEach((modelo) => {

            modelo = JSON.parse(modelo)
            // modelIdArr.append(modelo.iddevices)
            item = `${item} ${modelo.type} ${modelo.model}`
        })
        if (verificarRepuesto(item)) {
            alert("Repuesto con ese nombre ya agregado")
        } else {
            try {
                const response = await axios.post(`${SERVER}/stockitem`, {
                    repuesto: item,
                });
                if(response.status === 200){
                    alert("Repuesto agregado")
                    window.location.reload();
                }
            } catch (error) {
                alert(error.response.data)
            }     
        }
    }

    const [modelo, setModelo] = useState([]);

    const handleSelectChange = (event) => {
        const modelId = event.target.value
        if (modelo.includes(modelId)) {
            setModelo(modelo.filter((item) => item !== modelId))
        } else {
            setModelo(prev => ([
                ...prev,
                modelId
            ]));
        }
    };

    const [CantidadLimiteCheck, setCantidadLimiteCheck] = useState(false)
  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <div className='bg-white m-2 py-8 px-2'>
            <div className="text-center">
                <h1 className="text-2xl font-bold">Agregar producto</h1>
            </div>
            <div className=''>
                <div className='max-w-7xl mx-auto p-4 text-center'>
                    <p className='font-bold'>NOMENCLATURA PARA EL INGRESO DE PRODUCTOS:</p>
                    <p>
                        Para el ingreso de un nuevo producto es de suma importancia 
                        que se respeten las normas de nomenclatura para poder replicarse
                        en todo el sistema.
                    </p>
                    <p>
                        En nuestro caso el orden es el siguiente:
                    </p>
                    <p className='font-bold'>
                        (Nombre del repuesto) (Calidad) (Modelo) (Color)
                    </p>
                    <p>
                        Teniendo la primer letra del nombre, de la calidad y del color en 
                        MAYUSCULA y respetando el nombre del modelo
                    </p>
                </div>
                <div className="p-4 max-w-4xl mx-auto">
                    <form onSubmit={handleSubmit} className="mb-4">
                        {/* Formulario del nombre del producto */}
                        <div className='flex justify-center mb-4'>
                            <div className="mb-2">
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="repuesto">Nombre del repuesto:</label>
                                <input 
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                    type="text" 
                                    id="repuesto"
                                    placeholder='Bateria'
                                    value={repuesto} 
                                    onChange={(e) => setRepuestos(e.target.value)} 
                                />
                            </div>
                            <div className="mb-2">
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="calidad">Calidad:</label>
                                <select id='calidad' defaultValue='' className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                                    <option value='' disabled >Seleccionar calidad</option>
                                    {CALIDADES.map((item) => (
                                        <option id={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-2">
                                <label htmlFor="options" className="block text-gray-700 font-bold mb-2">Selecciona Modelos:</label>
                                <select id="options" multiple value={modelo} onChange={handleSelectChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                                    {listaDevice.map((item) => (
                                        <option value={JSON.stringify(item)}>{item.model}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-2">
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="color">Color:</label>
                                <input 
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                    type="text" 
                                    id="color" 
                                    placeholder='Rojo'
                                    value={color} 
                                    onChange={(e) => setColor(e.target.value)} 
                                />
                            </div>
                        </div>
                        {/* Formulario de cantidad para avisar */}
                        <div className="flex flex-col items-center">
                            <div className="mb-4 flex flex-col">
                                <label htmlFor="stock_boolean" className="text-gray-700">¿Quiere tener una cierta cantidad en stock?</label>
                                <input type="checkbox" id="stock_boolean" value={CantidadLimiteCheck} onClick={() => setCantidadLimiteCheck(!CantidadLimiteCheck)} className="mt-2" />
                            </div>
                            {CantidadLimiteCheck && (
                                <div className="mb-4 flex flex-col">
                                    <label htmlFor="cantidad_limite" className="text-gray-700">¿En cuántas unidades quiere reponer el stock?</label>
                                    <input id="cantidad_limite" type="number" min={0} className="mt-2 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            )}
                        </div>
                        {/* Botón de guardar */}
                        <div className='flex justify-center'>
                            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Guardar
                            </button>
                        </div>
                    </form>
                </div>
                <div className="mx-10 p-4 flex flex-wrap justify-between">
                    {listaRepuestos.map(repuesto => (
                        <div key={repuesto.idrepuestos} className="max-w-sm flex items-center py-2 border-b w-full md:w-1/2">
                        <h3 className="text-gray-900 leading-tight flex-1">{repuesto.repuesto}</h3>
                        <button 
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        onClick={() => { navigate(`/updateItem/${repuesto.idrepuestos}`) }} >
                            Editar
                        </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}

export default Items;