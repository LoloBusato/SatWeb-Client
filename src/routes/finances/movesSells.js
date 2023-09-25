import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

function MovesSells() {
    const [payCategories, setPayCategories] = useState([])
    const [sellStock, setSellStock] = useState([])
    const [ventaId, setVentaId] = useState(0)
    const [cmvId, setcmvId] = useState(0)
    const [repuestosId, setRepuestosId] = useState(0)
    const [cajaId, setCajaId] = useState(0)
    const [pesosId, setPesosId] = useState(0)
    const [usdId, setusdId] = useState(0)
    const [mpId, setmpId] = useState(0)
    const [bancoId, setBancoId] = useState(0)
    const [cmvBelgId, setcmvBelgId] = useState(0)

    const [clients, setClients] = useState([])
    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')

    const [dolar, setDolar] = useState(500)
    const branchId = JSON.parse(localStorage.getItem("branchId"))

    const navigate = useNavigate();

    const [searchStock, setsearchStock] = useState([]);

    const [originalStock, setOriginalStock] = useState([]);
    const [codigoSearch, setCodigoSearch] = useState("");
    const [repuestoSearch, setRepuestoSearch] = useState("");
    const [proveedorSearch, setProveedorSearch] = useState("");
    
    const username = localStorage.getItem("username")
    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/movcategories`)
                .then(response => {
                    for (let i = 0; i < response.data.length; i++) {
                        if (response.data[i].tipo.includes("Pagar")) {
                            setPayCategories(prevArray => [...prevArray, response.data[i]])
                        }
                        if(response.data[i].categories === "Venta") {
                            setVentaId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "CMV") {
                            setcmvId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "Repuestos") {
                            setRepuestosId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "Caja") {
                            setCajaId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "Pesos") {
                            setPesosId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "Dolares") {
                            setusdId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "MercadoPago") {
                            setmpId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "Banco") {
                            setBancoId(response.data[i].idmovcategories)
                        } else if(response.data[i].categories === "CMVBelgrano") {
                            setcmvBelgId(response.data[i].idmovcategories)
                        } 
                    }
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
        if (isNotLoading) {
            setIsNotLoading(false)
            let client = "";
            try {
                const userId = JSON.parse(localStorage.getItem("userId"))
    
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
                        client = `${formData.get('name').trim()} ${formData.get('surname').trim()}`
                    } 
                }
                if (repuestosArr.length < 1) {
                    setIsNotLoading(true)
                    return alert('Agregar repuestos para vender')
                }
    
                const cuentaVuelto = parseInt(document.getElementById("cuenta").value)
    
                const valueUsd = parseFloat(formData.get('clienteUSD')) || 0
                const valuePesos = parseFloat(formData.get('clientePesos')) || 0
                const valueTrans = parseFloat(formData.get('clienteBanco')) || 0
                const valueMp = parseFloat(formData.get('clienteMercadopago')) || 0
                const vueltoUsd = -parseFloat(formData.get('cajaUSD')) || 0
                const vueltoPesos = -parseFloat(formData.get('cajaPesos')) || 0
                const vueltoTrans = -parseFloat(formData.get('cajaBanco')) || 0
                const vueltoMp = -parseFloat(formData.get('cajaMercadopago')) || 0
                
                const dolarArr = [valueUsd, vueltoUsd]
                const pesosArr = [valuePesos, valueTrans, valueMp, vueltoPesos, vueltoTrans, vueltoMp]
    
                const montoUSD = dolarArr.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
                const montoPesos = pesosArr.reduce((accumulator, currentValue) => accumulator + currentValue, 0)
                const montoTotal = montoPesos + (montoUSD * dolar)

                const sumaVuelto = vueltoUsd + vueltoPesos + vueltoTrans + vueltoMp

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

                if (sumaVuelto !== 0 && isNaN(cuentaVuelto)) {
                    setIsNotLoading(true)
                    return alert('Agregar caja para el vuelto')
                }
    
                const arrayMovements = []
                const fechaHoraBuenosAires = new Date().toLocaleString("en-IN", {timeZone: "America/Argentina/Buenos_Aires", hour12: false}).replace(',', '');
                const operacion = repuestosArr.reduce((acum, valor) => {
                    return acum !== '' ? acum + ' - ' + valor.repuesto : valor.repuesto;
                }, '')
                
                const cmvBelg = repuestosArr.filter((repuesto) => repuesto.original_branch === 1).reduce((accumulator, currentValue) => accumulator + parseInt(currentValue.precio_compra), 0)
                if(cmvBelg > 0 && branchId !== 1) {
                    arrayMovements.push([cmvBelgId, cmvBelg, branchId])
                }

                // movname
                arrayMovements.push([ventaId, -montoTotal, branchId])
                if (valorRepuestosUsd > 0) {
                    arrayMovements.push([cmvId, parseFloat(valorRepuestosUsd), branchId])
                    arrayMovements.push([repuestosId, -parseFloat(valorRepuestosUsd), branchId])
                }
                //libro
                if (valueUsd !== 0){
                    arrayMovements.push([usdId, valueUsd, branchId])
                }
                if (valueTrans !== 0){
                    arrayMovements.push([bancoId, valueTrans, branchId])
                }
                if (valuePesos !== 0){
                    arrayMovements.push([pesosId, valuePesos, branchId])
                }
                if (valueMp !== 0){
                    arrayMovements.push([mpId, valueMp, branchId])
                }
                if (cuentaVuelto === cajaId) {
                    if (vueltoUsd !== 0){
                        arrayMovements.push([usdId, vueltoUsd, branchId])
                    }
                    if (vueltoTrans !== 0){
                        arrayMovements.push([bancoId, vueltoTrans, branchId])
                    }
                    if (vueltoPesos !== 0){
                        arrayMovements.push([pesosId, vueltoPesos, branchId])
                    }
                    if (vueltoMp !== 0){
                        arrayMovements.push([mpId, vueltoMp, branchId])
                    }
                } else {
                    const vuelto = (vueltoUsd * dolar) + vueltoTrans + vueltoPesos + vueltoMp
                    if (vuelto !== 0){
                        arrayMovements.push([cuentaVuelto, vuelto, branchId])
                    }
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

                const valuesCreateMovename = [
                    "Caja", // ingreso
                    "Venta", // egreso
                    `${operacion} ${client}`, // operacion
                    montoTotal, // monto
                    fechaHoraBuenosAires, // fecha
                    userId, // userId
                    branchId, // branch_id
                ]
                const insertClient = [
                    formData.get('name').trim(),
                    formData.get('surname').trim(),
                    formData.get('email').trim(),
                    formData.get('instagram').trim(),
                    formData.get('phone').trim(),
                    formData.get('postal').trim(),
                ]
                const clientCheck = [
                    formData.get('name').trim(),
                    formData.get('surname').trim(),
                    formData.get('email').trim(),
                    formData.get('instagram').trim(),
                    formData.get('phone').trim(),
                ]
                const insertOrder = [
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
                let cobrosValuesArr;
                if (isNaN(cuentaVuelto)) {
                    cobrosValuesArr = [
                        fechaHoraBuenosAires,
                        valuePesos,
                        valueUsd,
                        valueTrans,
                        valueMp,
                        0,
                    ]
                } else if (cuentaVuelto === cajaId) {
                    cobrosValuesArr = [
                        fechaHoraBuenosAires,
                        valuePesos + vueltoPesos,
                        valueUsd + vueltoUsd,
                        valueTrans + vueltoTrans,
                        valueMp + vueltoMp,
                        0,
                    ]
                } else {
                    cobrosValuesArr = [
                        fechaHoraBuenosAires,
                        valuePesos,
                        valueUsd,
                        valueTrans,
                        valueMp,
                        vueltoPesos + vueltoUsd + vueltoTrans + vueltoMp ,
                    ]
                }

                const movesSellsData = {
                    insertClient,
                    clientCheck,
                    valuesCreateMovename,
                    insertOrder,
                    arrayMovements,
                    updateStockArr,
                    insertReduceArr,
                    cobrosValuesArr
                }
                
                console.log(movesSellsData)
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
                                    <label className='font-bold'>${valorRepuestosUsd * dolar}</label>
                                </div>
                            </div>
                            {/* Valores Cliente */}
                            <div className='flex items-end bg-blue-100 mb-1 p-2'>
                                <div className='w-full text-center'>
                                    <label className="block text-gray-700 font-bold mb-2 border-b-2">Pago *</label>
                                    <div className='flex'>
                                        <div className='w-full'>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Pesos:</label>
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="number"
                                                step="0.01" 
                                                defaultValue="0"
                                                id="clientePesos" 
                                                name='clientePesos'
                                                min="0"
                                            />
                                        </div>     
                                        <div className='w-full'>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor="name">USD:</label>
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="number"
                                                step="0.01" 
                                                defaultValue="0"
                                                id="clienteUSD" 
                                                name='clienteUSD'
                                                min="0"
                                            />
                                        </div>    
                                        <div className='w-full'>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Banco:</label>
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="number"
                                                step="0.01" 
                                                defaultValue="0"
                                                id="clienteBanco" 
                                                name='clienteBanco'
                                                min="0"
                                            />
                                        </div>
                                        <div className='w-full'>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor="name">MercadoPago:</label>
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="number"
                                                step="0.01" 
                                                defaultValue="0"
                                                id="clienteMercadopago" 
                                                name='clienteMercadopago'
                                                min="0"
                                            />
                                        </div>                                
                                    </div>
                                </div>
                            </div>
                            {/* Valores Vuelto */}
                            <div className='flex items-end bg-blue-100 mb-1 p-2'>
                                <div className='w-1/2'>
                                    <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Cuenta: *</label>
                                    <select name="cuenta" id="cuenta" defaultValue={""} className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline' >
                                        <option value="" disabled >Cuenta</option>
                                        {payCategories.map((category) => (
                                            <option key={`${category.idmovcategories} Categories`} value={category.idmovcategories}>{category.categories}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className='w-full text-center'>
                                    <label className="block text-gray-700 font-bold mb-2 border-b-2">Vuelto *</label>
                                    <div className='flex'>
                                        <div className='w-full'>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Pesos:</label>
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="number"
                                                step="0.01" 
                                                defaultValue="0"
                                                id="cajaPesos" 
                                                name='cajaPesos'
                                                min="0"
                                            />
                                        </div>     
                                        <div className='w-full'>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor="name">USD:</label>
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="number"
                                                step="0.01" 
                                                defaultValue="0"
                                                id="cajaUSD" 
                                                name='cajaUSD'
                                                min="0"
                                            />
                                        </div>    
                                        <div className='w-full'>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Banco:</label>
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="number"
                                                step="0.01" 
                                                defaultValue="0"
                                                id="cajaBanco" 
                                                name='cajaBanco'
                                                min="0"
                                            />
                                        </div>
                                        <div className='w-full'>
                                            <label className="block text-gray-700 font-bold mb-2" htmlFor="name">MercadoPago:</label>
                                            <input 
                                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                                                type="number"
                                                step="0.01" 
                                                defaultValue="0"
                                                id="cajaMercadopago" 
                                                name='cajaMercadopago'
                                                min="0"
                                            />
                                        </div>                                
                                    </div>
                                </div>
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