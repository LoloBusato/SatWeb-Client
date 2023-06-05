import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MainNavBar from "../orders/MainNavBar";
import SERVER from '../server'

// import { useNavigate } from "react-router-dom";


function Types() {
    const [type, setType] = useState("");
    const [listaType, setListaType] = useState([])
  
    const navigate = useNavigate();
  
      useEffect(() => {
          const fetchData = async () => {
              await axios.get(`${SERVER}/type`)
              .then(response => {
                setListaType(response.data);
              })
              .catch(error => {
              console.error(error);
              // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
              });
          }
          fetchData()
          }, []);
  
    function handleTypeChange(event) {
        setType(event.target.value);
    }
    function verificarBrand(type) {
      for (let i = 0; i < listaType.length; i++) {
          if (listaType[i].type === type) {
          return true;
          }
      }
      return false;
    }
  
    async function handleSubmit(event) {
      event.preventDefault();
      // Aquí es donde enviarías la información de inicio de sesión al servidor
      if(verificarBrand() || type === "") {
        alert("Tipo con ese nombre ya agregado")
      }
      else {
        try {
            const response = await axios.post(`${SERVER}/type`, {
              type,
            });
            if (response.status === 200){
              console.log("Tipo agregada")
              window.location.reload();
              // navigate('/home')
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
          <h1 className="text-center text-5xl">Agregar tipo</h1>
          <div className="p-4 max-w-md mx-auto">
              <form onSubmit={handleSubmit} className="mb-4">
                  <div className="mb-2">
                      <label className="block text-gray-700 font-bold mb-2" htmlFor="repuesto">Tipo:</label>
                      <input 
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                        type="text" 
                        id="repuesto" 
                        placeholder="iPhone"
                        value={type} 
                        onChange={handleTypeChange} 
                      />
                  </div>
                      <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        Guardar
                      </button>
                      <button 
                          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                          onClick={() => { navigate(`/device`) }} >
                              Volver
                      </button>
              </form>
          </div>
          <div className="mx-10 p-4 flex flex-wrap justify-between">
              {listaType.map(type => (
                  <div key={type.typeid} className="max-w-sm flex justify-between pr-2 border-b w-full md:w-1/3">
                  <h3 className="text-gray-900">{type.type}</h3>
                  <button 
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  onClick={() => { navigate(`/updateType/${type.typeid}`) }} >
                        Editar
                  </button>
                  </div>
              ))}
          </div>
        </div>
    </div>
  );
}

export default Types;
