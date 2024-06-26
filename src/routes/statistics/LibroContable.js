import React, {useState, useEffect} from 'react'
import axios from 'axios'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'
import { useNavigate } from 'react-router-dom';

function Statistics() {

    const [allMovements, setAllMovements] = useState([])
    const [movname, setMovname] = useState([])

    const [selectMovements, setSelectMovements] = useState([]);
    const [idSelectMovement, setIdSelectMovement] = useState(null);

    const [searchMovname, setsearchMovname] = useState([]);

    const [ingresoSearch, setIngresoSearch] = useState("");
    const [egresoSearch, setEgresoSearch] = useState("");
    const [montoMinSearch, setMontoMinSearch] = useState("");
    const [montoMaxSearch, setMontoMaxSearch] = useState("");
    const [fechaInicioSearch, setFechaInicioSearch] = useState("");
    const [fechaFinSearch, setFechaFinSearch] = useState("");
    const [operacionSearch, setOperacionSearch] = useState("")
    const [cantidadMovname, setCantidadMovname] = useState(0)

    const [reduceStock, setReduceStock] = useState([])
    const [selectedStock, setSelectedStock] = useState([])

    const branchId = JSON.parse(localStorage.getItem("branchId"))
    const contrasenia = localStorage.getItem("password")

    const [currentBranch, setCurrentBranch] = useState(branchId);
    const [allMoveNames, setAllMovNames] = useState({})

    const [branches, setBranches] = useState([]);

    const [garantiaId, setGarantiaId] = useState(0)

    const navigate = useNavigate();

    useEffect(() => {
        const fetchStates = async () => {

            await axios.get(`${SERVER}/movements/${branchId}`)
              .then(response => {
                setAllMovements(response.data)
              })
              .catch(error => {
                console.error(error)
              })

            await axios.get(`${SERVER}/movname/${branchId}`)
              .then(response => {
                setMovname(response.data)
                setsearchMovname(response.data)
                setAllMovNames({
                  [branchId]: response.data
                })
              })
              .catch(error => {
                console.error(error)
              })

            await axios.get(`${SERVER}/reduceStock/`)
              .then(response => {
                setReduceStock(response.data)
              })
              .catch(error => {
                  console.error(error)
              })
            await axios.get(`${SERVER}/branches`)
              .then(response => {
                  setBranches(response.data);
                  const garantiaId = response.data.filter((branch) => branch.branch === 'Garantia')[0].idbranches
                  setGarantiaId(garantiaId)
              })
              .catch(error => {
                  console.error(error);
              });
        }
        fetchStates()
    // eslint-disable-next-line
    }, []);
    useEffect(() => {
      setCantidadMovname(searchMovname.length)
    }, [searchMovname])

    async function handleSearch (event) {
      event.preventDefault();

      setsearchMovname(movname.filter((item) => {
          let [fecha, hora] = item.fecha.split(' ');
          const [dia, mes, anio] = fecha.split('/');
          if (hora === undefined) {
            hora = '00:00:00';
          }
          const [horaStr, minutoStr, segundoStr] = hora.split(':');

          const createdAt = new Date(anio, mes - 1, dia, horaStr, minutoStr, segundoStr);
          
          const montoMin = montoMinSearch ? Number(montoMinSearch) : 0;
          const montoMax = montoMaxSearch ? Number(montoMaxSearch) : 100000000;

          const isWithinRangeMonto = (Number(item.monto) >= montoMin && Number(item.monto) <= montoMax);
          // Verificar si la fecha está dentro del rango
          const isWithinRangeDate = (!fechaInicioSearch || createdAt >= new Date(fechaInicioSearch)) && (!fechaFinSearch || new Date(anio, mes - 1, dia - 1) <= new Date(fechaFinSearch));
          return (
              item.ingreso.toLowerCase().includes(ingresoSearch.toLowerCase()) &&
              item.egreso.toLowerCase().includes(egresoSearch.toLowerCase()) &&
              item.operacion.toLowerCase().includes(operacionSearch.toLowerCase()) &&
              isWithinRangeDate &&
              isWithinRangeMonto
          )
      }));
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
      const movimientosFiltrados = allMovements.filter(
        (movimiento) => movimiento.movname_id === id
      );
        setSelectMovements(movimientosFiltrados);
    };

    const handleRowClick = (id, order_id) => {
      if (idSelectMovement === id) {
        setIdSelectMovement(null);
        setSelectMovements([]);
        setSelectedStock([]);
      } else {
        obtenerMovimientos(id);
        setIdSelectMovement(id);
        if (order_id) {
          setSelectedStock(reduceStock.filter(item => item.orderid === order_id))
        } else {
          setSelectedStock([])
        }
      }
    };
    
    async function handleDelete(id) {
      try {
        const clientPassword = window.prompt('Ingresar contrasenia para confirmar')
        if (clientPassword === contrasenia) {
          await axios.delete(`${SERVER}/movname/${id}`)
            .then(response => {
              alert("Operacion eliminada")
              window.location.reload()
            })
            .catch(error => {
                console.error(error)
            })
        } else {
          return alert('Contrasenia erronea, la operacion no fue eliminada')
        }
      } catch (error) {
        alert(error)
      }
    }

    async function handleBranches(id) {
      if (id === garantiaId) {
          alert('Esta sucursal no tiene operaciones')
      }
      if (currentBranch !== id){
          let arrNewStock = []
          if (id in allMoveNames){
              arrNewStock = allMoveNames[id]
          } else {
              await axios.get(`${SERVER}/movname/${id}`)
                .then(response => {
                  setAllMovNames(prev => ({
                      ...prev,
                      [id]: response.data
                  }))
                  arrNewStock = response.data
              })
                .catch(error => {
                  console.error(error);
              });
          }
          setCurrentBranch(id)
          
          setMovname(arrNewStock)
          setsearchMovname(arrNewStock)
      }
    }

    // Obtener las filas correspondientes a la página actual
    const paginatedRows = paginateData();

    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className="bg-white my-2 px-2 max-w-7xl mx-auto">
              <div className='text-center'>
                <h1 className="text-5xl font-bold pt-8">Libro contable</h1>
                <div className="flex justify-around py-1">
                  {branches.map(branch => (
                    <button 
                      key={branch.idbranches}
                      className={`${branch.idbranches === currentBranch ? "bg-blue-600 border border-white" : "bg-blue-400"} px-4 py-2`}
                      onClick={() => handleBranches(branch.idbranches)}>
                      {branch.branch}
                    </button>
                  ))}
                </div>
                <h1 className='text-left text-lg'>Cantidad de operaciones: <b>{cantidadMovname}</b></h1>
                {/* Buscador de registros */}
                <div className="border border-gray-300">
                    <form onSubmit={handleSearch} className="p-1 bg-blue-100">
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-y-1'>
                            <div className='flex justify-end w-5/6 gap-x-2'>
                                <label>Ingreso</label>
                                <input
                                    className="text-end w-52"
                                    type="text"
                                    value={ingresoSearch}
                                    onChange={(e) => setIngresoSearch(e.target.value)}
                                />
                            </div>
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
                            <div className='flex justify-end w-5/6 gap-x-2'>
                                <label>Egreso </label>
                                <input
                                    className='w-52'
                                    type="text"
                                    value={egresoSearch}
                                    onChange={(e) => setEgresoSearch(e.target.value)}
                                />
                            </div>
                            <div className='flex justify-end w-5/6 gap-x-2'>
                                <label>Monto mínimo </label>
                                <input
                                    className='w-52'
                                    type="text"
                                    value={montoMinSearch}
                                    onChange={(e) => setMontoMinSearch(e.target.value)}
                                />
                            </div>        
                            <div className='flex justify-end w-5/6 gap-x-2'>
                                <label>Monto máximo </label>
                                <input
                                    className='w-52'
                                    type="text"
                                    value={montoMaxSearch}
                                    onChange={(e) => setMontoMaxSearch(e.target.value)}
                                />
                            </div>          
                            <div className='flex justify-end w-5/6 gap-x-2'>
                                <label>Operacion</label>
                                <input
                                    className='w-52'
                                    type="text"
                                    value={operacionSearch}
                                    onChange={(e) => setOperacionSearch(e.target.value)}
                                />
                            </div>              
                        </div>
                        <div className='flex justify-end'>
                            <button
                                type='submit'
                                className="px-1 text-black font-bold bg-white rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200" >
                                Buscar
                            </button>
                        </div>
                    </form>
                </div>
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
                      <th className="px-4 py-2 border border-black">Eliminar</th>
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
                          <td className="px-4 py-2">
                            <button
                            onClick={() => handleDelete(row.idmovname)}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                        {/* Renderiza la tabla de movimientos si el movimiento está seleccionado */}
                        {idSelectMovement === row.idmovname && (
                          <tr className='bg-gray-300 border border-black'>
                            <td colSpan="3">
                              <table className="my-2 w-full border border-black bg-white">
                                <thead>
                                  <tr>
                                    <th className="px-4 py-2">Codigo</th>
                                    <th className="px-4 py-2">Repuesto</th>
                                    <th className="px-4 py-2">Proveedor</th>
                                    <th className="px-4 py-2">User</th>
                                    <th className="px-4 py-2">Fecha</th>
                                    <th className="px-4 py-2">Sucursal</th>
                                  </tr>
                                </thead>
                                <tbody className='text-center'>
                                  {selectedStock.map((item) => (
                                    <tr key={item.idreducestock}>
                                      <td className="border border-black px-4 py-2 text-center">{item.idstock}</td>
                                      <td className="border border-black px-4 py-2 text-center">{item.repuesto}</td>
                                      <td className="border border-black px-4 py-2 text-center">{item.nombre}</td>
                                      <td className="border border-black px-4 py-2 text-center">{item.username}</td>
                                      <td className="border border-black px-4 py-2 text-center">{item.date}</td>
                                      <td className="border border-black px-4 py-2 text-center">{item.branch_id}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                            <td colSpan="3">
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
                              <button
                              onClick={() => handleDelete(row.idmovname)}
                              className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                              >
                                Eliminar
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
                                {selectedStock.map((item) => (
                                  <div key={item.idreducestock} className='border border-black'>
                                    <p className='py-1'><b>Codigo: </b> {item.idstock}</p>
                                    <p className='py-1'><b>Repuesto: </b>{item.repuesto}</p>
                                    <p className='py-1'><b>Proveedor: </b>{item.nombre}</p>
                                    <p className='py-1'><b>User: </b>{item.username}</p>
                                    <p className='py-1'><b>Fecha: </b>{item.date}</p>
                                  </div>
                                ))}
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