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
    const [listaAlmacenamientos, setListaAlmacenamientos] = useState([])
    const [almacenamiento, setAlmacenamiento] = useState([])

    const [cantidadLimite, setCantidadLimite] = useState(-1)

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
            await axios.get(`${SERVER}/almacenamientosRepuestos`)
              .then(response => {
                setListaAlmacenamientos(response.data);
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

    function verificarExistencia(array, nombreColumna, valor) {
        return array.some(valorArray => valorArray[nombreColumna].trim().toLowerCase() === valor.trim().toLowerCase())
    }

    async function handleSubmit(event) {
        event.preventDefault();
        let item = ''
        const productoValues = {}
        if (ventaBool) {
            item = `Venta`
            productoValues.venta = 1
        } else {
            productoValues.venta = 0
        }
        if (nombreRepuesto[0]) {
            item = `${item} ${nombreRepuesto[0].nombre_repuestos}`
            productoValues.nombre_repuestos_id = nombreRepuesto[0].nombres_repuestos_id
        } else {
            productoValues.nombre_repuestos_id = null
        }
        if (calidad[0]) {
            item = `${item} ${calidad[0].calidad_repuestos}`
            productoValues.calidad_repuestos_id = calidad[0].calidades_repuestos_id
        } else {
            productoValues.calidad_repuestos_id = null
        }

        const modelIdArr = [];
        const copiaOrdenada = [...modelos];
        copiaOrdenada.sort((a, b) => {
            if (a.label < b.label) {
              return -1;
            }
            if (a.label > b.label) {
              return 1;
            }
            return 0;
          })
        copiaOrdenada.forEach((modelo) => {
            modelIdArr.push(modelo.value.iddevices)
            item = `${item} ${modelo.value.type} ${modelo.label}`
        })

        if (almacenamiento[0]) {
            item = `${item} ${almacenamiento[0].almacenamiento_repuestos}`
            productoValues.almacenamiento_repuestos_id = almacenamiento[0].almacenamientos_repuestos_id
        } else {
            productoValues.almacenamiento_repuestos_id = null
        }
        if (color[0]) {
            item = `${item} ${color[0].color}`
            productoValues.color_id = color[0].colores_id
        } else {
            productoValues.color_id = null
        }
        if (CantidadLimiteCheck) {
            productoValues.cantidad_limite = parseInt(cantidadLimite)
        } else {
            productoValues.cantidad_limite = -1
        }
        productoValues.array_modelos = modelIdArr
        productoValues.repuesto = item

        if (verificarExistencia(listaRepuestos, 'repuesto',item)) {
            alert("Repuesto con ese nombre ya agregado")
        } else {
            try {
                /*
                    nombre_repuestos_id: nombreRepuesto.nombres_repuestos_id,
                    calidad_repuestos_id: calidad.calidades_repuestos_id,
                    colores_id: color.colores_id,
                    repuesto: item,
                    cantidad_limite,
                    almacenamiento_repuestos_id: almacenamiento.almacenamientos_repuestos_id,
                    array_modelos: modelIdArr,
                    venta
                */
                const response = await axios.post(`${SERVER}/stockitem`, productoValues );
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
    const [ventaBool, setVentaBool] = useState(false)

  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <div className='bg-white m-2 py-8 px-2'>
            <div className="text-center">
                <h1 className="text-2xl font-bold">Agregar producto</h1>
            </div>
            <div className="p-4 max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="mb-4">
                    {/* Formulario del nombre del producto */}
                    <div className='grid grid-cols-1 md:grid-cols-2 mb-4'>
                        <div className="mb-2">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="repuesto">
                                Nombre del repuesto:
                            </label>
                            <Select
                            options={listaNombres.map((nombreRepuestos) => ({
                                label: nombreRepuestos.nombre_repuestos,
                                value: nombreRepuestos,
                            }))}
                            placeholder='Nombre Repuesto'
                            onChange={(selectedOption, actionMeta) => {
                                if (actionMeta.action === 'clear') {
                                // El usuario ha deseleccionado
                                setNombreRepuesto([]); // o lo que sea apropiado para tu caso
                                } else {
                                // El usuario ha seleccionado
                                setNombreRepuesto(selectedOption ? [selectedOption.value] : []);
                                }
                            }}
                            isClearable={true}
                            />
                            <button 
                            type="button" 
                            onClick={ () => { navigate('/nombresRepuestos') }}
                            className=" mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline">
                                Agregar nombres 
                            </button>
                        </div>
                        <div className="mb-2">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="calidad">
                                Calidad:
                            </label>
                            <Select
                            options={ listaCalidades.map((calidad) => ({label: calidad.calidad_repuestos, value: calidad})) }
                            placeholder='Seleccionar calidad'
                            onChange={(selectedOption, actionMeta) => {
                                if (actionMeta.action === 'clear') {
                                // El usuario ha deseleccionado
                                setCalidad([]); // o lo que sea apropiado para tu caso
                                } else {
                                // El usuario ha seleccionado
                                setCalidad(selectedOption ? [selectedOption.value] : []);
                                }
                            }}
                            isClearable={true}
                            />
                            <button 
                            type="button" 
                            onClick={ () => { navigate('/calidadesRepuestos') }}
                            className=" mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline">
                                Agregar calidad 
                            </button>
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
                            <button 
                            type="button" 
                            onClick={ () => { navigate('/devices') }}
                            className=" mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline">
                                Agregar modelos 
                            </button>
                        </div>
                        <div className="mb-2">
                            <label htmlFor="options" className="block text-gray-700 font-bold mb-2">
                                Selecciona Almacenamiento:
                            </label>
                            <Select 
                            options={ listaAlmacenamientos.map((almacenamiento) => ({label: almacenamiento.almacenamiento_repuestos, value: almacenamiento})) }
                            placeholder='Almacenamiento'
                            onChange={(selectedOption, actionMeta) => {
                                if (actionMeta.action === 'clear') {
                                // El usuario ha deseleccionado
                                setAlmacenamiento([]); // o lo que sea apropiado para tu caso
                                } else {
                                // El usuario ha seleccionado
                                setAlmacenamiento(selectedOption ? [selectedOption.value] : []);
                                }
                            }}
                            isClearable={true}
                            />
                            <button 
                            type="button" 
                            onClick={ () => { navigate('/almacenamientosRepuestos') }}
                            className=" mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline">
                                Agregar Almacenamiento 
                            </button>
                        </div>
                        <div className="mb-2">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="color">
                                Color:
                            </label>
                            <Select
                            options={ listaColores.map((color) => ({label: color.color, value: color})) }
                            placeholder='Seleccionar color'
                            onChange={(selectedOption, actionMeta) => {
                                if (actionMeta.action === 'clear') {
                                // El usuario ha deseleccionado
                                setColor([]); // o lo que sea apropiado para tu caso
                                } else {
                                // El usuario ha seleccionado
                                setColor(selectedOption ? [selectedOption.value] : []);
                                }
                            }}
                            isClearable={true}
                            />
                            <button 
                            type="button" 
                            onClick={ () => { navigate('/agregarColores') }}
                            className=" mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline">
                                Agregar colores 
                            </button>
                        </div>
                    </div>
                    {/* Formulario de cantidad para avisar */}
                    <div className="flex flex-col items-center">
                        <div className='flex flex-row gap-4'>
                            <div className="mb-4 flex flex-col">
                                <label htmlFor="stock_boolean" className="text-gray-700">¿Quiere tener una cierta cantidad en stock?</label>
                                <input type="checkbox" id="stock_boolean" checked={CantidadLimiteCheck} onChange={() => setCantidadLimiteCheck(!CantidadLimiteCheck)} className="mt-2" />
                            </div>
                            <div className="mb-4 flex flex-col">
                                <label htmlFor="venta_boolean" className="text-gray-700">¿Es para venta?</label>
                                <input type="checkbox" id="venta_boolean" checked={ventaBool} onChange={() => setVentaBool(!ventaBool)} className="mt-2" />
                            </div>
                        </div>
                        {CantidadLimiteCheck && (
                            <div className="mb-4 flex flex-col">
                                <label htmlFor="cantidad_limite" className="text-gray-700">¿En cuántas unidades quiere reponer el stock?</label>
                                <input 
                                onChange={(e) => setCantidadLimite(e.target.value)}
                                value={cantidadLimite}
                                id="cantidad_limite" 
                                type="number" 
                                min={0} 
                                className="mt-2 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                />
                            </div>
                        )}
                    </div>
                    {/* Botón de guardar */}
                    <div className='flex justify-center'>
                        <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
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
  );
}

export default Items;