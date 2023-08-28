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
    
    const [color, setColor] = useState([]);
    const [modelos, setModelos] = useState([]);
    const [calidad, setCalidad] = useState([])
    const [nombreRepuesto, setNombreRepuesto] = useState([]);



    const [defaultValuesModelos, setDefaultValuesModelos] = useState([])
    const [defaultValueCalidad, setDefaultValueCalidad] = useState([])
    const [defaultValueColor, setDefaultValueColor] = useState([])
    const [defaultValueNombre, setDefaultValueNombre] = useState([])

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
                    console.log(repuesto)
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
            
    }, [listaColores])
    useEffect(() => {
        setModelos(listaDevice
            .filter(equipo => defaultValuesModelos.includes(equipo.iddevices.toString()))
            .map((equipo) => ({label: equipo.model, value: equipo})))
    }, [listaDevice])
    useEffect(() => {
        setCalidad(listaCalidades
            .filter(calidad => calidad.calidades_repuestos_id === defaultValueCalidad)
            .map((calidad) => ({label: calidad.calidad_repuestos, value: calidad})))
    }, [listaCalidades])
    useEffect(() => {
        setNombreRepuesto(listaNombres
            .filter(nombre => nombre.nombres_repuestos_id === defaultValueNombre)
            .map((nombre) => ({label: nombre.nombre_repuestos, value: nombre})))
    }, [listaNombres])

    function verificarExistencia(array, nombreColumna, valor) {
        return array.some(valorArray => valorArray[nombreColumna].trim().toLowerCase() === valor.trim().toLowerCase())
    }

    async function handleSubmit(event) {
        event.preventDefault();
        let item = `${nombreRepuesto.nombre_repuestos} ${calidad.calidad_repuestos} ${color.color}`
        const modelIdArr = [];
        modelos.forEach((modelo) => {
            modelIdArr.push(modelo.value.iddevices)
            item = `${item} ${modelo.label}`
        })
        /*
        // nombres_repuestos_id, calidades_repuestos_id, colores_id
        if (verificarExistencia(listaRepuestos, repuesto, item)) {
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
                    nombre_repuestos_id: nombreRepuesto.nombres_repuestos_id,
                    calidad_repuestos_id: calidad.calidades_repuestos_id,
                    colores_id: color.colores_id,
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
        */
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
                    <div className='grid grid-cols-1 sm:grid-cols-2 mb-4'>
                        {/* Nombre del repuesto */}
                        <div className="mb-2">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="repuesto">
                                Nombre del repuesto:
                            </label>
                            <Select
                            required
                            value={nombreRepuesto}
                            options={ listaNombres.map((nombreRepuestos) => ({label: nombreRepuestos.nombre_repuestos, value: nombreRepuestos})) }
                            placeholder='Nombre Repuesto'
                            onChange={(e) => setNombreRepuesto([{label: e.value.nombre_repuestos, value: e.value}])}
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
                            required
                            value={calidad}
                            options={ listaCalidades.map((calidad) => ({label: calidad.calidad_repuestos, value: calidad})) }
                            placeholder='Seleccionar calidad'
                            onChange={(e) => setCalidad([{label: e.value.calidad_repuestos, value: e.value}])}
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
                        {/* Color del repuesto */}
                        <div className="mb-2">
                            <label className="block text-gray-700 font-bold mb-2" htmlFor="color">
                                Color:
                            </label>
                            <Select
                                required
                                value={color}
                                options={listaColores.map((color) => ({ label: color.color, value: color }))}
                                placeholder='Seleccionar color'
                                onChange={(e) => setColor([{label: e.value.color, value:e.value}])}
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
                        <div className="mb-4 flex flex-col">
                            <label htmlFor="stock_boolean" className="text-gray-700">¿Quiere tener una cierta cantidad en stock?</label>
                            <input type="checkbox" id="stock_boolean" value={CantidadLimiteCheck} onClick={() => setCantidadLimiteCheck(!CantidadLimiteCheck)} className="mt-2" />
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