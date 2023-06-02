import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';

function UpdateItem() {

    const [repuesto, setRepuestos] = useState([]);
    const [listaRepuestos, setListaRepuestos] = useState([])

    
    const navigate = useNavigate();
    const location = useLocation();
    const itemId = location.pathname.split("/")[2];

    useEffect(() => {
        axios.get('http://localhost:3001/stock/item')
          .then(response => {
            setListaRepuestos(response.data);
            for (let i = 0; i < response.data.length; i++) {
                if (response.data[i].idrepuestos === Number(itemId)) {
                    setRepuestos(response.data[i].repuesto)
                }
            }
          })
          .catch(error => {
            console.error(error);
            // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
        });
        // eslint-disable-next-line
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
                const response = await axios.put(`http://localhost:3001/stock/item/${itemId}`, {
                    repuesto
                });
                if(response.status === 200){
                    console.log("Repuesto modificado")
                    navigate("/items");
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
            <h1 className="text-2xl font-bold text-center">Editar producto</h1>
            <div>
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
                        <div className='flex justify-between px-10'>
                            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                Guardar
                            </button>
                            <button 
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            onClick={() => { navigate(`/items`) }} >
                                Volver
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