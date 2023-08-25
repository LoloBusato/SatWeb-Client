import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MainNavBar from "../orders/MainNavBar";
import SERVER from '../server'

function AgregarNombreRepuestos() {
    const [nombreRepuestos, setNombreRepuestos] = useState("");
    const [listaNombresRepuestos, setListaNombresRepuestos] = useState([])
  
    const navigate = useNavigate();
  
    useEffect(() => {
        const fetchData = async () => {
            await axios.get(`${SERVER}/nombresRepuestos`)
            .then(response => {
            setListaNombresRepuestos(response.data);
            })
            .catch(error => {
            console.error(error);
            });
        }
        fetchData()
    }, []);

    function verificarExistencia(nombreRepuestos) {
        return listaNombresRepuestos.some(nombres => nombres.nombre_repuestos.trim().toLowerCase() === nombreRepuestos.trim().toLowerCase())
    }
  
    async function handleSubmit(event) {
      event.preventDefault();
      if(verificarExistencia(nombreRepuestos) || nombreRepuestos === "") {
        return alert("Nombre ya agregado")
      } else {
        try {
            const response = await axios.post(`${SERVER}/nombresRepuestos`, {
                nombreRepuestos: nombreRepuestos.trim(),
            });
            if (response.status === 200){
                alert("Nombre de repuesto agregado")
                window.location.reload();
            }
          } catch (error) {
            alert(error.response.data);
          }
      }
    }

  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <div className='bg-white my-2 py-8 px-2 max-w-2xl mx-auto'>
          <h1 className="text-center text-5xl">Agregar Nombre de Repuesto</h1>
          <div className="p-4 max-w-md mx-auto">
              <form onSubmit={handleSubmit} className="mb-4">
                  <div className="mb-2">
                        <label 
                        className="block text-gray-700 font-bold mb-2" 
                        htmlFor="nombreRepuestos">
                            Tipo:
                        </label>
                        <input 
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                            type="text" 
                            id="nombreRepuestos" 
                            placeholder="Bateria / Pantalla"
                            value={nombreRepuestos} 
                            onChange={(e) => setNombreRepuestos(e.target.value)} 
                        />
                  </div>
                      <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        Guardar
                      </button>
                      <button 
                          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                          onClick={() => { navigate('/home') }} >
                              Volver
                      </button>
              </form>
          </div>
          <div className="mx-10 p-4 flex flex-wrap justify-between">
              {listaNombresRepuestos.map(nombreRepuestos => (
                    <div key={nombreRepuestos.nombres_repuestos_id} className="max-w-sm flex justify-between pr-2 border-b w-full md:w-1/3">
                        <h3 className="text-gray-900">{nombreRepuestos.nombre_repuestos}</h3>
                        <button 
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        onClick={() => { navigate(`/actualizarNombresRepuestos/${nombreRepuestos.nombres_repuestos_id}`) }} >
                                Editar
                        </button>
                    </div>
              ))}
          </div>
        </div>
    </div>
  );
}

export default AgregarNombreRepuestos