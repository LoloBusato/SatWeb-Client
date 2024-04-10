import React, {useState, useEffect} from 'react'
import axios from 'axios'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'
import { useNavigate } from 'react-router-dom';
import Select from 'react-select'

function Statistics() {
    const branchId = JSON.parse(localStorage.getItem("branchId"))
    const permisos = JSON.stringify(localStorage.getItem("permisos"))

    const [allMovements, setAllMovements] = useState({})
    const [allMoveNames, setAllMovNames] = useState({})

    const [selectMovements, setSelectMovements] = useState([]);
    const [idSelectMovement, setIdSelectMovement] = useState(null);

    const [searchMovname, setsearchMovname] = useState([]);

    const [fechaInicioSearch, setFechaInicioSearch] = useState("");
    const [fechaFinSearch, setFechaFinSearch] = useState("");

    const [currentBranch, setCurrentBranch] = useState(branchId);

    const [movementCategories, setMovementCategories] = useState([])
    const [movementCategory, setMovementCategory] = useState(null)
    const [cantidadMovname, setCantidadMovname] = useState(0)

    const [branches, setBranches] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchStates = async () => {

            if(!allMovements.hasOwnProperty(currentBranch)) {
                await axios.get(`${SERVER}/movements/${currentBranch}`)
                    .then(response => {
                        setAllMovements(prev => ({
                            ...prev,
                            [currentBranch]: response.data
                        }))
                    })
                    .catch(error => {
                        console.error(error)
                    })
            }

            if(!allMoveNames.hasOwnProperty(currentBranch)){
                await axios.get(`${SERVER}/movname/${currentBranch}`)
                  .then(response => {
                    setAllMovNames(prev => ({
                        ...prev,
                        [currentBranch]: response.data
                    }))
                  })
                  .catch(error => {
                    console.error(error)
                  })
            }
        }
        fetchStates()
    // eslint-disable-next-line
    }, [currentBranch]);
    useEffect(() => {
        const fetch = async () => {
            await axios.get(`${SERVER}/movcategories`)
                .then(response => {
                    const movementCategories = response.data
                    setMovementCategories(movementCategories.filter((item) => item.categories !== 'Caja'))
                })
                .catch(error => {
                    console.error(error)
                })
            await axios.get(`${SERVER}/branches`)
                .then(response => {
                    setBranches(response.data.filter((branch) => branch.branch !== 'Garantia'));
                })
                .catch(error => {
                    console.error(error);
                });
        }
        fetch()
    }, [])
    useEffect(() => {
      setCantidadMovname(searchMovname.length)
    }, [searchMovname])

    async function handleSearch (e) {
        e.preventDefault();
        try {
            const movementsFiltered = allMovements[currentBranch].filter((movement) => movement.idmovcategories === movementCategory)
            const uniqueMovnameIds = [...new Set(movementsFiltered.map(item => item.movname_id))];
    
            const filteredMoveNames = allMoveNames[currentBranch].filter(item => uniqueMovnameIds.includes(item.idmovname))
            
            setsearchMovname(filteredMoveNames.filter((item) => {
                let [fecha, hora] = item.fecha.split(' ');
                const [dia, mes, anio] = fecha.split('/');
                if (hora === undefined) {
                    hora = '00:00:00';
                }
                const [horaStr, minutoStr, segundoStr] = hora.split(':');
    
                const createdAt = new Date(anio, mes - 1, dia, horaStr, minutoStr, segundoStr);
                const isWithinRangeDate = (!fechaInicioSearch || createdAt >= new Date(fechaInicioSearch)) && (!fechaFinSearch || new Date(anio, mes - 1, dia - 1) <= new Date(fechaFinSearch));
                
                return isWithinRangeDate
            }))
        } catch (error) {
            console.log(error)
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
  
    // Función para realizar la paginación de los datos
    const paginateData = () => {
      const startIndex = (currentPage - 1) * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      return searchMovname.slice(startIndex, endIndex);
    };
  
    // Controlador de evento para avanzar a la siguiente página
    const nextPage = () => {
      if (currentPage < Math.ceil(searchMovname.length / rowsPerPage)) {
        setCurrentPage(currentPage + 1);
      }
    };
  
    // Controlador de evento para retroceder a la página anterior
    const prevPage = () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    };

    const obtenerMovimientos = (id) => {
      const movimientosFiltrados = allMovements[currentBranch].filter(
        (movimiento) => movimiento.movname_id === id
      );
        setSelectMovements(movimientosFiltrados);
    };

    const handleRowClick = (id, order_id) => {
      if (idSelectMovement === id) {
        setIdSelectMovement(null);
        setSelectMovements([]);
      } else {
        obtenerMovimientos(id);
        setIdSelectMovement(id);
      }
    };

    // Obtener las filas correspondientes a la página actual
    const paginatedRows = paginateData();

    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className="bg-white my-2 px-2 max-w-7xl mx-auto">
              <div className='text-center'>
                <h1 className="text-5xl font-bold pt-8">Historial de Cajas</h1>
                <p className='text-left text-lg mt-3'>Cantidad de operaciones: <b>{cantidadMovname}</b></p>
                <form onSubmit={handleSearch} className="p-1 bg-blue-100">
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-y-1'>
                        {permisos.includes("Administrador") && (
                            <Select 
                                required
                                options={branches.map((branch) => ({label: branch.branch, value: branch.idbranches}))}
                                placeholder='Sucursal'
                                onChange={(e) => setCurrentBranch(e.value)}
                            />
                        )}
                        <Select 
                            required
                            options={movementCategories.map((category) => ({label: category.categories, value: category.idmovcategories}))}
                            placeholder='Caja'
                            onChange={(e) => setMovementCategory(e.value)}
                        />
                        <div className='flex justify-end w-5/6 gap-x-2'>
                            <label>Fecha Inicio </label>
                            <input
                                className='w-52'
                                type="date"
                                value={fechaInicioSearch}
                                onChange={(e) => setFechaInicioSearch(e.target.value)}
                            />
                        </div>
                        <div className='flex justify-end w-5/6 gap-x-2'>
                            <label>Fecha Fin </label>
                            <input
                                className='w-52'
                                type="date"
                                value={fechaFinSearch}
                                onChange={(e) => setFechaFinSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <button 
                        type='submit'
                        className='bg-green-400 hover:bg-green-600 py-1 px-2 rounded'
                        >
                        Buscar
                    </button>
                </form>
                {/* Tabla con registros */}
                <table className="mt-4 w-full hidden md:block">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border border-black">(dd/mm/yy)</th>
                      <th className="px-4 py-2 border border-black">Ingreso</th>
                      <th className="px-4 py-2 border border-black">Operación</th>
                      <th className="px-4 py-2 border border-black">Egreso</th>
                      <th className="px-4 py-2 border border-black">Monto</th>
                      <th className="px-4 py-2 border border-black">Usuario</th>
                      <th className="px-4 py-2 border border-black">Editar</th>
                    </tr>
                  </thead>
                  <tbody className='text-center'>
                    {paginatedRows.map((row) => (
                      <React.Fragment key={row.idmovname}>
                        <tr
                          className="cursor-pointer hover:bg-gray-100 border border-black"
                          onClick={() => handleRowClick(row.idmovname, row.order_id)}
                        >
                          <td className="px-4 py-2">{row.fecha}</td>
                          <td className="px-4 py-2">{row.ingreso}</td>
                          <td className="px-4 py-2">
                          {row.order_id !== null ? (
                            <a target='_blank' rel="noreferrer" className='text-blue-500' href={`/messages/${row.order_id}`}>{row.operacion}</a>
                          ) : (
                            row.operacion
                          )}
                          </td>
                          <td className="px-4 py-2">{row.egreso}</td>
                          <td className="px-4 py-2">{row.monto}</td>
                          <td className="px-4 py-2">{row.username}</td>
                          <td className="px-4 py-2">
                            <button
                            onClick={() => navigate(`/editarOperaciones/${row.idmovname}`)}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded"
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                        {/* Renderiza la tabla de movimientos si el movimiento está seleccionado */}
                        {idSelectMovement === row.idmovname && (
                          <tr className='bg-gray-300 border border-black'>
                            <td colSpan="7">
                              <table className="my-2 w-full border border-black bg-white">
                                <thead>
                                  <tr>
                                    <th className="px-4 py-2 border border-black">Categoría</th>
                                    <th className="px-4 py-2 border border-black">Cantidad</th>
                                  </tr>
                                </thead>
                                <tbody className='text-center'>
                                  {selectMovements.map((movimiento) => (
                                    <tr key={movimiento.idmovements}>
                                      <td className="px-4 py-2 border border-black">{movimiento.categories}</td>
                                      <td className="px-4 py-2 border border-black">{movimiento.unidades}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                            <td colSpan="2"></td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>    
                {/* Tabla colapsable para dispositivos pequeños */}
                <div className="md:hidden">
                    {paginatedRows.map(row => (
                        <details key={row.idmovname} className="border mb-1 rounded">
                            <summary className="px-4 py-2 cursor-pointer outline-none">
                            {row.order_id !== null ? (
                              <a target='_blank' rel="noreferrer" className='text-blue-500' href={`/messages/${row.order_id}`}>{row.operacion}</a>
                            ) : (
                              row.operacion
                            )}
                            </summary>
                            <div
                              className="cursor-pointer border flex flex-col border-black"
                              onClick={() => handleRowClick(row.idmovname, row.order_id)}
                            >
                              <p className="px-4 py-2 border">{row.fecha}</p>
                              <p className="px-4 py-2 border">{row.ingreso}</p>
                              <p className="px-4 py-2 border">{row.operacion}</p>
                              <p className="px-4 py-2 border">{row.egreso}</p>
                              <p className="px-4 py-2 border">{row.monto}</p>
                              <p className="px-4 py-2 border">{row.username}</p>
                              <button
                              onClick={() => navigate(`/editarOperaciones/${row.idmovname}`)}
                              className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded"
                              >
                                Editar
                              </button>
                            </div>
                            {/* Renderiza la tabla de movimientos si el movimiento está seleccionado */}
                            {idSelectMovement === row.idmovname && (
                              <div>
                                <table className="my-2 w-full border border-black bg-white">
                                  <thead>
                                    <tr>
                                      <th className="px-4 py-2 border border-black">Categoría</th>
                                      <th className="px-4 py-2 border border-black">Cantidad</th>
                                    </tr>
                                  </thead>
                                  <tbody className='text-center'>
                                    {selectMovements.map((movimiento) => (
                                      <tr key={movimiento.idmovements}>
                                        <td className="px-4 py-2 border border-black">{movimiento.categories}</td>
                                        <td className="px-4 py-2 border border-black">{movimiento.unidades}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                        </details>
                    ))}
                </div>
                {/* Botones para ir a la siguiente pagina o a la anterior */}       
                <div className='flex bg-blue-300 justify-between py-1 px-1'>
                  <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                    onClick={prevPage} >
                    Prev
                  </button>
                  <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                    onClick={nextPage} >
                    Next
                  </button>
                </div>
              </div>
            </div>
        </div>
    );
}

export default Statistics