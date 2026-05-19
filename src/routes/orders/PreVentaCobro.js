import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import MainNavBar from './MainNavBar'
import SERVER from '../server'

// Cobro al retiro de una pre-venta. Mismo patrón que movesSells pero:
//   - La orden ya existe (no se inserta).
//   - El monto a cobrar es el saldo restante (precio_venta − totalSenado).
//   - El backend hace el UPDATE de la orden a ENTREGADO al final.

function PreVentaCobro() {
    const navigate = useNavigate()
    const { id } = useParams()
    const orderId = Number(id)
    const branchId = JSON.parse(localStorage.getItem('branchId') ?? 'null')
    const userId = JSON.parse(localStorage.getItem('userId') ?? 'null')

    const [order, setOrder] = useState(null)
    const [totalSenado, setTotalSenado] = useState(0)

    const [cuentasCategories, setCuentasCategories] = useState([])
    const [ventaId, setVentaId] = useState(null)
    const [cmvId, setCmvId] = useState(null)
    const [repuestosId, setRepuestosId] = useState(null)
    const [cmvBelgId, setCmvBelgId] = useState(null)
    const [dolar, setDolar] = useState(1000)

    const [sellStock, setSellStock] = useState([])
    const [originalStock, setOriginalStock] = useState([])
    const [searchStock, setSearchStock] = useState([])
    const [codigoSearch, setCodigoSearch] = useState('')
    const [repuestoSearch, setRepuestoSearch] = useState('')
    const [proveedorSearch, setProveedorSearch] = useState('')

    const [repuestosArr, setRepuestosArr] = useState([])
    const [indiceRepuesto, setIndiceRepuesto] = useState(1)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        axios.get(`${SERVER}/orders/${orderId}`).then(r => {
            const o = Array.isArray(r.data) ? r.data[0] : r.data
            setOrder(o)
        }).catch(e => console.error('orders/:id', e))
        axios.get(`${SERVER}/orders/preventa-info/${orderId}`).then(r => {
            setTotalSenado(Number(r.data.totalSenado || 0))
        }).catch(e => console.error('preventa-info', e))
        axios.get(`${SERVER}/movcategories`).then(r => {
            const data = r.data
            const cuentas = data
                .filter(c => (c.tipo ?? '').includes('Cuentas'))
                .filter(c => c.branch_id === branchId || c.branch_id === null)
            setCuentasCategories(cuentas)
            for (const c of data) {
                if (c.categories === 'Venta') setVentaId(c.idmovcategories)
                else if (c.categories === 'CMV') setCmvId(c.idmovcategories)
                else if (c.categories === 'Repuestos') setRepuestosId(c.idmovcategories)
                else if (c.categories === 'CMVBelgrano') setCmvBelgId(c.idmovcategories)
            }
        }).catch(e => console.error('movcategories', e))
        axios.get(`${SERVER}/stock/${branchId}`).then(r => {
            const filtered = r.data.filter(it =>
                it.repuesto.toLowerCase().includes('venta') && it.cantidad_restante > 0
            )
            setSellStock(filtered)
            setOriginalStock(filtered)
            setSearchStock(filtered)
        }).catch(e => console.error('stock', e))
        axios.get('https://api.bluelytics.com.ar/v2/latest')
            .then(r => setDolar(r.data.blue.value_sell))
            .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId, branchId])

    const precioVenta = Number(order?.precio_venta ?? 0)
    const saldo = Math.max(0, precioVenta - totalSenado)

    const valorRepuestosUsd = useMemo(() => (
        repuestosArr.reduce((acc, r) => acc + parseFloat(r.precio_compra || 0), 0)
    ), [repuestosArr])

    function agregarRepuesto(id) {
        const item = sellStock.find(s => s.idstock === id)
        if (!item || item.cantidad_restante <= 0) {
            return alert('Sin stock — no se puede agregar')
        }
        const copy = { ...item, indice: indiceRepuesto }
        setIndiceRepuesto(i => i + 1)
        const updated = sellStock.map(s => s.idstock === id
            ? { ...s, cantidad_restante: s.cantidad_restante - 1 } : s)
        setRepuestosArr(prev => [...prev, copy])
        setSellStock(updated)
        setSearchStock(updated)
    }

    function eliminarRepuesto(indice, stockbranchid) {
        const updated = sellStock.map(s => s.stockbranchid === stockbranchid
            ? { ...s, cantidad_restante: s.cantidad_restante + 1 } : s)
        setRepuestosArr(prev => prev.filter(r => r.indice !== indice))
        setSellStock(updated)
        setSearchStock(updated)
    }

    function handleSearch() {
        setSearchStock(sellStock.filter(it =>
            (codigoSearch === '' || it.idstock === parseInt(codigoSearch)) &&
            (it.repuesto.toLowerCase().includes(repuestoSearch.toLowerCase())) &&
            (it.nombre.toLowerCase().includes(proveedorSearch.toLowerCase()))
        ))
    }

    async function handleSubmit(event) {
        event.preventDefault()
        if (submitting) return
        if (ventaId === null || cmvId === null || repuestosId === null) {
            return alert('Faltan categorías base (Venta/CMV/Repuestos) en movcategories')
        }

        // Sumar lo ingresado por caja (en pesos).
        const cobrosValues = {}
        let ingresoTotal = 0
        cuentasCategories.forEach(c => {
            const v = parseFloat(document.getElementById(`caja-${c.idmovcategories}`)?.value || 0)
            if (v > 0) {
                const enPesos = c.es_dolar === 1 ? v * dolar : v
                cobrosValues[c.idmovcategories] = enPesos
                ingresoTotal += enPesos
            }
        })
        if (ingresoTotal === 0) return alert('Ingresá el saldo recibido en alguna caja')
        if (Math.abs(ingresoTotal - saldo) > 1) {
            const msg = `El total ingresado ($${Math.round(ingresoTotal)}) no coincide con el saldo a cobrar ($${Math.round(saldo)}). ¿Continuar?`
            if (!window.confirm(msg)) return
        }

        setSubmitting(true)
        try {
            const fechaAR = new Date().toLocaleString('en-IN', {
                timeZone: 'America/Argentina/Buenos_Aires', hour12: false,
            }).replace(',', '')

            // Movements del lado caja (mismo criterio que movesSells: si la
            // cuenta es USD guardamos unidades en USD; en pesos si no).
            const arrayMovements = []
            cuentasCategories.forEach(c => {
                if (cobrosValues[c.idmovcategories]) {
                    const u = c.es_dolar === 1
                        ? (cobrosValues[c.idmovcategories] / dolar).toFixed(2)
                        : cobrosValues[c.idmovcategories]
                    arrayMovements.push([c.idmovcategories, u])
                }
            })
            // CMVBelgrano cuando el repuesto vendido vino de Belgrano y la
            // operación pasa en otra sucursal — mismo patrón que movesSells.
            const cmvBelg = repuestosArr
                .filter(r => r.original_branch === 1)
                .reduce((a, r) => a + parseFloat(r.precio_compra || 0), 0)
            if (cmvBelg > 0 && branchId !== 1 && cmvBelgId !== null) {
                arrayMovements.push([cmvBelgId, cmvBelg])
            }
            // Venta = saldo cobrado (no precio_venta — la seña ya entró
            // por la cuenta cuando se hizo el depósito).
            arrayMovements.push([ventaId, -ingresoTotal])
            if (valorRepuestosUsd > 0) {
                arrayMovements.push([cmvId, parseFloat(valorRepuestosUsd)])
                arrayMovements.push([repuestosId, -parseFloat(valorRepuestosUsd)])
            }

            // Reduce + update stock por repuesto vendido (igual que
            // movesSells, sin re-INSERT de cliente/orden).
            const reduceCount = {}
            for (const r of repuestosArr) {
                reduceCount[r.stockbranchid] = (reduceCount[r.stockbranchid] ?? 0) + 1
            }
            const updateStockArr = []
            const insertReduceArr = []
            for (const stockbranchid in reduceCount) {
                const orig = originalStock.find(s => s.stockbranchid === parseInt(stockbranchid))
                if (!orig) continue
                const nuevaCantidad = orig.cantidad_restante - reduceCount[stockbranchid]
                updateStockArr.push([nuevaCantidad, parseInt(stockbranchid)])
                insertReduceArr.push([userId, parseInt(stockbranchid), fechaAR])
            }

            const operacion = `Retiro pre-venta #${orderId}` +
                (repuestosArr.length > 0 ? ' + ' + repuestosArr.map(r => r.repuesto).join(' / ') : '')
            const valuesCreateMovname = [
                'Caja',     // ingreso
                'Venta',    // egreso
                operacion,
                ingresoTotal,
                fechaAR,
                userId,
                branchId,
                orderId,
            ]

            await axios.post(`${SERVER}/movname/movesPreVentaCobro`, {
                valuesCreateMovname,
                arrayMovements,
                updateStockArr,
                insertReduceArr,
                branch_id: branchId,
                fecha: fechaAR,
                order_id: orderId,
            })

            alert('Cobro registrado y pre-venta entregada')
            navigate(`/messages/${orderId}`)
        } catch (error) {
            console.error(error)
            alert('No se pudo registrar el cobro — ver consola')
            setSubmitting(false)
        }
    }

    if (!order) {
        return (
            <div className='bg-gray-300 min-h-screen pb-2'>
                <MainNavBar />
                <p className='text-center py-8'>Cargando orden #{orderId}...</p>
            </div>
        )
    }

    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className='bg-white my-2 py-8 px-2 max-w-5xl mx-auto'>
                <h1 className='text-center text-5xl mb-2'>Cobro Pre-Venta #{orderId}</h1>
                <p className='text-center text-sm text-gray-600 mb-4'>
                    {order.name} {order.surname} — {order.brand} {order.type} {order.model} — color {order.color_preventa ?? order.device_color}
                </p>

                {/* Resumen de saldo */}
                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4'>
                    <div className='bg-gray-100 border rounded-xl p-3 text-center'>
                        <div className='text-xs text-gray-600 uppercase'>Precio acordado</div>
                        <div className='text-2xl font-bold'>${precioVenta.toLocaleString('es-AR')}</div>
                    </div>
                    <div className='bg-amber-100 border-2 border-amber-400 rounded-xl p-3 text-center'>
                        <div className='text-xs text-amber-700 uppercase'>Señado</div>
                        <div className='text-2xl font-bold'>${totalSenado.toLocaleString('es-AR')}</div>
                    </div>
                    <div className='bg-green-100 border-2 border-green-400 rounded-xl p-3 text-center'>
                        <div className='text-xs text-green-700 uppercase'>Saldo a cobrar</div>
                        <div className='text-2xl font-bold'>${saldo.toLocaleString('es-AR')}</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Repuestos seleccionados */}
                    <div className='mb-2 p-2 bg-blue-100'>
                        <label className='font-bold'>Accesorios para vender (opcional)</label>
                        <div className='flex justify-end mb-2'>
                            <button type='button'
                                className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm'
                                onClick={() => navigate('/stock')}>
                                Agregar equipo al stock
                            </button>
                        </div>
                        {repuestosArr.length > 0 && (
                            <table className='table-auto w-full bg-gray-200 mb-2'>
                                <thead>
                                    <tr>
                                        <th className='px-2 py-1'>Código</th>
                                        <th className='px-2 py-1'>Repuesto</th>
                                        <th className='px-2 py-1'>Precio USD</th>
                                        <th className='px-2 py-1'></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {repuestosArr.map(r => (
                                        <tr key={`${r.stockbranchid}-${r.indice}`}>
                                            <td className='border px-2 py-1 text-center'>{r.idstock}</td>
                                            <td className='border px-2 py-1'>{r.repuesto}</td>
                                            <td className='border px-2 py-1 text-center'>{r.precio_compra}</td>
                                            <td className='border px-2 py-1 text-center'>
                                                <button type='button'
                                                    className='bg-red-500 text-white px-2 py-1 rounded text-xs'
                                                    onClick={() => eliminarRepuesto(r.indice, r.stockbranchid)}>
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {valorRepuestosUsd > 0 && (
                            <p className='text-sm text-gray-700'>
                                Costo repuestos: <b>USD {valorRepuestosUsd.toFixed(2)}</b> (${(valorRepuestosUsd * dolar).toFixed(2)})
                            </p>
                        )}

                        <div className='flex flex-wrap gap-2 mt-2'>
                            <input className='border rounded px-2 py-1' placeholder='Código'
                                value={codigoSearch} onChange={e => setCodigoSearch(e.target.value)} />
                            <input className='border rounded px-2 py-1' placeholder='Repuesto'
                                value={repuestoSearch} onChange={e => setRepuestoSearch(e.target.value)} />
                            <input className='border rounded px-2 py-1' placeholder='Proveedor'
                                value={proveedorSearch} onChange={e => setProveedorSearch(e.target.value)} />
                            <button type='button' className='bg-indigo-500 text-white px-3 py-1 rounded'
                                onClick={handleSearch}>Buscar</button>
                        </div>
                        <div className='max-h-60 overflow-y-auto mt-2'>
                            <table className='table-auto w-full bg-white text-sm'>
                                <thead>
                                    <tr className='bg-lime-300'>
                                        <th className='px-2 py-1'>Cod</th>
                                        <th className='px-2 py-1'>Repuesto</th>
                                        <th className='px-2 py-1'>Stock</th>
                                        <th className='px-2 py-1'>USD</th>
                                        <th className='px-2 py-1'>Proveedor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {searchStock.map(s => (
                                        <tr key={`${s.idstock}`} className='cursor-pointer hover:bg-gray-100'
                                            onClick={() => agregarRepuesto(s.idstock)}>
                                            <td className='border px-2 py-1'>{s.idstock}</td>
                                            <td className='border px-2 py-1'>{s.repuesto}</td>
                                            <td className='border px-2 py-1 text-center'>{s.cantidad_restante}</td>
                                            <td className='border px-2 py-1 text-center'>{s.precio_compra}</td>
                                            <td className='border px-2 py-1'>{s.nombre}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Cajas de cobro */}
                    <div className='mb-2 p-2 bg-blue-100'>
                        <label className='block text-gray-700 font-bold mb-2'>Cobro del saldo *</label>
                        <p className='text-xs text-gray-600 mb-2'>
                            Distribuí el saldo en las cajas correspondientes. USD se
                            convierten al blue venta.
                        </p>
                        <div className='flex flex-wrap gap-2'>
                            {cuentasCategories.map(c => (
                                <div className='flex-1 min-w-[140px]' key={c.idmovcategories}>
                                    <label className='block text-gray-700 font-bold text-sm mb-1'>
                                        {c.categories} {c.es_dolar === 1 && <span className='text-xs text-blue-700'>(USD)</span>}
                                    </label>
                                    <input className='shadow border rounded w-full py-2 px-3' type='number'
                                        step='1' min='0' id={`caja-${c.idmovcategories}`} defaultValue='' />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className='flex gap-2'>
                        <button type='submit' disabled={submitting}
                            className={`font-bold py-2 px-4 rounded text-white ${submitting ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-700'}`}>
                            {submitting ? 'Procesando…' : 'Cobrar y entregar'}
                        </button>
                        <button type='button'
                            className='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded'
                            onClick={() => navigate(`/messages/${orderId}`)}>
                            Volver
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default PreVentaCobro
