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

    // IDs de estados que fuerzan la asignación a Admin (states.forces_admin_assignment=1)
    // y datos del admin group, vienen de GET /orders/special-states. Espejo
    // cosmético del backend OrderRepository.updateState / legacy PUT /:id que
    // hace el mismo override server-side; este lock es UX para que el técnico
    // vea qué se va a guardar antes de hacerlo.
    const [special, setSpecial] = useState({
        adminLockedIds: [],
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
                        adminLockedIds: Array.isArray(d.admin_locked_state_ids) ? d.admin_locked_state_ids : [],
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

    const isAdminLocked = special.adminLockedIds.some((id) => Number(id) === Number(estadoId));

    // Cuando el estado seleccionado fuerza admin, forzamos el grupoId
    // (también lo fuerza el backend, pero el form manda el valor coherente).
    useEffect(() => {
        if (isAdminLocked && special.adminGroupId != null) {
            setGrupoId(special.adminGroupId);
        }
    }, [isAdminLocked, special.adminGroupId]);

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
                                options={ estados
                                    .slice()
                                    .sort((a, b) => {
                                        // PRESUPUESTAR primero (preferencia UX para flujo típico).
                                        if (a.state === 'PRESUPUESTAR') return -1;
                                        if (b.state === 'PRESUPUESTAR') return 1;
                                        return 0;
                                    })
                                    .map((estado) => ({label: estado.state, value: estado.idstates})) }
                                placeholder='Seleccionar estado'
                                onChange={(e) => setEstadoId(e.value)}
                                menuPlacement="auto"
                            />
                        </div>
                        <div className='w-full'>
                            <label className="block text-gray-700 font-bold mb-2">Asignar: *</label>
                            {isAdminLocked ? (
                                <Select
                                    isDisabled
                                    value={{ label: special.adminGroupName || 'Admin', value: special.adminGroupId }}
                                    menuPlacement="auto"
                                />
                            ) : (
                                <Select
                                    required
                                    options={ grupoUsuarios
                                        .filter(g => g.grupo !== 'USUARIOS DESHABILITADOS')
                                        .sort((a, b) => {
                                            // Admin último — se identifica por id, no por nombre,
                                            // así sigue siendo correcto si lo renombran.
                                            const aAdmin = a.idgrupousuarios === special.adminGroupId;
                                            const bAdmin = b.idgrupousuarios === special.adminGroupId;
                                            if (aAdmin && !bAdmin) return 1;
                                            if (bAdmin && !aAdmin) return -1;
                                            return 0;
                                        })
                                        .map((grupo) => ({label: grupo.grupo, value: grupo.idgrupousuarios})) }
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
