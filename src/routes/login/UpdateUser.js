    import React, {useState, useEffect} from 'react'
    import axios from 'axios'
    import { useLocation, useNavigate } from 'react-router-dom'
    import MainNavBar from '../orders/MainNavBar';
    import SERVER from '../server'
    
    function UpdateUser() {
        const [user, setUser] = useState([]);
        const [listGrupos, setListGrupos] = useState([]);
        const [branches, setBranches] = useState([]);
    
        const location = useLocation();
        const userId = location.pathname.split("/")[2];
        const navigate = useNavigate();
    
        useEffect(() => {
            const fetchStates = async () => {
                await axios.get(`${SERVER}/users`)
                    .then(response => {
                        const user = response.data.filter((item) => item.idusers === parseInt(userId))
                        setUser(user[0])
                        document.getElementById('username').value = user[0].username
                        document.getElementById('password').value = user[0].password
                    })
                    .catch(error => {
                        console.error(error)
                    })
                await axios.get(`${SERVER}/grupousuarios`)
                    .then(response => {
                        setListGrupos(response.data)
                    })
                    .catch(error => {
                        console.error(error)
                    })
                await axios.get(`${SERVER}/branches`)
                    .then(response => {
                        setBranches(response.data)
                    })
                    .catch(error => {
                        console.error(error)
                    })
            }
            fetchStates()
            // eslint-disable-next-line
        }, []);
    
        async function handleSubmit(event) {
            event.preventDefault();
            // Aquí es donde enviarías la información de inicio de sesión al servidor
            try {
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const response = await axios.put(`${SERVER}/users/${userId}`, {
                    username,
                    password,
                    branchId: parseInt(user.branch_id),
                    grupoId: parseInt(user.idgrupousuarios)
                });
                if (response.status === 200){
                    alert("Usuario agregado")
                    window.location.reload();
                }
            } catch (error) {
                alert(error.response.data);
            }
        }
      
        return (
            <div className='bg-gray-300 min-h-screen pb-2'>
                <MainNavBar />
                <div className='bg-white my-2 py-8 px-2 max-w-2xl mx-auto'>
                    <h1 className="text-center text-5xl">Agregar usuario</h1>
                    <div className="p-4 max-w-lg mx-auto">
                        <form onSubmit={handleSubmit} className="mb-4">
                            <div className="mb-2">
                                {/* Usuario y Contrasenia */}
                                <div className='flex'>
                                    <div className='w-full'>
                                        <label className="block text-gray-700 font-bold mb-2" htmlFor="username">Username: *</label>
                                        <input 
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                            type="text" 
                                            id="username"
                                            required
                                        />
                                    </div>
                                    <div className='w-full'>
                                        <label className="block text-gray-700 font-bold mb-2" htmlFor="password">Contraseña: *</label>
                                        <input 
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                            type="text" 
                                            id="password"
                                            required
                                        />
                                    </div>
                                </div>
                                {/* Grupo y Sucursal */}
                                <div className='flex mt-5'>
                                    <div className='w-full'>
                                        <label className="block text-gray-700 font-bold mb-2" htmlFor="grupo">Grupo de trabajo: *</label>
                                        <select 
                                        required 
                                        id='grupo' 
                                        name='grupo' 
                                        value={user.idgrupousuarios} 
                                        onChange={(e) => {
                                            setUser((prevUser) => ({
                                                ...prevUser,
                                                idgrupousuarios: e.target.value
                                            }));
                                        }}
                                        className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline">
                                            <option value="" disabled>Seleccionar grupo de usuarios</option>
                                            {listGrupos.map((grupo) => (
                                                <option key={grupo.idgrupousuarios} value={grupo.idgrupousuarios}>{grupo.grupo}</option>
                                            ))}   
                                        </select>
                                    </div>
                                    <div className='w-full'>
                                        <label className="block text-gray-700 font-bold mb-2" htmlFor="sucursal">Sucursal: *</label>
                                        <select 
                                        required 
                                        id='sucursal' 
                                        name='sucursal'
                                        value={user.branch_id} 
                                        onChange={(e) => {
                                            setUser((prevUser) => ({
                                                ...prevUser,
                                                branch_id: e.target.value
                                            }));
                                        }}
                                        className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline">
                                            <option value="" disabled>Seleccionar sucursal</option>
                                            {branches.map((branch) => (
                                                <option key={branch.idbranches} value={branch.idbranches}>{branch.branch}</option>
                                            ))}   
                                        </select>
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
                </div>
            </div>
        );
    }
    
    export default UpdateUser