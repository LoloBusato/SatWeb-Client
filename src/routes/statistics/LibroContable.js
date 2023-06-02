import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';

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

    const navigate = useNavigate();

    useEffect(() => {
        const fetchStates = async () => {

            await axios.get(`http://localhost:3001/movements`)
                .then(response => {
                  setAllMovements(response.data)
                })
                .catch(error => {
                    console.error(error)
                })

            await axios.get(`http://localhost:3001/movname`)
                .then(response => {
                    setMovname(response.data)
                    setsearchMovname(response.data)
                })
                .catch(error => {
                    console.error(error)
                })
        }
        fetchStates()
    }, []);

    async function handleSearch (event) {
      event.preventDefault();
      setsearchMovname(movname.filter((item) => {
          const fecha = item.fecha.split("/")
          const createdAt = new Date(`${fecha[1]}-${fecha[0]}-${fecha[2]}`);
          
          const montoMin = montoMinSearch ? Number(montoMinSearch) : 0;
          const montoMax = montoMaxSearch ? Number(montoMaxSearch) : 100000000;

          const isWithinRangeMonto = (Number(item.monto) >= montoMin && Number(item.monto) <= montoMax);
          // Verificar si la fecha está dentro del rango
          const isWithinRangeDate = (!fechaInicioSearch || createdAt >= new Date(fechaInicioSearch)) && (!fechaFinSearch || createdAt <= new Date(fechaFinSearch));

          return (
              item.ingreso.toLowerCase().includes(ingresoSearch.toLowerCase()) &&
              item.egreso.toLowerCase().includes(egresoSearch.toLowerCase()) &&
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

    const handleRowClick = (id) => {
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
                <h1 className="text-5xl font-bold py-8">Libro contable</h1>
                <div className="border border-gray-300">
                        <form onSubmit={handleSearch} className="p-1 bg-blue-100">
                            <div className='grid grid-cols-3 gap-y-1'>
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
                <table className="mt-4 w-full">
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
                          onClick={() => handleRowClick(row.idmovname)}
                        >
                          <td className="px-4 py-2">{row.fecha}</td>
                          <td className="px-4 py-2">{row.ingreso}</td>
                          <td className="px-4 py-2">{row.operacion}</td>
                          <td className="px-4 py-2">{row.egreso}</td>
                          <td className="px-4 py-2">{row.monto}</td>
                          <td className="px-4 py-2">{row.username}</td>
                          <td className="px-4 py-2">
                            <button
                            onClick={() => {navigate('/home')}}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded"
                            >
                              Editar
                            </button>
                          </td>
                          <td className="px-4 py-2">
                            <button
                            onClick={() => {navigate('/home')}}
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                        {/* Renderiza la tabla de movimientos si el movimiento está seleccionado */}
                        {idSelectMovement === row.idmovname && (
                          <tr className='bg-gray-300 border border-black'>
                            <td colSpan="3"></td>
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