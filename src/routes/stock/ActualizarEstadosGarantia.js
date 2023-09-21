import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'
import { ChromePicker } from 'react-color';

function ActualizarEstadosGarantia() {

    const [listaEstados, setListaEstados] = useState([]);
    const [originalEstado, setOriginalEstado] = useState([])
    const [color, setColor] = useState('#ffffff');

    const navigate = useNavigate();
    
    const location = useLocation();
    const estadoId = location.pathname.split("/")[2];

    useEffect(() => {
        axios.get(`${SERVER}/estadoGarantia`)
          .then(response => {
            setListaEstados(response.data);
            const originalEstado = response.data.filter((estado) => estado.idgarantia_estados === estadoId)[0]
            setOriginalEstado(originalEstado)
            setColor(originalEstado.estado_color)
            document.getElementById('nombre').value = originalEstado.estado_nombre
          })
          .catch(error => {
            console.error(error);
          });
        // eslint-disable-next-line
    }, []);

    function verificarExistencia(array, valores) {
        return array.some((device) => {
          const boolNombre = device.estado_nombre === valores.nombre
          const boolColor = device.estado_color === valores.color
          return boolNombre && boolColor
        })
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const EstadoValues = {
        nombre: document.getElementById('nombre').value,
        color,
        };
        try {        
            if(originalEstado === EstadoValues) {
                return alert('Modificar valores')
            }
            if (verificarExistencia(listaEstados, EstadoValues)) {
                const response = await axios.put(`${SERVER}/estadoGarantia/${estadoId}`, EstadoValues);
                if(response.status === 200){
                    alert("Estado actualizado")
                    navigate('/agregarEstadoGarantia')
                }
            } else {
                return alert('Estado con esos valores ya creado')
            }
        } catch (error) {
            alert(error)
        }
    }

  return (
    <div className="bg-gray-300 min-h-screen pb-2">
      <MainNavBar />
      <div className='bg-white m-2 py-8 px-2'>
        <h1 className="text-2xl font-bold text-center">Actualizar estado de garantia</h1>
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
        </div>
      </div>
    </div>
  );
}

export default ActualizarEstadosGarantia;
