import React, {useState, useEffect} from 'react'
import axios from 'axios'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'
import { formatDateDmy, parseDateDmyOrIso, pickDate } from '../utils/dateFormat'

function Operaciones() {

    const [ordenesEntregadas, setOrdenesEntregadas] = useState([])
    const [equiposVendidos, setEquiposVendidos] = useState([])
    const [reduceStock, setReduceStock] = useState([])

    const [selectRepuestos, setSelectRepuestos] = useState([]);
    const [idSelectRepuestos, setIdSelectRepuestos] = useState(null);

    const [searchTodo, setSearchTodo] = useState([])

    const [fechaInicioSearch, setFechaInicioSearch] = useState("");
    const [fechaFinSearch, setFechaFinSearch] = useState("");
    const [operacionSearch, setOperacionSearch] = useState("");

    const branchId = JSON.parse(localStorage.getItem("branchId"))

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/orders/entregados`)
                .then(response => {
                    const ordenesFiltradas = response.data.filter((item) => item.idbranches === branchId)
                    setOrdenesEntregadas(ordenesFiltradas)
                })
                .catch(error => {
                    console.error(error)
                })

            await axios.get(`${SERVER}/reduceStock/`)
                .then(response => {
                    const ventas = response.data.filter((item) => {
                        return item.orderid === null
                    })
                    setReduceStock(response.data)
                    setEquiposVendidos(ventas)
                })
                .catch(error => {
                    console.error(error)
                })
        }
        fetchStates()
    // eslint-disable-next-line
    }, []);

    // Filtro de rango que funciona tanto con VARCHAR legacy como con ISO
    // (Fase 3.4 _dt). Usa parseDateDmyOrIso para absorber cualquier formato.
    function isInRange(valor) {
        const parsed = parseDateDmyOrIso(valor);
        if (!parsed) return false;
        const d = parsed.getTime();
        if (fechaInicioSearch && d < new Date(fechaInicioSearch).getTime()) return false;
        if (fechaFinSearch && d > new Date(fechaFinSearch).getTime()) return false;
        return true;
    }

    async function handleSearch (event) {
        event.preventDefault();
        const arrayTodos = []
        // Ordenes
        const ordenesFiltradas = ordenesEntregadas.filter((item) => isInRange(pickDate(item, 'returned_at')))
        ordenesFiltradas.forEach((item) => {
            const diccionarioParcial = {
              nombre: `Orden #${item.order_id}`,
              fecha: formatDateDmy(pickDate(item, 'returned_at')),
              id: item.order_id,
              repuestos: [],
              link: `/messages/${item.order_id}`
            }
            arrayTodos.push(diccionarioParcial)
        })
        // Equipos
        const equiposVendidosFiltrados = equiposVendidos.filter((item) => isInRange(pickDate(item, 'date')))
        equiposVendidosFiltrados.forEach((item) => {
          const diccionarioParcial = {
            nombre: item.repuesto,
            fecha: formatDateDmy(pickDate(item, 'date')),
            id: item.idreducestock,
            repuestos: [{stockbranchid: item.stockbranchid, nombre: item.repuesto}],
            link: ''
          }
          arrayTodos.push(diccionarioParcial)
        })

        arrayTodos.sort((a, b) => parseFecha(b.fecha) - parseFecha(a.fecha));
        setSearchTodo(arrayTodos.filter((item) => item.nombre.toLowerCase().includes(operacionSearch.toLowerCase())))
    };
  function parseFecha(dateStr) {
      const [day, month, year] = dateStr.split('/');
      return new Date(`${year}-${month}-${day}`);
  }  

    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
  
    // Función para realizar la paginación de los datos
    const paginateData = () => {
      const startIndex = (currentPage - 1) * rowsPerPage;
      const endIndex = startIndex + rowsPerPage;
      return searchTodo.slice(startIndex, endIndex);
    };
  
    // Controlador de evento para avanzar a la siguiente página
    const nextPage = () => {
      if (currentPage < Math.ceil(searchTodo.length / rowsPerPage)) {
        setCurrentPage(currentPage + 1);
      }
    };
  
    // Controlador de evento para retroceder a la página anterior
    const prevPage = () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    };

    const obtenerRepuestos = (id) => {
      const repuestosFiltrados = reduceStock.filter((repuesto) => repuesto.orderid === id);
      const arrayRepuestos = []
      repuestosFiltrados.forEach((item) => {
        const diccionarioRepuesto = {
          stockbranchid: item.stockbranchid, 
          nombre: item.repuesto
        } 
        arrayRepuestos.push(diccionarioRepuesto)
      })
      setSelectRepuestos(arrayRepuestos);
    };

    const handleRowClick = (id, repuestos) => {
      if (idSelectRepuestos === id) {
        setIdSelectRepuestos(null);
        setSelectRepuestos([]);
      } else {
        if (repuestos.length > 0) {
          setSelectRepuestos(repuestos)
        } else {
          obtenerRepuestos(id);
        }
        setIdSelectRepuestos(id);
      }
    };

    // Obtener las filas correspondientes a la página actual
    const paginatedRows = paginateData();
    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className="bg-white my-2 px-2 max-w-7xl mx-auto">
              <div className='text-center'>
                <h1 className="text-5xl font-bold py-8">Operaciones completadas</h1>
                {/* Buscador */}
                <div className="border border-gray-300">
                    <form onSubmit={handleSearch} className="p-1 bg-blue-100">
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-y-1'>
                            <div className='flex justify-end w-5/6 gap-x-2'>
                                <label>Operacion</label>
                                <input
                                    className='w-52'
                                    type="text"
                                    value={operacionSearch}
                                    onChange={(e) => setOperacionSearch(e.target.value)}
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
                <table className="mt-4 w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 border border-black">Operación</th>
                      <th className="px-4 py-2 border border-black">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className='text-center'>
                    {paginatedRows.map((row) => (
                      <React.Fragment key={`${row.id} ${row.nombre}`}>
                        <tr
                          className="cursor-pointer hover:bg-gray-100 border border-black"
                          onClick={() => handleRowClick(row.id, row.repuestos)}
                        >
                          <td className="px-4 py-2 " >
                            {row.link !== '' ? (
                            <a target='_blank' rel="noreferrer" className='text-blue-500' href={row.link}>{row.nombre}</a>
                            ) : (
                              row.nombre
                            )}
                          </td>
                          <td className="px-4 py-2">{row.fecha}</td>
                        </tr>
                        {/* Renderiza la tabla de movimientos si el movimiento está seleccionado */}
                        {idSelectRepuestos === row.id && (
                          <tr className='bg-gray-300 border border-black'>
                            <td colSpan={2}>
                              <table className="my-2 w-full border border-black bg-white">
                                <thead>
                                  <tr>
                                    <th className="px-4 py-2 border border-black">Codigo</th>
                                    <th className="px-4 py-2 border border-black">Nombre</th>
                                    <th className="px-4 py-2 border border-black">Cantidad</th>
                                  </tr>
                                </thead>
                                <tbody className='text-center'>
                                  {selectRepuestos.map((repuesto) => (
                                    <tr key={repuesto.stockbranchid}>
                                      <td className="px-4 py-2 border border-black">{repuesto.stockbranchid}</td>
                                      <td className="px-4 py-2 border border-black">{repuesto.nombre}</td>
                                      <td className="px-4 py-2 border border-black">1</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
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

export default Operaciones