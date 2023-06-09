import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

function CreateGroups() {
    const [grupo, setGrupo] = useState('');
    const [listGrupos, setListGrupos] = useState([])

    const navigate = useNavigate();

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/grupousuarios`)
                .then(response => {
                    setListGrupos(response.data)
                })
                .catch(error => {
                    console.error(error)
                })
        }
        fetchStates()
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        // Aquí es donde enviarías la información de inicio de sesión al servidor
        try {
            let checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
            const labels = [];
            
            checkboxes.forEach(function(checkbox) {
                let label = document.querySelector('label[for="' + checkbox.id + '"]');
                labels.push(label.innerText);
            });
              
            const permisos = labels.join(" ");
            const response = await axios.post(`${SERVER}/grupousuarios`, {
            grupo,
            permisos
            });
            if (response.status === 200){
                alert("Grupo de usuarios agregado")
                window.location.reload();
            }
        } catch (error) {
            alert(error.response.data);
        }
    }

    const eliminarElemento = async (id) => {
        try {        
            const response = await axios.delete(`${SERVER}/grupousuarios/${id}`)
            if (response.status === 200){
                alert("Grupo de usuarios eliminado")
                window.location.reload();
            }
        } catch (error) {
            console.error(error)
        }
      }
  
    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className='bg-white my-2 py-8 px-2 max-w-2xl mx-auto'>
                <h1 className="text-center text-5xl">Agregar grupo de usuarios</h1>
                <div className="p-4 max-w-lg mx-auto">
                    <form onSubmit={handleSubmit} className="mb-4">
                        <div className="mb-2">
                            <div className='flex flex-col'>
                                <div className='w-full'>
                                    <label className="block text-gray-700 font-bold mb-2">Grupo: *</label>
                                    <input 
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="grupo" 
                                        value={grupo} 
                                        onChange={(e) => setGrupo(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <h1 className="block text-gray-700 font-bold mb-2">Permisos: *</h1>
                                    <div className='flex flex-wrap'>
                                        <div className='w-1/2'>
                                            <input type="checkbox" id="checkbox1" name="checkbox1" className='mr-1' />
                                            <label htmlFor="checkbox1">ManipularOrdenes</label>
                                        </div>

                                        <div className='w-1/2'>
                                            <input type="checkbox" id="checkbox2" name="checkbox2" className='mr-1' />
                                            <label htmlFor="checkbox2">Contabilidad</label>
                                        </div>

                                        <div className='w-1/2'>
                                            <input type="checkbox" id="checkbox3" name="checkbox3" className='mr-1' />
                                            <label htmlFor="checkbox3">ManipularStock</label>
                                        </div>

                                        <div className='w-1/2'>
                                            <input type="checkbox" id="checkbox4" name="checkbox4" className='mr-1' />
                                            <label htmlFor="checkbox4">AsignarRepuestos</label>
                                        </div>

                                        <div className='w-1/2'>
                                            <input type="checkbox" id="checkbox5" name="checkbox5" className='mr-1' />
                                            <label htmlFor="checkbox5">Administrador</label>
                                        </div>

                                        <div className='w-1/2'>
                                            <input type="checkbox" id="checkbox6" name="checkbox6" className='mr-1' />
                                            <label htmlFor="checkbox6">VerTodasLasOrdenes</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Guardar
                        </button>
                        <button 
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                            onClick={() => { navigate(`/home`) }} >
                                Volver
                        </button>
                    </form>
                </div>
                <div className="flex justify-center mb-10">
                    <table className="table-auto">
                        <thead>
                            <tr>
                                <th className="px-4 py-2">Grupo</th>
                                <th className="px-4 py-2">Permisos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {listGrupos.map((grupo) => (
                                <tr key={grupo.idgrupousuarios}>
                                    <td className="border px-4 py-2" value={grupo.grupo}>{grupo.grupo}</td>
                                    <td className="border px-4 py-2" value={grupo.permisos}>{grupo.permisos}</td>
                                    <td>
                                        <button className="bg-green-500 hover:bg-green-700 border px-4 py-2 color"
                                        onClick={() => { navigate(`/updateUser/${grupo.idgrupousuarios}`) }} >
                                        Editar
                                        </button>
                                    </td>
                                    <td>
                                        <button className="bg-red-500 hover:bg-red-700 border px-4 py-2 color"
                                        onClick={() => { eliminarElemento(grupo.idgrupousuarios)}} >
                                        Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default CreateGroups