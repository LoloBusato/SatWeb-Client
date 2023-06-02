import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import MainNavBar from "../orders/MainNavBar";

function UpdateDevice() {
  const [brand, setBrand] = useState([]);
  const [type, setType] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const deviceId = location.pathname.split("/")[2];


  useEffect(() => {
    const fetchData = async () => {

        await axios.get('http://localhost:3001/brand')
        .then(response => {
          setBrand(response.data);
        })
        .catch(error => {
        console.error(error);
        // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
        });

        await axios.get('http://localhost:3001/type')
        .then(response => {
          setType(response.data);
        })
        .catch(error => {
        console.error(error);
        // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
        });

        await axios.get('http://localhost:3001/devices')
        .then(response => {
          for (let i = 0; i < response.data.length; i++) {
            if (response.data[i].iddevices === Number(deviceId)) {
              document.getElementById("marca").value = response.data[i].brand;
              document.getElementById("type").value = response.data[i].type;
              document.getElementById("model").value = response.data[i].model;
            }
          }
        })
        .catch(error => {
        console.error(error);
        // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
        });
    }
    fetchData()
    // eslint-disable-next-line
    }, []);


  async function handleSubmit(event) {
    event.preventDefault();
    // Aquí es donde enviarías la información de inicio de sesión al servidor
    const formData = new FormData(event.target);
    const deviceData = {
      brand: formData.get('marca'),
      type: formData.get('type'),
      model: formData.get('model'),
    };

    axios.put(`http://localhost:3001/devices/${deviceId}`, deviceData)
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

  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
      <MainNavBar />
      <div className='bg-white my-2 py-8 px-2 max-w-2xl mx-auto'>
        <h1 className="flex justify-center text-5xl">Actualizar equipo</h1>
        <form onSubmit={handleSubmit} className='max-w-md mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4'>
          
          <div className='mb-4'>
            <label htmlFor="type" className='block text-gray-700 font-bold mb-2'>
              Marca:
            </label>
            <div className='relative'>
              <select name="marca" id="marca" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline">
                <option value="" disabled selected>Seleccionar una marca</option>
                {brand.map((brand) => (
                  <option key={brand.brandid} value={brand.brand}>{brand.brand}</option>
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
              <select name="type" id="type" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline">
                <option value="" disabled selected>Seleccionar un tipo</option>
                {type.map(type => (
                  <option key={type.typeid} value={type.type}>{type.type}</option>
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
            <input type="text" name="model" id="model" className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline" />
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
