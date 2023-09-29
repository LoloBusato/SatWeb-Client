import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

function MovesSells() {
    const [payCategories, setPayCategories] = useState([])
    const [sellStock, setSellStock] = useState([])
    const [cuentasCategories, setCuentasCategories] = useState([])
    const [cuentasVueltoCategories, setCuentasVueltoCategories] = useState([])

    const [ventaId, setVentaId] = useState(0)
    const [cmvId, setcmvId] = useState(0)
    const [repuestosId, setRepuestosId] = useState(0)
    const [cajaId, setCajaId] = useState(0)
    const [cmvBelgId, setcmvBelgId] = useState(0)

    const [clients, setClients] = useState([])
    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')

    const [dolar, setDolar] = useState(500)

    const [showVuelto, setShowVuelto] = useState(false);
    
    const navigate = useNavigate();
    const branchId = JSON.parse(localStorage.getItem("branchId"))
    const userId = JSON.parse(localStorage.getItem("userId"))
    const username = localStorage.getItem("username")

    const [searchStock, setsearchStock] = useState([]);

    const [originalStock, setOriginalStock] = useState([]);
    const [codigoSearch, setCodigoSearch] = useState("");
    const [repuestoSearch, setRepuestoSearch] = useState("");
    const [proveedorSearch, setProveedorSearch] = useState("");
    
    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/movcategories`)
                .then(response => {
                    const tempCategories = {
                        pay: [],
                        };
            
                        response.data.forEach((category) => {
                            if (category.tipo.includes("Pagar")) {
                                tempCategories.pay.push(category);
                            }
                            switch (category.categories) {
                                case "Caja":
                                    setCajaId(category.idmovcategories)
                                    break;
                                case "CMVBelgrano":
                                    setcmvBelgId(category.idmovcategories)
                                    break
                                case "Repuestos": 
                                    setRepuestosId(category.idmovcategories)
                                    break
                                case "CMV": 
                                    setcmvId(category.idmovcategories)
                                    break
                                case "Venta":
                                    setVentaId(category.idmovcategories)
                                    break
                                default:
                                    break
                            }
                        });
                        const cuentas = response.data
                        .filter((cuenta) => cuenta.tipo.includes("Cuentas"))
                        .filter((cuenta) => cuenta.branch_id === branchId || cuenta.branch_id === null)
            
                        const cuentasVuelto = cuentas.map((cuenta) => ({
                            ...cuenta,
                            categories: `${cuenta.categories}Vuelto`
                        }))

                        setCuentasVueltoCategories(cuentasVuelto)
                        setCuentasCategories(cuentas)
                        setPayCategories(tempCategories.pay);
                })
                .catch(error => {
                    console.error(error)
                })

            await axios.get(`${SERVER}/stock/${branchId}`)
                .then(response => {
                    const filteredData = response.data.filter(item => item.repuesto.toLowerCase().includes("venta") && item.cantidad_restante > 0);
                    setSellStock(filteredData);
                    setsearchStock(filteredData)
                    setOriginalStock(filteredData)
                })
                .catch(error => {
                    console.error(error);
                    // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
                });

            await axios.get(`${SERVER}/clients`)
                .then(response => {
                    setClients(response.data)
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
        }
        fetchStates()
        // eslint-disable-next-line
    }, []);

    const [isNotLoading, setIsNotLoading] = useState(true);

    async function handleSubmit(event) {
        event.preventDefault();
        setIsNotLoading(true)
        if (isNotLoading) {
            setIsNotLoading(false)
            let client = "";
            let clientId = "";
            try {
                const fechaHoraBuenosAires = new Date().toLocaleString("en-IN", {timeZone: "America/Argentina/Buenos_Aires", hour12: false}).replace(',', '');

                if (repuestosArr.length < 1) {
                    setIsNotLoading(true)
                    return alert('Agregar repuestos para vender')
                }
                const formData = new FormData(event.target);
                const clientData = {
                    name: formData.get('name').trim(),
                    surname: formData.get('surname').trim(),
                    email: formData.get('email').trim(),
                    instagram: formData.get('instagram').trim(),
                    phone: formData.get('phone').trim(),
                    postal: formData.get('postal').trim(),
                };
                if (clientData.name === "" || clientData.surname === ""){
                    setIsNotLoading(true)
                    return alert("Agregar nombre y apellido al cliente")
                } else if(clientData.email === "" && clientData.instagram === "" && clientData.phone === "") {
                    setIsNotLoading(true)
                    return alert("Agregar algun metodo de contacto al cliente")
                } else{
                    const responseClient = await axios.post(`${SERVER}/clients`, clientData);
                    if (responseClient.status === 200){
                        clientId = responseClient.data[0].idclients
                        client = `${formData.get('name').trim()} ${formData.get('surname').trim()}`
                    } 
                }
    
                const cuentaVuelto = parseInt(document.getElementById("cuenta").value) || 0
    
                const cobrosValues = {}

                let ingresoTotal = 0
                cuentasCategories.forEach((cuenta) => {
                    const value = parseInt(document.getElementById(cuenta.categories).value) || 0
                    if (value !== 0) {
                        if (cobrosValues.hasOwnProperty(cuenta.idmovcategories)) {
                            if (cuenta.es_dolar === 1) {
                                cobrosValues[cuenta.idmovcategories] += (value * dolar)
                            } else {
                                cobrosValues[cuenta.idmovcategories] += value
                            }
                        } else {
                            if (cuenta.es_dolar === 1) {
                                cobrosValues[cuenta.idmovcategories] = (value * dolar)
                            } else {
                                cobrosValues[cuenta.idmovcategories] = value
                            }
                        }
                        if (cuenta.es_dolar === 1) {
                            ingresoTotal += (value * dolar)
                        } else {
                            ingresoTotal += value
                        }
                    }
                })

                let vueltoTotal = 0
                if (cuentaVuelto !== 0) {
                    cuentasVueltoCategories.forEach((cuenta) => {
                        const value = parseInt(document.getElementById(cuenta.categories).value) || 0
                        if (value !== 0) {
                            if (cuentaVuelto === cajaId) {
                                if (cobrosValues.hasOwnProperty(cuenta.idmovcategories)) {
                                    if (cuenta.es_dolar === 1) {
                                        cobrosValues[cuenta.idmovcategories] -= (value * dolar)
                                    } else {
                                        cobrosValues[cuenta.idmovcategories] -= value
                                    }
                                } else {
                                    if (cuenta.es_dolar === 1) {
                                        cobrosValues[cuenta.idmovcategories] = -(value * dolar)
                                    } else {
                                        cobrosValues[cuenta.idmovcategories] = -value
                                    }
                                }
                            } else {
                                if (cobrosValues.hasOwnProperty(cuentaVuelto)) {
                                    if (cuenta.es_dolar === 1) {
                                        cobrosValues[cuentaVuelto] -= (value * dolar)
                                    } else {
                                        cobrosValues[cuentaVuelto] -= value
                                    }
                                } else {
                                    if (cuenta.es_dolar === 1) {
                                        cobrosValues[cuentaVuelto] = -(value * dolar)
                                    } else {
                                        cobrosValues[cuentaVuelto] = -value
                                    }
                                }
                            }
                            if (cuenta.es_dolar === 1) {
                                vueltoTotal += (value * dolar)
                            } else {
                                vueltoTotal += value
                            }
                        }
                    })
                }

                if (vueltoTotal !== 0 && cuentaVuelto === 0) {
                    setIsNotLoading(true)
                    return alert('Agregar caja para el vuelto')
                }

                const montoTotal = ingresoTotal - vueltoTotal

                if(montoTotal === 0) {
                    setIsNotLoading(true)
                    return alert('Agregar valores para continuar')
                } else if (montoTotal < 0){
                    setIsNotLoading(true)
                    const result = window.confirm('¿Estás seguro de que el resultado de la venta tiene valor negativo?');
                    if(!result) {
                        return alert('Cambiar valores de vuelto y cuenta para que el valor sea positivo')
                    }
                }
    
                const arrayMovements = []
                cuentasCategories.forEach(cuenta => {
                    if (cobrosValues.hasOwnProperty(cuenta.idmovcategories)) {
                        if (cuenta.es_dolar === 1) {
                            return arrayMovements.push([cuenta.idmovcategories, (cobrosValues[cuenta.idmovcategories] / dolar).toFixed(2)])
                        } else {
                            return arrayMovements.push([cuenta.idmovcategories, cobrosValues[cuenta.idmovcategories]])
                        }
                    }
                })
                
                const cmvBelg = repuestosArr.filter((repuesto) => repuesto.original_branch === 1).reduce((accumulator, currentValue) => accumulator + parseInt(currentValue.precio_compra), 0)
                if(cmvBelg > 0 && branchId !== 1) {
                    arrayMovements.push([cmvBelgId, cmvBelg])
                }

                // movname
                arrayMovements.push([ventaId, -montoTotal])
                if (valorRepuestosUsd > 0) {
                    arrayMovements.push([cmvId, parseFloat(valorRepuestosUsd)])
                    arrayMovements.push([repuestosId, -parseFloat(valorRepuestosUsd)])
                }

                // ReduceStock
                const reduceArr = repuestosArr.reduce((accumulator, item) => {
                    if (!accumulator[item.stockbranchid]) {
                        accumulator[item.stockbranchid] = 1;
                    } else {
                        accumulator[item.stockbranchid] += 1
                    }
                    return accumulator;
                }, {});
                const reduceStockArr = []
    
                for (let key in reduceArr) {
                    const selectedItem = originalStock.find((item) => item.stockbranchid === parseInt(key));
                    selectedItem.cantidad_restante -= reduceArr[key] 
                    reduceStockArr.push(selectedItem)
                }

                const updateStockArr = []
                const insertReduceArr = []
                reduceStockArr.forEach(item => {
                    updateStockArr.push([item.cantidad_restante,item.stockbranchid])
                    insertReduceArr.push([userId, item.stockbranchid, fechaHoraBuenosAires])
                });                
                
                const operacion = repuestosArr.reduce((acum, valor) => {
                    return acum !== '' ? acum + ' - ' + valor.repuesto : valor.repuesto;
                }, '')
                const valuesCreateMovename = [
                    "Caja", // ingreso
                    "Venta", // egreso
                    `${operacion} ${client}`, // operacion
                    montoTotal, // monto
                    fechaHoraBuenosAires, // fecha
                    userId, // userId
                    branchId, // branch_id
                ]
                const insertOrder = [
                    clientId,
                    419, 
                    branchId, 
                    fechaHoraBuenosAires.split(' ')[0], 
                    fechaHoraBuenosAires.split(' ')[0], 
                    6, 
                    'no aplica', 
                    'no aplica', 
                    'no aplica', 
                    'no aplica', 
                    18,
                    'no aplica',
                ]

                const movesSellsData = {
                    valuesCreateMovename,
                    insertOrder,
                    arrayMovements,
                    updateStockArr,
                    insertReduceArr,
                    branch_id: branchId,
                    fecha: fechaHoraBuenosAires
                }
                
                await axios.post(`${SERVER}/movname/movesSells`, movesSellsData)
                    .then((response) => {
                        setIsNotLoading(true)
                        alert("Venta agregada")
                        navigate('/movements');
                    })
                    .catch((err) => {
                        setIsNotLoading(true)
                        alert(err)
                    })
            } catch (error) {
                setIsNotLoading(true)
                alert(error.response.data);
            }
        }
    }

    const handleClienteSeleccionado = (cliente) => {
        setNombre(cliente.name);
        setApellido(cliente.surname);
        document.getElementById("instagram").value = cliente.instagram;
        document.getElementById("email").value = cliente.email;
        document.getElementById("phone").value = cliente.phone;
        document.getElementById("postal").value = cliente.postal;
    };

    async function handleSearch () {
        setsearchStock(sellStock.filter((item) => 
            (item.idstock === parseInt(codigoSearch) || codigoSearch === "") &&
            item.repuesto.toLowerCase().includes(repuestoSearch.toLowerCase()) &&
            item.nombre.toLowerCase().includes(proveedorSearch.toLowerCase()) 
        ));
    };

    const [repuestosArr, setRepuestosArr] = useState([])

    const [indiceRepuesto, setIndiceRepuesto] = useState(1)

    async function agregarRepuesto(id, orderId, username) {
        
        const selectedItem = sellStock.find((item) => item.idstock === id);
        
        if (selectedItem.cantidad_restante > 0) {
            selectedItem.orderId = orderId
            selectedItem.username = username
            selectedItem.indice = indiceRepuesto
            setIndiceRepuesto(indiceRepuesto + 1)

            const updatedStock = sellStock.map((item) => {
                if (item.idstock === id && item.cantidad_restante > 0) {
                    return { ...item, cantidad_restante: item.cantidad_restante - 1 };
                }
                return item;
            });
          
            setRepuestosArr([...repuestosArr, selectedItem]);
            setSellStock(updatedStock);
            setsearchStock(updatedStock)
            
            const repuestosUsd = [...repuestosArr, selectedItem].reduce((accumulator, currentValue) => accumulator + parseFloat(currentValue.precio_compra), 0)
            setValorRepuestosUsd(repuestosUsd)
        } else {
            return alert('Nao nao garoto, no se pueden seleccionar repuestos con cantidad 0')
        }
    }

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
        }
    };

    const eliminarRepuesto = (indice, stockbranchid) => {
        try {            
            const updatedStock = sellStock.map((item) => {
                if (item.stockbranchid === stockbranchid) {
                    return { ...item, cantidad_restante: item.cantidad_restante + 1 };
                }
                return item;
            });
            const repuestosArrFiltered = repuestosArr.filter(item => item.indice !== indice)

            setRepuestosArr(repuestosArrFiltered)
            setSellStock(updatedStock);
            setsearchStock(updatedStock)
            
            const repuestosUsd = repuestosArrFiltered.reduce((accumulator, currentValue) => accumulator + parseFloat(currentValue.precio_compra), 0)
            setValorRepuestosUsd(repuestosUsd)
        } catch (error) {
            console.error(error)
        }
    }
    const [valorRepuestosUsd, setValorRepuestosUsd] = useState(0);
    const [verRepuestosCheck, setVerRepuestosCheck] = useState(true)
    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className='bg-white my-2 py-8 px-2 max-w-4xl mx-auto'>
                <h1 className="text-center text-5xl">Ventas</h1>
                {/* Ventas */}
                <div className="p-4 max-w-5xl mx-auto">
                    <form onSubmit={handleSubmit} onKeyDown={handleKeyPress} className="mb-4">
                        <div className="mb-2">
                            {/* Cliente */}
                            <div className="mb-1 p-2 bg-blue-100">
                                    <label>Cliente</label>
                                    <div className='flex'>
                                        <div className='w-full'>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Nombre: *</label>
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="text" 
                                                id="name" 
                                                name="name" 
                                                placeholder="John"
                                                value={nombre}
                                                onChange={(event) => setNombre(event.target.value)}
                                            />  
                                        </div>
                                        <div className='w-full'>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor="surname">Apellido: *</label>
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="text" 
                                                id="surname" 
                                                name="surname" 
                                                placeholder="Doe"
                                                value={apellido}
                                                onChange={(event) => setApellido(event.target.value)}
                                            />
                                        </div>
                                    </div>
                                    {nombre &&  (
                                        <ul className='bg-gray-100 absolute'>
                                            {clients
                                                .filter((client) => 
                                                    String(client.name).toLowerCase().includes(nombre.toLowerCase()) &&
                                                    String(client.surname).toLowerCase().includes(apellido.toLowerCase())
                                                    )
                                                .map((client) => 
                                                    <li className='border px-2 py-1' key={`${client.idclients} ${client.username}`} onClick={() => handleClienteSeleccionado(client)}>{client.name} {client.surname} - {client.email} {client.instagram} {client.phone}</li>
                                            )}
                                        </ul>
                                    )}
                                    <label className="flex justify-center text-gray-700 font-bold mt-2" htmlFor="contacto">Contacto *</label>
                                    <div className='flex'>
                                        <div className='w-full'>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor="email">Instagram:</label>
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="text" 
                                                id="instagram" 
                                                placeholder="thedoniphone"
                                                name="instagram" 
                                            />
                                        </div>
                                        <div className='w-full'>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor="email">Telefono:</label>                        
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="text" 
                                                id="phone" 
                                                name="phone" 
                                                placeholder="xx-xxxx-xxxx"
                                            />
                                        </div>
                                        <div className='w-full'>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor="email">Email:</label>
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="text" 
                                                id="email" 
                                                name="email" 
                                                placeholder="xxx@xxx.com"
                                            />  
                                        </div>
                                    </div>
                                    <label className="block text-gray-700 font-bold my-2" htmlFor="email">Codigo Postal: (opcional)</label>                        
                                    <input 
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                        type="text" 
                                        id="postal" 
                                        name="postal" 
                                        placeholder="1427"
                                    />
                            </div>           
                            {/* Agregar repuestos */}
                            <div className="bg-blue-100 mb-1 p-2">
                                <label className='font-bold text-lg'>
                                    Repuestos
                                </label>
                                <div className='flex justify-center mb-4'>
                                    {/* Tabla para dispositivos de tamanio sm y mayor */}
                                    <table className="table-auto hidden md:block bg-gray-200">
                                        <thead>
                                            <tr>
                                                <th className="px-4 py-2">Código</th>
                                                <th className="px-4 py-2">Repuesto</th>
                                                <th className="px-4 py-2">Precio (USD)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {repuestosArr.map(stock => (
                                                <tr key={`${stock.stockbranchid} ${stock.repuesto} ${stock.indice}`} >
                                                    <td className="border px-4 py-2 text-center" value={stock.idstock}>{stock.idstock}</td>
                                                    <td className="border px-4 py-2" value={stock.repuesto}>{stock.repuesto}</td>
                                                    <td className="border px-4 py-2 text-center" value={stock.precio_compra}>{stock.precio_compra}</td>
                                                    <td>
                                                        <button type="button" className="bg-red-500 border px-4 py-2 color" onClick={() => eliminarRepuesto(stock.indice, stock.stockbranchid)}>Eliminar</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {/* Tabla colapsable para dispositivos pequeños */}
                                    <div className="md:hidden">
                                        {repuestosArr.map(stock => (
                                            <details key={`${stock.stockbranchid} ${stock.repuesto} ${stock.indice}`} className="border mb-1 rounded">
                                                <summary className="px-4 py-2 cursor-pointer outline-none">
                                                    {stock.idstock} - {stock.repuesto} - {stock.precio_compra}
                                                </summary>
                                                <div className=" bg-gray-100">
                                                    <button type="button" className="bg-red-500 border w-full px-4 py-2 color" onClick={() => eliminarRepuesto(stock.indice, stock.stockbranchid)}>Eliminar</button>
                                                </div>
                                            </details>
                                        ))}
                                    </div>
                                </div>
                                {/* Ocultar/Ver repuestos */}
                                <div className='flex justify-center mb-5'>
                                    <button
                                    type="button"
                                    onClick={() => setVerRepuestosCheck(!verRepuestosCheck)}
                                    className="px-4 py-2 text-white bg-indigo-500 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                    >
                                        Ver/Ocultar Repuestos
                                    </button>
                                </div>
                                {/* Agregar repuestos */}
                                {verRepuestosCheck && (
                                    <div>                         
                                        {/* Buscador de repuestos */}
                                        <div className='flex justify-center'>
                                            <div className="flex flex-col md:flex-row gap-4 justify-center mb-10">
                                                <input
                                                    className="px-4 py-2 rounded-lg shadow-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                    type="text"
                                                    placeholder="Buscar por Codigo"
                                                    value={codigoSearch}
                                                    onChange={(e) => setCodigoSearch(e.target.value)}
                                                />
                                                <input
                                                    className="px-4 py-2 rounded-lg shadow-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                    type="text"
                                                    placeholder="Buscar por repuesto"
                                                    value={repuestoSearch}
                                                    onChange={(e) => setRepuestoSearch(e.target.value)}
                                                />
                                                <input
                                                    className="px-4 py-2 rounded-lg shadow-md border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                                                    type="text"
                                                    placeholder="Buscar por proveedor"
                                                    value={proveedorSearch}
                                                    onChange={(e) => setProveedorSearch(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleSearch()}
                                                    className="px-4 py-2 text-white bg-indigo-500 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                                >
                                                    Buscar
                                                </button>
                                            </div>
                                        </div>
                                        {/* Tabla de repuestos */}
                                        <div className="flex justify-center mb-10">
                                            {/* Tabla para dispositivos de tamanio sm y mayor */}
                                            <table className="table-auto hidden md:block bg-gray-200">
                                                <thead>
                                                    <tr>
                                                        <th className="px-4 py-2">Cod</th>
                                                        <th className="px-4 py-2">Repuesto</th>
                                                        <th className="px-4 py-2">Cantidad</th>
                                                        <th className="px-4 py-2">Precio (USD)</th>
                                                        <th className="px-4 py-2">Proveedor</th>
                                                        <th className="px-4 py-2">Fecha (aaaa/mm/dd)</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {searchStock.map(stock => (
                                                        <tr key={`${stock.idstock} ${stock.repuesto} Search`} onClick={() => agregarRepuesto(stock.idstock, null, username)}>
                                                            <td className="border px-4 py-2" values={stock.idstock}>
                                                                {stock.idstock} 
                                                            </td>
                                                            <td className="border px-4 py-2" value={stock.repuesto}>{stock.repuesto}</td>
                                                            <td className={`${stock.cantidad <= stock.cantidad_limite ? "bg-red-600" : ""} border px-4 py-2 text-center`} value={stock.cantidad_restante}>{stock.cantidad_restante}</td>
                                                            <td className="border px-4 py-2 text-center" value={stock.precio_compra}>{stock.precio_compra}</td>
                                                            <td className="border px-4 py-2" value={stock.nombre}>{stock.nombre}</td>
                                                            <td className="border px-4 py-2 text-center" value={stock.fecha_compra}>{stock.fecha_compra.slice(0, 10)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {/* Tabla colapsable para dispositivos pequeños */}       
                                            <div className="md:hidden">
                                                {searchStock.map((stock, index) => (
                                                    <details key={`${stock.idstock} ${index} `} className="border mb-1 rounded">
                                                        <summary className="px-4 py-2 cursor-pointer outline-none">
                                                            {stock.idstock} - {stock.repuesto} - {stock.cantidad_restante}
                                                        </summary>
                                                        <div className="bg-gray-100 flex flex-col items-center">
                                                                <p className="border px-4 py-2 text-center" value={stock.precio_compra}>{stock.precio_compra}</p>
                                                                <p className="border px-4 py-2" value={stock.nombre}>{stock.nombre}</p>
                                                                <p className="border px-4 py-2 text-center" value={stock.fecha_compra}>{stock.fecha_compra.slice(0, 10)}</p>
                                                                <button
                                                                type='button'
                                                                className="px-4 py-2 text-white bg-green-500 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
                                                                onClick={() => agregarRepuesto(stock.idstock, null, username)}>
                                                                    Agregar
                                                                </button>
                                                        </div>
                                                    </details>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Costo de los repuestos */}
                            <div className='flex items-end bg-blue-100 mb-1 p-2'>
                                <div className='flex flex-col w-full items-center'>
                                    <label>Costo de los repuestos en dolares</label>
                                    <label className='font-bold'>${valorRepuestosUsd}</label>
                                </div>
                                <div className='flex flex-col w-full items-center'>
                                    <label>Costo de los repuestos en pesos</label>
                                    <label className='font-bold'>${(valorRepuestosUsd * dolar).toFixed(2)}</label>
                                </div>
                            </div>
                            {/* Valores Cliente */}
                            <div className='flex items-end bg-blue-100 mb-1 p-2'>
                                <div className='w-full text-center'>
                                    <label className="block text-gray-700 font-bold mb-2 border-b-2">Pago *</label>
                                    <div className='flex'>
                                    {cuentasCategories.map((category) => (
                                        <div className='w-full' key={category.idmovcategories}>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor={category.categories}>{category.categories}:</label>
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="number"
                                                step="1" 
                                                min="0"
                                                id={category.categories}
                                                name={category.categories}
                                            />
                                        </div>     
                                    ))}                            
                                    </div>
                                </div>
                            </div>
                            {/* Valores Vuelto */}
                            <div className='flex items-end bg-blue-100 mb-1 p-2'>
                                <div className='w-2/12'>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Cuenta: *</label>
                                    <select onChange={(e) => setShowVuelto(e.target.value !== '')} name="cuenta" id="cuenta" defaultValue={""} className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline' >
                                        <option value="" disabled >Cuenta</option>
                                        {payCategories.map((category) => (
                                            <option key={`${category.idmovcategories} Categories`} value={category.idmovcategories}>{category.categories}</option>
                                        ))}
                                    </select>
                                </div>
                                {showVuelto && (
                                <div className='w-full text-center'>
                                    <label className="block text-gray-700 font-bold mb-2 border-b-2">Vuelto *</label>
                                    <div className='flex'>
                                    {cuentasVueltoCategories.map((category) => (
                                        <div className='w-full' key={`vuelto${category.idmovcategories}`}>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor={category.categories}>{category.categories}:</label>
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="number"
                                                step="1" 
                                                min="0"
                                                id={category.categories}
                                                name={category.categories}
                                            />
                                        </div>     
                                    ))}                                 
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>
                        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                            Guardar
                        </button>
                        <button 
                            type="button"
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

export default MovesSells