import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'
import Select from 'react-select';

function UpdateItem() {
    const [repuesto, setRepuesto] = useState([])
    const [listaRepuestos, setListaRepuestos] = useState([])
    const [listaDevice, setListaDevice] = useState([])
    const [listaCalidades, setListaCalidades] = useState([])
    const [listaNombres, setListaNombres] = useState([])
    const [listaColores, setListaColores] = useState([])
    const [listaAlmacenamientos, setListaAlmacenamientos] = useState([])
    
    const [color, setColor] = useState([]);
    const [modelos, setModelos] = useState([]);
    const [calidad, setCalidad] = useState([])
    const [nombreRepuesto, setNombreRepuesto] = useState([]);
    const [almacenamiento, setAlmacenamiento] = useState([])
    const [ventaBool, setVentaBool] = useState(false)

    const [defaultValuesModelos, setDefaultValuesModelos] = useState([])
    const [defaultValueCalidad, setDefaultValueCalidad] = useState([])
    const [defaultValueColor, setDefaultValueColor] = useState([])
    const [defaultValueNombre, setDefaultValueNombre] = useState([])
    const [defaultValueAlmacenamiento, setDefaultValueAlmacenamiento] = useState([])

    const [CantidadLimiteCheck, setCantidadLimiteCheck] = useState(false)
    const [cantidadLimite, setCantidadLimite] = useState(-1)

    const navigate = useNavigate();
    const location = useLocation();
    const itemId = location.pathname.split("/")[2];

    useEffect(() => {    
        const fetchData = async () => {
            await axios.get(`${SERVER}/stockitem`)
                .then(response => {
                    setListaRepuestos(response.data);
                    const repuesto = response.data.filter((repuesto) => repuesto.idrepuestos === Number(itemId))[0]
                    setRepuesto(repuesto)
                    setCantidadLimite(repuesto.cantidad_limite)
                    if (repuesto.cantidad_limite !== -1) {
                        setCantidadLimiteCheck(true)
                    }
                    if (repuesto.modelos_asociados.includes(',')) {
                        setDefaultValuesModelos(repuesto.modelos_asociados.split(','))
                    } else {
                        setDefaultValuesModelos([repuesto.modelos_asociados])
                    }
                    setDefaultValueCalidad(repuesto.calidad_repuestos_id)
                    setDefaultValueNombre(repuesto.nombre_repuestos_id)
                    setDefaultValueColor(repuesto.color_id)
                    setDefaultValueAlmacenamiento(repuesto.almacenamiento_repuestos_id)
                    if (repuesto.venta === 1) {
                        setVentaBool(true)
                    }
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
        }
        fetchData()
        // eslint-disable-next-line
    }, []);
    useEffect(() => {
        setColor(listaColores
            .filter(color => color.colores_id === defaultValueColor)
            .map((color) => ({label: color.color, value: color})))
            
    }, [listaColores, defaultValueColor])
    useEffect(() => {
        setAlmacenamiento(listaAlmacenamientos
            .filter(almacenamiento => almacenamiento.almacenamientos_repuestos_id === defaultValueAlmacenamiento)
            .map((almacenamiento) => ({label: almacenamiento.almacenamiento_repuestos, value: almacenamiento})))
            
    }, [listaAlmacenamientos, defaultValueAlmacenamiento])
    useEffect(() => {
        setModelos(listaDevice
            .filter(equipo => defaultValuesModelos.includes(equipo.iddevices.toString()))
            .map((equipo) => ({label: equipo.model, value: equipo})))
    }, [listaDevice, defaultValuesModelos])
    useEffect(() => {
        setCalidad(listaCalidades
            .filter(calidad => calidad.calidades_repuestos_id === defaultValueCalidad)
            .map((calidad) => ({label: calidad.calidad_repuestos, value: calidad})))
    }, [listaCalidades, defaultValueCalidad])
    useEffect(() => {
        setNombreRepuesto(listaNombres
            .filter(nombre => nombre.nombres_repuestos_id === defaultValueNombre)
            .map((nombre) => ({label: nombre.nombre_repuestos, value: nombre})))
    }, [listaNombres, defaultValueNombre])

    function verificarEquivalencia(diccionario1, diccionario2) {
        const boolVenta = diccionario1.venta === diccionario2.venta
        const boolCantidadLimite = diccionario1.cantidad_limite === diccionario2.cantidad_limite
        const boolColorId = diccionario1.color_id === diccionario2.color_id
        const boolCalidadId = diccionario1.calidad_repuestos_id === diccionario2.calidad_repuestos_id
        const boolModelosAsociados =diccionario1.modelos_asociados === diccionario2.modelos_asociados
        const boolNombreId = diccionario1.nombre_repuestos_id === diccionario2.nombre_repuestos_id
        const boolAlmacenamiento = diccionario1.almacenamiento_repuestos_id === diccionario2.almacenamiento_repuestos_id
        return boolVenta && boolCantidadLimite && boolColorId && boolCalidadId && boolModelosAsociados && boolNombreId && boolAlmacenamiento
    }
 
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
            item = `${item} ${nombreRepuesto[0].value.nombre_repuestos}`
            productoValues.nombre_repuestos_id = nombreRepuesto[0].value.nombres_repuestos_id
        } else {
            productoValues.nombre_repuestos_id = null
        }
        if (calidad[0]) {
            item = `${item} ${calidad[0].value.calidad_repuestos}`
            productoValues.calidad_repuestos_id = calidad[0].value.calidades_repuestos_id
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
            item = `${item} ${almacenamiento[0].value.almacenamiento_repuestos}`
            productoValues.almacenamiento_repuestos_id = almacenamiento[0].value.almacenamientos_repuestos_id
        } else {
            productoValues.almacenamiento_repuestos_id = null
        }
        if (color[0]) {
            item = `${item} ${color[0].value.color}`
            productoValues.color_id = color[0].value.colores_id
        } else {
            productoValues.color_id = null
        }
        // nombres_repuestos_id, calidades_repuestos_id, color_id
        if (CantidadLimiteCheck) {
            productoValues.cantidad_limite = parseInt(document.getElementById('cantidad_limite').value)
        } else {
            productoValues.cantidad_limite = -1
        }
        productoValues.modelos_asociados = modelIdArr.join(',')
        productoValues.array_modelos = modelIdArr
        productoValues.repuesto = item

        if (verificarEquivalencia(productoValues, repuesto)) {
            return alert("Modificar algun valor para actualizar")
        } else if (verificarExistencia(listaRepuestos, 'repuesto',item) && item !== repuesto.repuesto) {
            return alert("Repuesto con ese nombre ya agregado")
        } else {
            if (productoValues.modelos_asociados !== repuesto.modelos_asociados) {
                productoValues['cambiar_modelos'] = true
            } else {
                productoValues['cambiar_modelos'] = false
            }
            try {
                /*
                repuesto
                cantidad_limite
                nombre_repuestos_id
                calidad_repuestos_id
                color_id
                almacenamiento_repuestos_id
                venta
                array_modelos
                modelos_asociados
                cambiar_modelos
                */
                const response = await axios.put(`${SERVER}/stockitem/${itemId}`, productoValues);
                if(response.status === 200){
                    alert("Repuesto actualizado")
                    window.location.reload();
                }
            } catch (error) {
                alert(error.response.data)
            }
        }
    }

    return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <div className='bg-white m-2 py-8 px-2'>
            <h1 className="text-2xl font-bold text-center">
                Editar producto
            </h1>
            <div className="p-4 max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="mb-4">
                    {/* Formulario del nombre del producto */}
                    <div className='grid grid-cols-1 md:grid-cols-2 mb-4'>
                        {/* Nombre del repuesto */}
                        <div className="mb-2">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="repuesto">
                                Nombre del repuesto:
                            </label>
                            <Select
                            value={nombreRepuesto}
                            options={ listaNombres.map((nombreRepuestos) => ({label: nombreRepuestos.nombre_repuestos, value: nombreRepuestos})) }
                            placeholder='Nombre Repuesto'
                            onChange={(selectedOption, actionMeta) => {
                                if (actionMeta.action === 'clear') {
                                // El usuario ha deseleccionado
                                setNombreRepuesto([]); // o lo que sea apropiado para tu caso
                                } else {
                                // El usuario ha seleccionado
                                setNombreRepuesto(selectedOption ? [{label: selectedOption.value.nombre_repuestos, value: selectedOption.value}] : []);
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
                        {/* Calidad del repuesto */}
                        <div className="mb-2">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="calidad">
                                Calidad:
                            </label>
                            <Select
                            value={calidad}
                            options={ listaCalidades.map((calidad) => ({label: calidad.calidad_repuestos, value: calidad})) }
                            placeholder='Seleccionar calidad'
                            onChange={(selectedOption, actionMeta) => {
                                if (actionMeta.action === 'clear') {
                                // El usuario ha deseleccionado
                                setCalidad([]); // o lo que sea apropiado para tu caso
                                } else {
                                // El usuario ha seleccionado
                                setCalidad(selectedOption ? [{label: selectedOption.value.calidad_repuestos, value: selectedOption.value}] : []);
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
                        {/* Modelos del repuesto */}
                        <div className="mb-2">
                            <label htmlFor="options" className="block text-gray-700 font-bold mb-2">
                                Selecciona Modelos:
                            </label>
                            <Select 
                            required
                            options={ listaDevice.map((equipo) => ({label: equipo.model, value: equipo})) }
                            placeholder='Equipos'
                            value={modelos}
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
                            value={almacenamiento}
                            options={ listaAlmacenamientos.map((almacenamiento) => ({label: almacenamiento.almacenamiento_repuestos, value: almacenamiento})) }
                            placeholder='Almacenamiento'
                            onChange={(selectedOption, actionMeta) => {
                                if (actionMeta.action === 'clear') {
                                // El usuario ha deseleccionado
                                setAlmacenamiento([]); // o lo que sea apropiado para tu caso
                                } else {
                                // El usuario ha seleccionado
                                setAlmacenamiento(selectedOption ? [{label: selectedOption.value.almacenamiento_repuestos, value: selectedOption.value}] : []);
                                }
                            }}
                            isClearable={true}
                            />
                            <button 
                            type="button" 
                            onClick={ () => { navigate('/almacenamientoRepuestos') }}
                            className=" mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline">
                                Agregar Almacenamiento 
                            </button>
                        </div>
                        {/* Color del repuesto */}
                        <div className="mb-2">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="color">
                                Color:
                            </label>
                            <Select
                                value={color}
                                options={listaColores.map((color) => ({ label: color.color, value: color }))}
                                placeholder='Seleccionar color'
                                onChange={(selectedOption, actionMeta) => {
                                    if (actionMeta.action === 'clear') {
                                    // El usuario ha deseleccionado
                                    setColor([]); // o lo que sea apropiado para tu caso
                                    } else {
                                    // El usuario ha seleccionado
                                    setColor(selectedOption ? [{label: selectedOption.value.color, value: selectedOption.value}] : []);
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
                                <input type="checkbox" id="stock_boolean" checked={CantidadLimiteCheck} onClick={() => setCantidadLimiteCheck(!CantidadLimiteCheck)} className="mt-2" />
                            </div>
                            <div className="mb-4 flex flex-col">
                                <label htmlFor="venta_boolean" className="text-gray-700">¿Es para venta?</label>
                                <input type="checkbox" id="venta_boolean" checked={ventaBool} onClick={() => setVentaBool(!ventaBool)} className="mt-2" />
                            </div>
                        </div>
                        {CantidadLimiteCheck && (
                            <div className="mb-4 flex flex-col">
                                <label htmlFor="cantidad_limite" className="text-gray-700">¿En cuántas unidades quiere reponer el stock?</label>
                                <input 
                                onChange={(e) => setCantidadLimite(e.value)}
                                value={cantidadLimite}
                                id="cantidad_limite" 
                                type="number" 
                                min={0} 
                                className="mt-2 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
        </div>
    </div>
  );
}

export default UpdateItem;