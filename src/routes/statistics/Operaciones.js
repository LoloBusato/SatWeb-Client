import React, {useState, useEffect} from 'react'
import axios from 'axios'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

function Operaciones() {

    const [ordenesEntregadas, setOrdenesEntregadas] = useState([])
    const [equiposVendidos, setEquiposVendidos] = useState([])
    const [reduceStock, setReduceStock] = useState([])

    const [selectRepuestos, setSelectRepuestos] = useState([]);
    const [idSelectRepuestos, setIdSelectRepuestos] = useState(null);

    const [searchTodo, setSearchTodo] = useState([])

    const [fechaInicioSearch, setFechaInicioSearch] = useState("");
    const [fechaFinSearch, setFechaFinSearch] = useState("");

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

    async function handleSearch (event) {
        event.preventDefault();
        const arrayTodos = []
        const ordenesFiltradas = ordenesEntregadas.filter((item) => {
            if (item.returned_at) {
                const [dia, mes, anio] = item.returned_at.split('/');
                const createdAt = new Date(anio, mes - 1, dia);
    
                const isWithinRangeDate = (!fechaInicioSearch || createdAt >= new Date(fechaInicioSearch)) && (!fechaFinSearch || new Date(anio, mes - 1, dia - 1) <= new Date(fechaFinSearch));
                return (
                    isWithinRangeDate
                )
            } else {
                return false
            }
        })
        ordenesFiltradas.forEach((item) => {
            const diccionarioParcial = {
              nombre: `Orden #${item.order_id}`,
              fecha: item.returned_at,
              id: item.order_id,
              repuestos: []
            }
            arrayTodos.push(diccionarioParcial)
        })

        const equiposVendidosFiltrados = equiposVendidos.filter((item) => {
            const fecha = item.date.split(' ')[0]
            const [dia, mes, anio] = fecha.split('/');
            const createdAt = new Date(anio, mes - 1, dia);

            const isWithinRangeDate = (!fechaInicioSearch || createdAt >= new Date(fechaInicioSearch)) && (!fechaFinSearch || new Date(anio, mes - 1, dia - 1) <= new Date(fechaFinSearch));
            return (
                isWithinRangeDate
            )
        })
        equiposVendidosFiltrados.forEach((item) => {
          const fecha = item.date.split(' ')[0]
          const diccionarioParcial = {
            nombre: item.repuesto,
            fecha,
            id: item.idreducestock,
            repuestos: [{stockbranchid: item.stockbranchid, nombre: item.repuesto}]
          }
          arrayTodos.push(diccionarioParcial)
        })
        setSearchTodo(arrayTodos)
    };

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
                        <div className='grid grid-cols-3 gap-y-1'>
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
                          <td className="px-4 py-2">{row.nombre}</td>
                          <td className="px-4 py-2">{row.fecha}</td>
                        </tr>
                        {/* Renderiza la tabla de movimientos si el movimiento está seleccionado */}
                        {idSelectRepuestos === row.id && (
                          <tr className='bg-gray-300 border border-black'>
                            <td>
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

export default Operaciones