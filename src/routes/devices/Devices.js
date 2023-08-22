import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MainNavBar from "../orders/MainNavBar";
import SERVER from '../server'

function Devices() {
  const [brand, setBrand] = useState([]);
  const [type, setType] = useState([]);
  const [listaDevice, setListaDevice] = useState([])
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
        await axios.get(`${SERVER}/devices`)
        .then(response => {
          setListaDevice(response.data);
        })
        .catch(error => {
        console.error(error);
        // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
        });

        await axios.get(`${SERVER}/brand`)
        .then(response => {
          setBrand(response.data);
        })
        .catch(error => {
        console.error(error);
        // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
        });

        await axios.get(`${SERVER}/type`)
        .then(response => {
          setType(response.data);
        })
        .catch(error => {
        console.error(error);
        // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
        });
    }
    fetchData()
    
    }, []);


  async function handleSubmit(event) {
    event.preventDefault();
    // Aquí es donde enviarías la información de inicio de sesión al servidor
    const formData = new FormData(event.target);
    const deviceData = {
      brandId: formData.get('marca'),
      typeId: formData.get('type'),
      model: formData.get('model'),
    };

    await axios.post(`${SERVER}/devices`, deviceData)
      .then(data => {
        alert("Equipo agregado correctamente")
        window.location.reload();
        // Aquí puedes hacer algo con la respuesta del backend, como mostrar un mensaje de éxito al usuario
        })
      .catch(error => {
        console.error(error);
        // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
        });
  }

  const eliminarElemento = async (id) => {
    try {        
        await axios.delete(`${SERVER}/devices/${id}`)
        alert("Equipo eliminado correctamente")
        window.location.reload();
    } catch (error) {
        console.error(error)
    }
  }

  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
      <MainNavBar />
      <div className='bg-white my-2 py-8 px-2 max-w-2xl mx-auto'>
        <h1 className="text-center text-5xl">Agregar equipo</h1>
        <form onSubmit={handleSubmit} className='max-w-xl mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4'>
          <div className='mb-4'>
            <label htmlFor="type" className='block text-gray-700 font-bold mb-2'>
              Marca:
            </label>
            <div className='relative'>
              <select name="marca" defaultValue="" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline">
                <option value="" disabled >Seleccionar una marca</option>
                {brand.map((brand) => (
                  <option key={brand.brandid} value={brand.brandid}>{brand.brand}</option>
                ))}
              </select>
              <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700'>
                <svg className='fill-current h-4 w-4' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><path d='M10 12a2 2 0 100-4 2 2 0 000 4z'/></svg>
              </div>
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
              <select name="type" defaultValue="" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline">
                <option value="" disabled >Seleccionar un tipo</option>
                {type.map(type => (
                  <option key={type.typeid} value={type.typeid}>{type.type}</option>
                ))}
              </select>
              <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700'>
                <svg className='fill-current h-4 w-4' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'><path d='M10 12a2 2 0 100-4 2 2 0 000 4z'/></svg>
              </div>
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
            <input type="text" name="model" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" />
          </div>

          <div className='flex items-center justify-center px-10'>
            <button type="submit" className='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded'>
              Guardar
            </button>
          </div>
        </form>
        <div className="flex justify-center">
          {/* Tabla para dispositivos de tamanio sm y mayor */}
          <table className="table-auto hidden sm:block">
            <thead>
              <tr>
                <th className="px-4 py-2">Marca</th>
                <th className="px-4 py-2">Tipo</th>
                <th className="px-4 py-2">Modelo</th>
              </tr>
            </thead>
            <tbody>
              {listaDevice.map(device => (
                <tr key={device.iddevices}>
                  <td className="border px-4 py-2" value={device.brand}>{device.brand}</td>
                  <td className="border px-4 py-2" value={device.type}>{device.type}</td>
                  <td className="border px-4 py-2" value={device.model}>{device.model}</td>
                  <td>
                    <button className="bg-red-500 border px-4 py-2 color" onClick={() => eliminarElemento(device.iddevices)}>Eliminar</button>
                  </td>
                  <td>
                    <button className="bg-green-500 border px-4 py-2 color"
                    onClick={() => { navigate(`/updateDevice/${device.iddevices}`) }} >
                        Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Tabla colapsable para dispositivos pequeños */}
          <div className="sm:hidden">
            {listaDevice.map(equipo => (
                <details key={equipo.order_id} className="border mb-1 rounded">
                    <summary className="px-4 py-2 cursor-pointer outline-none">
                      {equipo.brand} {equipo.type} {equipo.model}
                    </summary>
                    <div className=" bg-gray-100">
                      <button className="bg-red-500 border px-4 py-2 color" 
                      onClick={() => eliminarElemento(equipo.iddevices)}>
                        Eliminar
                      </button>
                      <button className="bg-green-500 border px-4 py-2 color"
                      onClick={() => { navigate(`/updateDevice/${equipo.iddevices}`) }} >
                          Editar
                      </button>
                    </div>
                </details>
            ))}
        </div>
        </div>
      </div>
    </div>
  );
}

export default Devices;
