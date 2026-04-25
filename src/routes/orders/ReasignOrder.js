import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate, useLocation } from 'react-router-dom'
import MainNavBar from './MainNavBar';
import SERVER from '../server'
import Select from 'react-select';

function ReasignOrder() {
    const [grupoUsuarios, setGrupoUsuarios] = useState([])
    const [estados, setStates] = useState([])

    const [grupoId, setGrupoId] = useState([])
    const [estadoId, setEstadoId] = useState([])

    // IDs y nombres dinámicos resueltos desde branch_settings + group_permissions.
    // Se usan para auto-forzar la asignación a Admin cuando se elige INCUCAI
    // (espejo cosmético del backend OrderRepository.updateState que hace el
    // mismo override por servidor; este lock es UX para que el técnico vea
    // qué va a pasar antes de guardar).
    const [special, setSpecial] = useState({
        incucaiId: null,
        adminGroupId: null,
        adminGroupName: '',
    })

    const navigate = useNavigate();
    const location = useLocation();
    const orderId = location.pathname.split("/")[2];

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/grupousuarios`)
                .then(response => {
                    setGrupoUsuarios(response.data);
                })
                .catch(error => {
                    console.error(error);
                });

            await axios.get(`${SERVER}/states`)
                .then(response => {
                    setStates(response.data);
                })
                .catch(error => {
                    console.error(error);
                });

            await axios.get(`${SERVER}/orders/special-states`)
                .then(response => {
                    const d = response.data || {};
                    setSpecial({
                        incucaiId: d.incucai_state_id ?? null,
                        adminGroupId: d.admin_group_id ?? null,
                        adminGroupName: d.admin_group_name ?? '',
                    });
                })
                .catch(error => {
                    console.error(error);
                });
        }
        fetchStates()
// eslint-disable-next-line
    }, []);

    const isIncucai = special.incucaiId != null && Number(estadoId) === Number(special.incucaiId);

    // Cuando el estado seleccionado es INCUCAI, forzamos el grupoId al admin
    // (también lo fuerza el backend, pero el form manda el valor coherente).
    useEffect(() => {
        if (isIncucai && special.adminGroupId != null) {
            setGrupoId(special.adminGroupId);
        }
    }, [isIncucai, special.adminGroupId]);

    async function handleSubmit(event) {
        event.preventDefault();
        try {
            const responseOrders = await axios.put(`${SERVER}/reasignOrder/${orderId}`, {
                state_id: estadoId,
                users_id: grupoId,
            });
            if (responseOrders.status === 200){
                alert("Orden reasignada")
                navigate(`/messages/${orderId}`)
            }
        } catch (error) {
            alert(error.response.data);
        }
    }

    return (
        <div className='bg-gray-300 min-h-screen'>
            <MainNavBar />
            <div className='mt-2 w-full border border-black-700 shadow-lg md:w-1/2 mx-auto bg-white px-4 py-5'>
                <h1 className="text-5xl text-center">Reasignar orden</h1>
                <form onSubmit={handleSubmit} className="mt-5">
                    <div className='flex'>
                        <div className='w-full'>
                            <label className="block text-gray-700 font-bold mb-2">Estado: *</label>
                            <Select
                                required
                                options={ estados.map((estado) => ({label: estado.state, value: estado.idstates})) }
                                placeholder='Seleccionar estado'
                                onChange={(e) => setEstadoId(e.value)}
                                menuPlacement="auto"
                            />
                        </div>
                        <div className='w-full'>
                            <label className="block text-gray-700 font-bold mb-2">Asignar: *</label>
                            {isIncucai ? (
                                <Select
                                    isDisabled
                                    value={{ label: special.adminGroupName || 'Admin', value: special.adminGroupId }}
                                    menuPlacement="auto"
                                />
                            ) : (
                                <Select
                                    required
                                    options={ grupoUsuarios.filter(g => g.grupo !== 'USUARIOS DESHABILITADOS').map((grupo) => ({label: grupo.grupo, value: grupo.idgrupousuarios})) }
                                    placeholder='Asignar orden'
                                    onChange={(e) => setGrupoId(e.value)}
                                    menuPlacement="auto"
                                />
                            )}
                        </div>
                    </div>
                    <div className="flex mt-2">
                        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default ReasignOrder
