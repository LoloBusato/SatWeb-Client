import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'
import Select from 'react-select'

function Items() {

    const [listaRepuestos, setListaRepuestos] = useState([])
    const [listaDevice, setListaDevice] = useState([])
    const [listaCalidades, setListaCalidades] = useState([])
    const [calidad, setCalidad] = useState([])
    const [listaNombres, setListaNombres] = useState([])
    const [nombreRepuesto, setNombreRepuesto] = useState([]);
    const [listaColores, setListaColores] = useState([])
    const [color, setColor] = useState([]);

    const [modelos, setModelos] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            await axios.get(`${SERVER}/stockitem`)
              .then(response => {
                setListaRepuestos(response.data);
              })
              .catch(error => {
                console.error(error);
              });
            await axios.get(`${SERVER}/calidadesRepuestos`)
              .then(response => {
                  setListaCalidades(response.data);
              })
              .catch(error => {
                  console.error(error);
              });
            await axios.get(`${SERVER}/devices`)
                .then(response => {
                    setListaDevice(response.data);
                })
                .catch(error => {
                    console.error(error);
                });
            await axios.get(`${SERVER}/nombresRepuestos`)
                .then(response => {
                    setListaNombres(response.data);
                })
                .catch(error => {
                    console.error(error);
                });
            await axios.get(`${SERVER}/colores`)
                .then(response => {
                    setListaColores(response.data);
                })
                .catch(error => {
                    console.error(error);
                });
        }
        fetchData()
      }, []);

    function verificarRepuesto(repuesto) {
        const indice_maximo = listaRepuestos.length
        let resultado = false
        let indice = 0
        while (!resultado && indice < indice_maximo) {
            if (listaRepuestos[indice].repuesto === repuesto) {
                resultado = true;
            }
            indice++
        }
        return resultado;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const calidad = document.getElementById('calidad').value
        let item = ` ${calidad} ${color}`
        const modelIdArr = [];
        modelos.forEach((modelo) => {
            modelIdArr.push(modelo.value.iddevices)
            item = `${item} ${modelo.label}`
        })
        if (verificarRepuesto(item)) {
            alert("Repuesto con ese nombre ya agregado")
        } else {
            let cantidad_limite
            if (CantidadLimiteCheck) {
                cantidad_limite = parseInt(document.getElementById('cantidad_limite').value)
            } else {
                cantidad_limite = -1
            }
            try {
                const response = await axios.post(`${SERVER}/stockitem`, {
                    repuesto: item,
                    cantidad_limite,
                    array_modelos: modelIdArr,
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
                        <div className='grid grid-cols-1 sm:grid-cols-2 mb-4'>
                            <div className="mb-2">
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="repuesto">
                                    Nombre del repuesto:
                                </label>
                                <Select
                                required
                                options={ listaNombres.map((nombreRepuestos) => ({label: nombreRepuestos.nombre_repuestos, value: nombreRepuestos})) }
                                placeholder='Nombre Repuesto'
                                onChange={(e) => setNombreRepuesto(e.value)}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="calidad">
                                    Calidad:
                                </label>
                                <Select
                                required
                                options={ listaCalidades.map((calidad) => ({label: calidad.calidad_repuestos, value: calidad})) }
                                placeholder='Seleccionar calidad'
                                onChange={(e) => setCalidad(e.value)}
                                />
                            </div>
                            <div className="mb-2">
                                <label htmlFor="options" className="block text-gray-700 font-bold mb-2">
                                    Selecciona Modelos:
                                </label>
                                <Select 
                                required
                                options={ listaDevice.map((equipo) => ({label: equipo.model, value: equipo})) }
                                placeholder='Equipos'
                                isMulti
                                onChange={(e) => setModelos(e)}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="block text-gray-700 font-bold mb-2" htmlFor="color">
                                    Color:
                                </label>
                                <Select
                                required
                                options={ listaColores.map((color) => ({label: color.color, value: color})) }
                                placeholder='Seleccionar color'
                                onChange={(e) => setColor(e.value)}
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