import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'
import Select from 'react-select';

function UpdateItem() {

    const [repuesto, setRepuestos] = useState([]);
    const [color, setColor] = useState("");
    const [listaRepuestos, setListaRepuestos] = useState([])
    const [CantidadLimite, setCantidadLimite] = useState('')
    const [repuestos, setRepuesto] = useState([]);
    
    const [listaDevice, setListaDevice] = useState([])
    const CALIDADES = [
        "Original",
        "Usado",
        "Generico"
    ]
    const [modelos, setModelos] = useState([]);
    
    const navigate = useNavigate();
    const location = useLocation();
    const itemId = location.pathname.split("/")[2];
    const [selectDefault, setSelectDefault] = useState([])

    useEffect(() => {
        
        const fetchData = async () => {
            await axios.get(`${SERVER}/stockitem`)
                .then(response => {
                    setListaRepuestos(response.data);
                    for (let i = 0; i < response.data.length; i++) {
                        if (response.data[i].idrepuestos === Number(itemId)) {
                            setRepuestos(response.data[i].repuesto)
                            setRepuesto(response.data[i].repuesto)
                            if (response.data[i].cantidad_limite !== -1) {
                                setCantidadLimiteCheck(true)
                                setTimeout(() => {
                                    document.getElementById('cantidad_limite').value = response.data[i].cantidad_limite
                                }, 200);
                            }
                            setSelectDefault(response.data[i].modelos_asociados.split(','))
                            setCantidadLimite(response.data[i].cantidad_limite)
                        }
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
        }
        fetchData()
        // eslint-disable-next-line
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
        let cantidad_limite
        if (CantidadLimiteCheck) {
            cantidad_limite = parseInt(document.getElementById('cantidad_limite').value)
        } else {
            cantidad_limite = -1
        }
        if (repuestos === repuesto && CantidadLimite === cantidad_limite) {
            alert("Modifique algun campo para continuar")
        } else if (verificarRepuesto(repuesto) && repuesto !== repuestos) {
            alert("Repuesto con ese nombre ya ingresado")
        } else {
            try {           
                const response = await axios.put(`${SERVER}/stockItem/${itemId}`, {
                    repuesto,
                    cantidad_limite
                });
                if(response.status === 200){
                    alert("Repuesto modificado")
                    navigate("/items");
                }
            } catch (error) {
                alert(error.response.data)
            }     
        }
    }
    const [CantidadLimiteCheck, setCantidadLimiteCheck] = useState(false)

    const preselectedOptions = listaDevice
        .filter(equipo => selectDefault.includes(equipo.iddevices.toString()))
        .map((equipo) => ({label: equipo.model, value: equipo}));

    return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <div className='bg-white m-2 py-8 px-2'>
            <h1 className="text-2xl font-bold text-center">Editar producto</h1>
            <div>
                {/* Texto explicativo */}
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
                        <div className='flex flex-col justify-center mb-4'>
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
                                        <option key={item} id={item} value={item}>{item}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-2">
                                <label htmlFor="options" className="block text-gray-700 font-bold mb-2">Selecciona Modelos:</label>
                                {preselectedOptions.length > 0 ? (
                                    <Select 
                                    required
                                    options={ listaDevice.map((equipo) => ({label: equipo.model, value: equipo})) }
                                    placeholder='Equipos'
                                    isMulti
                                    defaultValue={ preselectedOptions }
                                    onChange={(e) => setModelos(e)}
                                    />
                                ) : (
                                    <p>No hay modelos preseleccionados</p>
                                )}
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
            </div>
        </div>
    </div>
  );
}

export default UpdateItem;