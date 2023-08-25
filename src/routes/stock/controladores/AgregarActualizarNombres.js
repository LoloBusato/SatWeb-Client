import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import SERVER from '../../server'

function AgregarActualizarNombres({ urlActualizarFront, urlAgregarFront, urlServidor, indiceColumnaDB, nombreColumnaDB, variableServidor, textoTitulo, placeholderInput, mostrarTabla, actualizar }) {
    const [nombre, setNombre] = useState("");
    const [listaNombres, setListaNombres] = useState([])
    const [nombreId, setNombreId] = useState('')
  
    const navigate = useNavigate();
    const location = useLocation();
  
    useEffect(() => {
        const fetchData = async () => {
            await axios.get(`${SERVER}/${urlServidor}`)
            .then(response => {
                setListaNombres(response.data);
                if(actualizar) {
                    const nombreId = location.pathname.split("/")[2]
                    setNombreId(nombreId)
                    for (let i = 0; i < response.data.length; i++) {
                        if (response.data[i][indiceColumnaDB] === Number(nombreId)) {
                            setNombre(response.data[i][nombreColumnaDB])
                        }
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

    function verificarExistencia(nombre) {
        return listaNombres.some(nombres => nombres[nombreColumnaDB].trim().toLowerCase() === nombre.trim().toLowerCase())
    }
  
    async function handleSubmit(event) {
        event.preventDefault();
        if(verificarExistencia(nombre) || nombre === "") {
            return alert("Con ese nombre ya fue agregado")
        } else {
            try {
                if(mostrarTabla) {
                    const response = await axios.post(`${SERVER}/${urlServidor}`, {
                        [variableServidor]: nombre.trim(),
                    });
                    if (response.status === 200){
                        alert("Nombre agregado")
                        window.location.reload();
                    }
                } else {
                    const response = await axios.put(`${SERVER}/${urlServidor}/${nombreId}`, {
                        [variableServidor]: nombre.trim(),
                    });
                    if (response.status === 200){
                        alert("Nombre de repuesto actuzalizado")
                        navigate(`/${urlAgregarFront}`);
                    }
                }
            } catch (error) {
                alert(error.response.data);
            }
        }
    }

  return (
    <div className='bg-white my-2 py-8 px-2 max-w-2xl mx-auto'>
        <h1 className="text-center text-5xl">{textoTitulo}</h1>
        <div className="p-4 max-w-md mx-auto">
            <form onSubmit={handleSubmit} className="mb-4">
                <div className="mb-2">
                    <label 
                    className="block text-gray-700 font-bold mb-2" 
                    htmlFor={variableServidor}>
                        {variableServidor}:
                    </label>
                    <input 
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                        type="text" 
                        id={variableServidor}
                        placeholder={placeholderInput}
                        value={nombre} 
                        onChange={(e) => setNombre(e.target.value)} 
                    />
                </div>
                    <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                        Guardar
                    </button>
                    <button 
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        onClick={() => { navigate(`/${urlAgregarFront}`) }} >
                            Volver
                    </button>
            </form>
        </div>
        {mostrarTabla && (
            <div className="mx-10 p-4 flex flex-wrap justify-between">
                {listaNombres.map(nombre => (
                    <div key={nombre[indiceColumnaDB]} className="max-w-sm flex justify-between pr-2 border-b w-full md:w-1/3">
                        <h3 className="text-gray-900">{nombre[nombreColumnaDB]}</h3>
                        <button 
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        onClick={() => { navigate(`/${urlActualizarFront}/${nombre[indiceColumnaDB]}`) }} >
                                Editar
                        </button>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
}

export default AgregarActualizarNombres