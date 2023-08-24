import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import MainNavBar from "../orders/MainNavBar";
import SERVER from '../server'

function ActualizarNombreRepuestos() {
    const [nombreRepuestos, setNombreRepuestos] = useState("");
    const [listaNombresRepuestos, setListaNombresRepuestos] = useState([])
  
    const navigate = useNavigate();
    const location = useLocation();
    const nombresRepuestosId = location.pathname.split("/")[2];
  
    useEffect(() => {
        const fetchData = async () => {
            await axios.get(`${SERVER}/nombresRepuestos`)
            .then(response => {
                setListaNombresRepuestos(response.data);
                for (let i = 0; i < response.data.length; i++) {
                    if (response.data[i].nombres_repuestos_id === Number(nombresRepuestosId)) {
                        setNombreRepuestos(response.data[i].nombre_repuestos)
                    }
                }
            })
            .catch(error => {
            console.error(error);
            });
        }
        fetchData()

    // eslint-disable-next-line
    }, []);
    
    function verificarExistencia(nombreRepuestos) {
        return listaNombresRepuestos.some(nombres => nombres.nombre_repuestos === nombreRepuestos)
    }
  
    async function handleSubmit(event) {
        event.preventDefault();
        if(verificarExistencia() || nombreRepuestos === "") {
            return alert("Tipo con ese nombre ya agregado")
        }
        else {
            try {
                const response = await axios.put(`${SERVER}/type/${nombresRepuestosId}`, {
                    nombreRepuestos,
                });
                if (response.status === 200){
                    alert("Nombre de repuesto actuzalizado")
                    navigate(-1);
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
            <h1 className="text-center text-5xl">Actualizar Nombre de Repuesto</h1>
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
                            onClick={() => { navigate(-1) }} >
                                Volver
                        </button>
                </form>
            </div>
        </div>
    </div>
  );
}

export default ActualizarNombreRepuestos;
