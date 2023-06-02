import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import MainNavBar from "../orders/MainNavBar";

// import { useNavigate } from "react-router-dom";


function UpdateTypes() {
    const [type, setType] = useState("");
    const [listaType, setListaType] = useState([])
  
    const navigate = useNavigate();
    const location = useLocation();
    const typeId = location.pathname.split("/")[2];
  
      useEffect(() => {
          const fetchData = async () => {
              await axios.get('http://localhost:3001/type')
              .then(response => {
                setListaType(response.data);
                for (let i = 0; i < response.data.length; i++) {
                    if (response.data[i].typeid === Number(typeId)) {
                      setType(response.data[i].type)
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
  
    function handleTypeChange(event) {
        setType(event.target.value);
    }
    function verificarType(type) {
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
      if(verificarType() || type === "") {
        alert("Tipo con ese nombre ya agregado")
      }
      else {
        try {
            const response = await axios.put(`http://localhost:3001/type/${typeId}`, {
              type,
            });
            if (response.status === 200){
              console.log("Tipo actuzalizado")
              navigate("/type");
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
          <h1 className="text-5xl text-center">Actualizar tipo</h1>
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
        </div>
    </div>
  );
}

export default UpdateTypes;
