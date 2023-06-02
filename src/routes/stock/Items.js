import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';

function Items() {

    const [repuesto, setRepuestos] = useState([]);
    const [listaRepuestos, setListaRepuestos] = useState([])

    const navigate = useNavigate();

    useEffect(() => {
        axios.get('http://localhost:3001/stock/item')
          .then(response => {
            setListaRepuestos(response.data);
          })
          .catch(error => {
            console.error(error);
            // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
          });
      }, []);

    function handleRepuestosChange(event) {
        setRepuestos(event.target.value);
      }

    function verificarRepuesto(repuesto) {
        for (let i = 0; i < listaRepuestos.length; i++) {
            if (listaRepuestos[i].repuesto === repuesto) {
            return true;
            }
        }
        return false;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (verificarRepuesto(repuesto)) {
            alert("Repuesto con ese nombre ya agregado")
        } else {
            try {        
                const response = await axios.post(`http://localhost:3001/stock/item`, {
                    repuesto
                });
                if(response.status === 200){
                    console.log("Repuesto agregado")
                    window.location.reload();
                }
            } catch (error) {
                alert(error.response.data)
            }     
        }
    }

  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <div className='bg-white m-2 py-8 px-2'>
            <div className="text-center">
                <h1 className="text-2xl font-bold">Agregar producto</h1>
            </div>
            <div className=''>
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
                <div className="p-4 max-w-md mx-auto">
                    <form onSubmit={handleSubmit} className="mb-4">
                        <div className="mb-2">
                        <label className="block text-gray-700 font-bold mb-2" htmlFor="repuesto">Nombre del repuesto:</label>
                        <input 
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                            type="text" 
                            id="repuesto" 
                            value={repuesto} 
                            onChange={handleRepuestosChange} 
                        />
                        </div>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        Guardar
                        </button>
                    </form>
                </div>
                <div className="mx-10 p-4 flex flex-wrap justify-between">
                    {listaRepuestos.map(repuesto => (
                        <div key={repuesto.idrepuestos} className="max-w-sm flex items-center py-2 border-b w-full md:w-1/2">
                        <h3 className="text-gray-900 leading-tight flex-1">{repuesto.repuesto}</h3>
                        <button 
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        onClick={() => { navigate(`/updateItem/${repuesto.idrepuestos}`) }} >
                            Editar
                        </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}

export default Items;