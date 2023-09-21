import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'
import { ChromePicker } from 'react-color';

function AgregarEstadosGarantia() {

    const [listaEstados, setListaEstados] = useState([]);
    const [color, setColor] = useState('#ffffff');

    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`${SERVER}/estadoGarantia`)
          .then(response => {
            setListaEstados(response.data);
          })
          .catch(error => {
            console.error(error);
          });
      }, []);

    async function handleSubmit(event) {
        event.preventDefault();

        const EstadoValues = {
        nombre: document.getElementById('nombre').value,
        color,
        };
        try {        
            const response = await axios.post(`${SERVER}/estadoGarantia`, EstadoValues);
            if(response.status === 200){
                alert("Estado agregado")
                window.location.reload();
            }
        } catch (error) {
            alert(error)
        }
    }

  return (
    <div className="bg-gray-300 min-h-screen pb-2">
      <MainNavBar />
      <div className='bg-white m-2 py-8 px-2'>
        <h1 className="text-2xl font-bold text-center">Agregar estado de garantia</h1>
        <div className='p-4 max-w-4xl mx-auto'>
          <form onSubmit={handleSubmit} className="mb-4">
            <div className="flex flex-col mb-4">
              <label htmlFor="nombre" className="block text-gray-700 font-bold mb-2">
                Nombre estado: *
              </label>
              <input
                required
                type="text"
                id="nombre"
                className="mt-2 border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className='flex flex-col mb-4'>
              <p className="block text-gray-700 font-bold mb-2">Seleccionar color: *</p>
              <div className='flex'>
                <ChromePicker color={color} onChange={(color) => setColor(color.hex)} />
                <div style={{ marginLeft: '10px', backgroundColor: color, width: '40px', height: '40px' }} />        
              </div>
            </div>
            <div className='flex items-center justify-center'>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded" >
                Guardar
                </button>
            </div>
          </form>
          <div className="flex justify-center mb-10">
            {/* Tabla para dispositivos de tamanio sm y mayor */}
            <table className="table-auto hidden md:block">
                <thead>
                    <tr>
                    <th className="px-4 py-2">Nombre</th>
                    <th className="px-4 py-2">Color</th>
                    </tr>
                </thead>
                <tbody>
                {listaEstados.map((estado) => (
                    <tr key={estado.idgarantia_estados}>
                        <td className="border px-4 py-2 font-bold">{estado.estado_nombre}</td>
                        <td className="border px-4 py-2">
                          <div style={{ marginLeft: '10px', backgroundColor: estado.estado_color, width: '40px', height: '40px' }} />
                        </td>
                        <td>
                            <button className="bg-green-500 hover:bg-green-700 border px-4 py-2 color"
                            onClick={() => { navigate(`/actualizarEstadoGarantia/${estado.idgarantia_estados}`) }} >
                              Editar
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {/* Tabla colapsable para dispositivos pequeños */}
            <div className="md:hidden">
                {listaEstados.map(estado => (
                  <details key={estado.idgarantia_estados} className="border mb-1 rounded">
                    <summary className="px-4 py-2 cursor-pointer outline-none">
                      {estado.estado_nombre}
                    </summary>
                    <div className=" bg-gray-100">
                      <div className='flex flex-col'>
                        <p className="border px-4 py-2 font-bold">Nombre: {estado.estado_nombre}</p>
                        <p className="border px-4 py-2">Color:</p>
                        <div style={{ marginLeft: '10px', backgroundColor: estado.estado_color, width: '40px', height: '40px' }} />
                        <button className="bg-green-500 hover:bg-green-700 border px-4 py-2 color"
                        onClick={() => { navigate(`/updateSupplier/${estado.idgarantia_estados}`) }} >
                          Editar
                        </button>
                      </div>
                    </div>
                  </details>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgregarEstadosGarantia;
