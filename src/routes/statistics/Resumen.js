import React, {useState, useEffect} from 'react'
import axios from 'axios'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

function Resumen() {

    const [allMovements, setAllMovements] = useState([])
    const [movname, setMovname] = useState([])

    const [categoriesDicc, setCategoriesDicc] = useState([])
    const [proveedoresDicc, setProveedoresDicc] = useState([])
    const [cuentasDicc, setCuentasDicc] = useState([])

    const [cuentasCategories, setCuentasCategories] = useState([])
    const [proveedoresCategories, setProveedoresCategories] = useState([])

    const [fechaInicioSearch, setFechaInicioSearch] = useState("");
    const [fechaFinSearch, setFechaFinSearch] = useState("");

    const [dolar, setDolar] = useState(500)
    const branchId = JSON.parse(localStorage.getItem('branchId'))
    const permisos = JSON.stringify(localStorage.getItem("permisos"))
    const [ganancia, setGanancia] = useState(1)

    const [precioTotalRepuestos, setPrecioTotalRepuestos] = useState(0)

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/movements/${branchId}`)
                .then(response => {
                  setAllMovements(response.data)
                })
                .catch(error => {
                    console.error(error)
                })
                
            await axios.get(`https://api.bluelytics.com.ar/v2/latest`)
            .then(response => {
                setDolar(response.data.blue.value_sell)
            })
            .catch(error => {
                console.error(error)
            })

            await axios.get(`${SERVER}/movname/${branchId}`)
                .then(response => {
                    setMovname(response.data)
                })
                .catch(error => {
                    console.error(error)
                })

            await axios.get(`${SERVER}/movcategories`)
                .then(response => {
                    const categories = {}
                    response.data.forEach(element => {
                        categories[element.categories] = 0;
                    });
                    setCategoriesDicc(categories)

                    const cuentas = response.data
                    .filter((cuenta) => cuenta.tipo.includes("Cuentas"))
                    .filter((cuenta) => cuenta.branch_id === branchId || cuenta.branch_id === null)
                    setCuentasCategories(cuentas)

                    const proveedores = response.data
                    .filter((cuenta) => cuenta.tipo.includes("Proveedores"))
                    .filter((cuenta) => cuenta.branch_id === branchId || cuenta.branch_id === null)
                    setProveedoresCategories(proveedores)
                })
                .catch(error => {
                    console.error(error)
                })

            await axios.get(`${SERVER}/stock/${branchId}`)
                .then(response => {
                  const repuestosSucursal = response.data
                  const valorRepuestos = repuestosSucursal.reduce((acum, valor) => {
                      return acum + (valor.cantidad_restante * parseFloat(valor.precio_compra))
                  }, 0)
                  setPrecioTotalRepuestos(valorRepuestos.toFixed(2))
              })
                .catch(error => {
                  console.error(error);
              });

            await axios.get(`${SERVER}/branches`)
              .then(response => {
                  const ganancia = response.data.filter((branch) => branch.idbranches === branchId)[0].ganancia
                  setGanancia(ganancia)
              })
              .catch(error => {
                  console.error(error);
              });
        }
        fetchStates()
    // eslint-disable-next-line
    }, []);

    const handleSearch = (event) => {
        event.preventDefault();
        const parcialdicc = {}
        for (const clave in categoriesDicc) {
            if (categoriesDicc.hasOwnProperty(clave)) {
                parcialdicc[clave] = 0;
            }
        }
        movname.forEach((item) => {
            const fecha = item.fecha.split(' ')[0];
            const [dia, mes, anio] = fecha.split("/")
            const createdAt = new Date(anio, mes - 1, dia);

            // Verificar si la fecha está dentro del rango
            const isWithinRangeDate = (!fechaInicioSearch || createdAt >= new Date(fechaInicioSearch)) && (!fechaFinSearch || createdAt <= new Date(fechaFinSearch));

            if (isWithinRangeDate) {
                allMovements.forEach((movement) => {
                    if(movement.movname_id === item.idmovname){
                        parcialdicc[movement.categories] += parseFloat(movement.unidades);
                    }
                })
            }
        });

        const proveedoresDicc = []
        proveedoresCategories.forEach(element => {
            const parcialValue = allMovements.reduce((acum, valor) => {
                if (valor.categories === element.categories) {
                    acum += parseFloat(valor.unidades)
                }
                return acum
            }, 0)
            proveedoresDicc.push([element.categories, parcialValue.toFixed(2)])
        });
        setProveedoresDicc(proveedoresDicc)

        const cuentasDicc = []
        cuentasCategories.forEach(element => {
            cuentasDicc.push([element.categories, parcialdicc[element.categories].toFixed(2)])
        });
        setCuentasDicc(cuentasDicc)

        parcialdicc['Repuestos'] = parseFloat(precioTotalRepuestos).toFixed(2)
        setCategoriesDicc(parcialdicc)
    };

    console.log(categoriesDicc)
    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className="bg-white my-2 px-2 max-w-7xl mx-auto">
              <div className='text-center'>
                <h1 className="text-5xl font-bold py-8">Resumen</h1>
                {/* Buscador */}
                <div className="border border-gray-300">
                    <form onSubmit={handleSearch} className="p-1 bg-blue-100">
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-y-1'>
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
                <div className='grid grid-cols-1 py-4 md:grid-cols-3 gap-4 content-center'>
                    {/* Caja */}
                    <div className='grid grid-cols-3'>
                        {cuentasDicc.map((element) => (
                            <div key={element[0]} className='border border-black'>
                                <p className='font-bold'>{element[0]}</p>
                                <p>{element[1]}</p>
                            </div>
                        ))}
                    </div>
                    {permisos.includes("Contabilidad") && (
                        <>
                        {/* Ganancia */}
                        <div>
                            <div>
                                <div className='border border-black'>
                                    <h1 className='font-bold'>Ganancia (Pesos)</h1>
                                    <h1>Ventas + Reparaciones - Costo Mercaderia Vendida (CMV) </h1>
                                    <h1>{(-parseInt(categoriesDicc.CMV)*dolar) - parseInt(categoriesDicc.Venta) - parseInt(categoriesDicc.Reparaciones)}</h1>                                </div>
                            </div>
                        </div>
                        {/* Repuestos */}
                        <div>
                            <div className='border border-black'>
                                <h1 className='font-bold'>Repuestos (USD)</h1>
                                <h1>{categoriesDicc.Repuestos}</h1>
                            </div>
                            {branchId !== 1 && (
                            <div className='border border-black'>
                                <h1 className='font-bold'>LLEVAR A BELGRANO (PESOS)</h1>
                                <h1>{((-parseInt(categoriesDicc.Venta) - parseInt(categoriesDicc.Reparaciones) - parseInt(categoriesDicc.Alquiler) - parseInt(categoriesDicc.Envios) - parseInt(categoriesDicc.Comida) - parseInt(categoriesDicc.Sueldos) - parseInt(categoriesDicc.Varios) - (parseInt(categoriesDicc.CMV)*dolar))*ganancia) + (parseInt(categoriesDicc.CMVBelgrano)*dolar)}</h1>                            </div>
                            )}
                        </div>
                        {/* Proveedores */}
                        <div className='grid grid-cols-3'>
                            {proveedoresDicc.map((element) => (
                                <div key={element[0]} className='border border-black'>
                                    <p className='font-bold'>{element[0]}</p>
                                    <p>{element[1]}</p>
                                </div>
                            ))}
                        </div>
                        {/* Costos Fijos */}
                        <div>
                            <div className='grid grid-cols-3'>
                                <div className='border border-black'>
                                    <h1 className='font-bold'>Obelisco</h1>
                                    <h1>{categoriesDicc.Obelisco}</h1>
                                </div>
                                <div className='border border-black'>
                                    <h1 className='font-bold'>Publicidad</h1>
                                    <h1>{categoriesDicc.Publicidad}</h1>
                                </div>
                                <div className='border border-black'>
                                    <h1 className='font-bold'>Alquiler</h1>
                                    <h1>{categoriesDicc.Alquiler}</h1>
                                </div>
                                <div className='border border-black'>
                                    <h1 className='font-bold'>Sueldos</h1>
                                    <h1>{categoriesDicc.Sueldos}</h1>
                                </div>
                            </div>
                        </div>
                        {/* Varios */}
                        <div>
                            <div className='grid grid-cols-3'>
                                <div className='border border-black'>
                                    <h1 className='font-bold'>Varios</h1>
                                    <h1>{categoriesDicc.Varios}</h1>
                                </div>
                                <div className='border border-black'>
                                    <h1 className='font-bold'>Garantias</h1>
                                    <h1>{categoriesDicc.Garantia}</h1>
                                </div>
                                <div className='border border-black'>
                                    <h1 className='font-bold'>Comida</h1>
                                    <h1>{categoriesDicc.Comida}</h1>
                                </div>
                                <div className='border border-black'>
                                    <h1 className='font-bold'>Envios</h1>
                                    <h1>{categoriesDicc.Envios}</h1>
                                </div>
                            </div>
                        </div>
                        </>
                    )}
                </div>
              </div>
            </div>
        </div>
    );
}

export default Resumen