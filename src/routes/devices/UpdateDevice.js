import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import MainNavBar from "../orders/MainNavBar";
import SERVER from '../server'
import Select from "react-select";

function UpdateDevice() {
  const [listaBrand, setListaBrand] = useState([]);
  const [listaType, setListaType] = useState([]);
  const [listaDevice, setListaDevice] = useState([])

  const [brand, setBrand] = useState([])
  const [type, setType] = useState([])
  const [model, setModel] = useState('')

  const [defaultBrand, setDefaultBrand] = useState([])
  const [defaultType, setDefaultType] = useState([])

  const navigate = useNavigate();
  const location = useLocation();
  const deviceId = location.pathname.split("/")[2];

  useEffect(() => {
    const fetchData = async () => {
        await axios.get(`${SERVER}/brand`)
        .then(response => {
          setListaBrand(response.data);
        })
        .catch(error => {
        console.error(error);
        // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
        });
        await axios.get(`${SERVER}/type`)
        .then(response => {
          setListaType(response.data);
        })
        .catch(error => {
        console.error(error);
        // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
        });
        await axios.get(`${SERVER}/devices`)
        .then(response => {
          setListaDevice(response.data)
          const equipo = response.data.filter((equipo) => equipo.iddevices === Number(deviceId))[0]
          setDefaultBrand(equipo.brandid)
          setDefaultType(equipo.typeid)
          setModel(equipo.model)
        })
        .catch(error => {
        console.error(error);
        // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
        });
    }
    fetchData()
    // eslint-disable-next-line
    }, []);
  useEffect(() => {
    setBrand(listaBrand
        .filter(marca => marca.brandid === defaultBrand)
        .map((marca) => ({label: marca.brand, value: marca})))
        
  }, [listaBrand, defaultBrand])
  useEffect(() => {
    setType(listaType
        .filter(tipo => tipo.typeid === defaultType)
        .map((tipo) => ({label: tipo.type, value: tipo})))
        
}, [listaType, defaultType])

function verificarExistenciaDevice(array, valores) {
  return array.some((device) => {
    const boolType = device.typeid === valores.typeId
    const boolBrand = device.brandid === valores.brandId
    const boolModel = device.model === valores.model
    return boolBrand && boolType && boolModel
  })
}

  async function handleSubmit(event) {
    event.preventDefault();
    // Aquí es donde enviarías la información de inicio de sesión al servidor
    const deviceData = {
      brandId: brand[0].value.brandid,
      typeId: type[0].value.typeid,
      model: document.getElementById('model').value,
    };
    
    if (verificarExistenciaDevice(listaDevice, deviceData)) {
      return alert('Equipo con esa informacion ya creado')
    } else {
      axios.put(`${SERVER}/devices/${deviceId}`, deviceData)
        .then(data => {
          alert("Equipo actualizado correctamente")
          navigate("/device");
          // Aquí puedes hacer algo con la respuesta del backend, como mostrar un mensaje de éxito al usuario
          })
        .catch(error => {
          console.error(error);
          // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
          });
    }
  }

  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
      <MainNavBar />
      <div className='bg-white my-2 py-8 px-2 max-w-2xl mx-auto'>
        <h1 className="flex justify-center text-5xl">Actualizar equipo</h1>
        <form onSubmit={handleSubmit} className='max-w-md mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4'>
          <div className='mb-4'>
            <label htmlFor="marca" className='block text-gray-700 font-bold mb-2'>
              Marca:
            </label>
            <div className='relative'>
              <Select
              required
              id="marca"
              value={brand}
              options={ listaBrand.map((marca) => ({label: marca.brand, value: marca})) }
              placeholder='Seleccionar una marca'
              onChange={(e) => setBrand([{label: e.value.brand,value: e.value}])}
              />
            </div>
            <button className="mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => { navigate(`/brand`) }} >
                Agregar marca
            </button>
          </div>
          <div className='mb-4'>
            <label htmlFor="type" className='block text-gray-700 font-bold mb-2'>
              Tipo:
            </label>
            <div className='relative'>
              <Select
              required
              id="type"
              value={type}
              options={ listaType.map((tipo) => ({label: tipo.type, value: tipo})) }
              placeholder='Seleccionar un tipo'
              onChange={(e) => setType([{label: e.value.type, value: e.value}])}
              />
            </div>
            <button className="mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => { navigate(`/type`) }} >
                Agregar tipo
            </button>
          </div>
          <div className='mb-4'>
            <label htmlFor="model" className='block text-gray-700 font-bold mb-2'>
              Modelo:
            </label>
            <input type="text" required defaultValue={model} id="model" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" />
          </div>
          <div className='flex items-center justify-between px-10'>
            <button type="submit" className='bg-blue-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded'>
              Guardar
            </button>
            <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={() => { navigate(`/device`) }} >
                  Volver
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UpdateDevice;
