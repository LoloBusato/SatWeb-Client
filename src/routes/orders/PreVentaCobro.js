import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import MainNavBar from './MainNavBar'
import SERVER from '../server'
import CajasInput from '../finances/CajasInput'

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
    // Señas separadas por moneda — sin conversión en storage.
    const [senaUSD, setSenaUSD] = useState(0)
    const [senaARS, setSenaARS] = useState(0)

    const [cuentasCategories, setCuentasCategories] = useState([])
    // Vuelto — espejo de cuentasCategories con suffix "Vuelto" en categories.
    // CajasInput filtra y muestra sólo Pesos / Dólares / Encargado, pero
    // mantenemos los 8 acá para que el handler pueda iterar consistente
    // con el resto del flujo.
    const [cuentasVueltoCategories, setCuentasVueltoCategories] = useState([])
    const [showVuelto, setShowVuelto] = useState(false)
    const [ventaId, setVentaId] = useState(null)
    const [cmvId, setCmvId] = useState(null)
    const [repuestosId, setRepuestosId] = useState(null)
    const [cmvBelgId, setCmvBelgId] = useState(null)
    // IDs Seña USD / Seña ARS — necesarios para liberar las señas
    // acumuladas en el cobro total (release contra el lado positivo).
    const [senaUSDCatId, setSenaUSDCatId] = useState(null)
    const [senaARSCatId, setSenaARSCatId] = useState(null)
    const [dolar, setDolar] = useState(1000)
    // 'total' (default) o 'parcial'. Si 'parcial', la submission no toca
    // stock ni postea Venta; sólo registra el pago como una seña más y
    // pasa la orden a DEUDOR.
    const [modoCobro, setModoCobro] = useState('total')

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
            setSenaUSD(Number(r.data.senaUSD || 0))
            setSenaARS(Number(r.data.senaARS || 0))
        }).catch(e => console.error('preventa-info', e))
        axios.get(`${SERVER}/movcategories`).then(r => {
            const data = r.data
            const cuentas = data
                .filter(c => (c.tipo ?? '').includes('Cuentas'))
                .filter(c => c.branch_id === branchId || c.branch_id === null)
            setCuentasCategories(cuentas)
            setCuentasVueltoCategories(cuentas.map(c => ({
                ...c, categories: `${c.categories}Vuelto`,
            })))
            for (const c of data) {
                if (c.categories === 'Venta') setVentaId(c.idmovcategories)
                else if (c.categories === 'CMV') setCmvId(c.idmovcategories)
                else if (c.categories === 'Repuestos') setRepuestosId(c.idmovcategories)
                else if (c.categories === 'CMVBelgrano') setCmvBelgId(c.idmovcategories)
                else if (c.categories === 'Seña USD') setSenaUSDCatId(c.idmovcategories)
                else if (c.categories === 'Seña ARS') setSenaARSCatId(c.idmovcategories)
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

    // Carga reducestock pre-existente de la orden (típicamente agregado
    // desde Messages.js antes del cobro). Lo metemos en repuestosArr con
    // flag existingReducestock: true para que (a) entren en valorRepuestosUsd
    // / CMV y (b) NO se les descuente stock de nuevo en el submit (ya están
    // en DB). Fix mayo 2026 — #13434 cobró sin CMV porque el operador agregó
    // los equipos desde Mensajes pero PreVentaCobro no los leía.
    useEffect(() => {
        if (!orderId) return
        axios.get(`${SERVER}/reduceStock/${orderId}`)
            .then(r => {
                const rows = (r.data || [])
                    .filter(it => it.orderid === orderId && it.es_garantia !== 1)
                if (rows.length === 0) return
                setRepuestosArr(rows.map(it => ({
                    ...it,
                    stockbranchid: it.stockbranch_id,
                    indice: `existing-${it.idreducestock}`,
                    existingReducestock: true,
                })))
            })
            .catch(e => console.error('preventa-cobro: reduceStock', e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId])

    const monedaOrden = order?.moneda_preventa || 'USD'
    const precioVenta = Number(order?.precio_venta ?? 0)
    // Señas guardadas en moneda nativa. Saldo en la moneda de la orden:
    // sumamos la pata correspondiente y convertimos la otra al blue.
    // Drift sólo en la pata convertida — la pata en la misma moneda es
    // exacta.
    const senadoEnMoneda = monedaOrden === 'USD'
        ? senaUSD + senaARS / dolar
        : senaARS + senaUSD * dolar
    const saldo = Math.max(0, precioVenta - senadoEnMoneda)
    const saldoEnPesos = monedaOrden === 'USD' ? saldo * dolar : saldo

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

        // Recolectar pago + vuelto por caja. Mapa por idmovcategories para
        // poder netear cuando una misma cuenta recibe pago y da vuelto
        // (ej. cliente paga 1000 USD en Dolares, vuelto 200 USD desde
        // Dolares → val neto 800). Cada entrada queda con la moneda
        // nativa de la cuenta + su equivalente en pesos.
        const cobrosByCajaMap = new Map()
        let ingresoTotalPesos = 0
        cuentasCategories.forEach(c => {
            // CajasInput renderiza con id = c.categories (e.g. "Pesos").
            const v = parseFloat(document.getElementById(c.categories)?.value || 0)
            if (v > 0) {
                const enPesos = c.es_dolar === 1 ? v * dolar : v
                const entry = cobrosByCajaMap.get(c.idmovcategories) ?? {
                    cat: c, val: 0, enPesos: 0, esUSD: c.es_dolar === 1,
                }
                entry.val += v
                entry.enPesos += enPesos
                cobrosByCajaMap.set(c.idmovcategories, entry)
                ingresoTotalPesos += enPesos
            }
        })

        // Vuelto: cada caja con valor > 0 resta de su propia cuenta. Los
        // inputs de vuelto sólo aparecen si showVuelto, y CajasInput sólo
        // renderiza 3 (Pesos/Dólares/Encargado) — el resto retorna null
        // de getElementById, se ignora.
        let vueltoTotalPesos = 0
        if (showVuelto) {
            cuentasVueltoCategories.forEach(c => {
                const v = parseFloat(document.getElementById(c.categories)?.value || 0)
                if (v > 0) {
                    const enPesos = c.es_dolar === 1 ? v * dolar : v
                    const entry = cobrosByCajaMap.get(c.idmovcategories) ?? {
                        cat: c, val: 0, enPesos: 0, esUSD: c.es_dolar === 1,
                    }
                    entry.val -= v
                    entry.enPesos -= enPesos
                    cobrosByCajaMap.set(c.idmovcategories, entry)
                    vueltoTotalPesos += enPesos
                }
            })
        }

        const cobrosByCaja = Array.from(cobrosByCajaMap.values()).filter(e => e.val !== 0)
        const ingresoNetoEnPesos = ingresoTotalPesos - vueltoTotalPesos
        if (ingresoNetoEnPesos === 0) return alert('Ingresá el monto recibido en alguna caja')

        const fechaAR = new Date().toLocaleString('en-IN', {
            timeZone: 'America/Argentina/Buenos_Aires', hour12: false,
        }).replace(',', '')

        // === RAMA 1: PAGO PARCIAL ===
        // El cliente paga menos del saldo. Movimientos: per caja
        // (+val moneda nativa) + per moneda recibida (Seña_X, -val).
        // Backend pasa la orden a DEUDOR. NO stock, NO Venta, NO entrega.
        if (modoCobro === 'parcial') {
            if (senaUSDCatId === null || senaARSCatId === null) {
                return alert('Faltan categorías Seña USD/ARS')
            }
            // Si el pago cubre el saldo total, mejor usar "Cobro total".
            if (Math.abs(ingresoNetoEnPesos - saldoEnPesos) <= 1) {
                if (!window.confirm('El pago coincide con el saldo total. ¿Querés usar "Cobro total" en su lugar para cerrar la orden? Cancelá y cambiá el modo arriba.')) return
            }
            setSubmitting(true)
            try {
                const arrayMovements = []
                let aplicadoUSD = 0, aplicadoARS = 0
                cobrosByCaja.forEach(c => {
                    arrayMovements.push([c.cat.idmovcategories, c.val])
                    if (c.esUSD) aplicadoUSD += c.val
                    else aplicadoARS += c.val
                })
                if (aplicadoUSD > 0) arrayMovements.push([senaUSDCatId, -aplicadoUSD])
                if (aplicadoARS > 0) arrayMovements.push([senaARSCatId, -aplicadoARS])

                const firstCajaName = cobrosByCaja[0].cat.categories
                const egresoLabel = aplicadoUSD > 0 && aplicadoARS > 0
                    ? 'Seña (mixto)'
                    : aplicadoUSD > 0 ? 'Seña USD' : 'Seña ARS'
                const operacion = `Pago parcial pre-venta #${orderId}`
                await axios.post(`${SERVER}/movname/movesPreVentaPagoParcial`, {
                    valuesCreateMovname: [
                        firstCajaName, egresoLabel, operacion,
                        ingresoNetoEnPesos, fechaAR, userId, branchId, orderId,
                    ],
                    arrayMovements,
                    branch_id: branchId,
                    order_id: orderId,
                })
                alert('Pago parcial registrado — orden en DEUDOR')
                navigate(`/messages/${orderId}`)
            } catch (error) {
                console.error(error)
                alert('No se pudo registrar el pago parcial — ver consola')
                setSubmitting(false)
            }
            return
        }

        // === RAMA 2: COBRO TOTAL ===
        if (ventaId === null || cmvId === null || repuestosId === null ||
            senaUSDCatId === null || senaARSCatId === null) {
            return alert('Faltan categorías base (Venta/CMV/Repuestos/Seña USD/Seña ARS) en movcategories')
        }
        if (Math.abs(ingresoNetoEnPesos - saldoEnPesos) > 1) {
            const msg = `El total neto ($${Math.round(ingresoNetoEnPesos)} ARS = pago $${Math.round(ingresoTotalPesos)} − vuelto $${Math.round(vueltoTotalPesos)}) no coincide con el saldo a cobrar ($${Math.round(saldoEnPesos)} ARS ≈ $${Math.round(saldo)} ${monedaOrden}). Para cobro parcial cambiá el modo arriba. ¿Continuar igualmente?`
            if (!window.confirm(msg)) return
        }

        setSubmitting(true)
        try {
            // Movements del lado caja (USD guardado en USD, ARS en pesos).
            const arrayMovements = []
            cobrosByCaja.forEach(c => {
                const u = c.esUSD ? Number((c.val).toFixed(2)) : c.val
                arrayMovements.push([c.cat.idmovcategories, u])
            })

            // Release de señas acumuladas — pone los Seña categories en 0,
            // necesario para que la contabilidad cierre.
            if (senaUSD > 0) arrayMovements.push([senaUSDCatId, senaUSD])
            if (senaARS > 0) arrayMovements.push([senaARSCatId, senaARS])

            // CMVBelgrano si los repuestos vendidos vinieron de Belgrano
            // y la operación pasa en otra sucursal.
            const cmvBelg = repuestosArr
                .filter(r => r.original_branch === 1)
                .reduce((a, r) => a + parseFloat(r.precio_compra || 0), 0)
            if (cmvBelg > 0 && branchId !== 1 && cmvBelgId !== null) {
                arrayMovements.push([cmvBelgId, cmvBelg])
            }

            // Venta = ingreso NETO de hoy (pago − vuelto) + las señas previas
            // convertidas a pesos. El "ingreso" incluye saldo del equipo +
            // venta de accesorios.
            const totalSenaEnPesos = senaARS + senaUSD * dolar
            const ventaTotal = ingresoNetoEnPesos + totalSenaEnPesos
            arrayMovements.push([ventaId, -ventaTotal])
            if (valorRepuestosUsd > 0) {
                arrayMovements.push([cmvId, parseFloat(valorRepuestosUsd)])
                arrayMovements.push([repuestosId, -parseFloat(valorRepuestosUsd)])
            }

            const reduceCount = {}
            for (const r of repuestosArr) {
                // Los preexistentes ya están en reducestock — no doble-descuento.
                // Sí entran en valorRepuestosUsd / CMV (ya calculado arriba).
                if (r.existingReducestock) continue
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
                'Caja', 'Venta', operacion, ventaTotal,
                fechaAR, userId, branchId, orderId,
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

            alert('Cobro total registrado y pre-venta entregada')
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
                        <div className='text-2xl font-bold'>${Math.round(precioVenta).toLocaleString('es-AR')} <span className='text-base text-gray-500'>{monedaOrden}</span></div>
                    </div>
                    <div className='bg-amber-100 border-2 border-amber-400 rounded-xl p-3 text-center'>
                        <div className='text-xs text-amber-700 uppercase'>Señado</div>
                        {senaUSD > 0 && (
                            <div className='text-xl font-bold'>${Math.round(senaUSD).toLocaleString('es-AR')} <span className='text-sm text-amber-700'>USD</span></div>
                        )}
                        {senaARS > 0 && (
                            <div className='text-xl font-bold'>${Math.round(senaARS).toLocaleString('es-AR')} <span className='text-sm text-amber-700'>ARS</span></div>
                        )}
                        {senaUSD === 0 && senaARS === 0 && <div className='text-2xl text-gray-500'>—</div>}
                    </div>
                    <div className='bg-green-100 border-2 border-green-400 rounded-xl p-3 text-center'>
                        <div className='text-xs text-green-700 uppercase'>Saldo a cobrar</div>
                        <div className='text-2xl font-bold'>${Math.round(saldo).toLocaleString('es-AR')} <span className='text-base text-green-700'>{monedaOrden}</span></div>
                        {monedaOrden === 'USD' && (
                            <div className='text-xs text-gray-600'>≈ ${Math.round(saldoEnPesos).toLocaleString('es-AR')} ARS al blue ${dolar}</div>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Modo de cobro: total cierra la orden + computa
                        ganancia; parcial deja la orden en DEUDOR sin
                        liberar señas ni descontar stock. */}
                    <div className='mb-3 p-2 bg-blue-100 rounded'>
                        <label className='block font-bold mb-2'>Modo de cobro</label>
                        <div className='flex gap-2'>
                            <button type='button'
                                className={`flex-1 px-4 py-2 rounded font-bold text-sm ${modoCobro === 'total' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border'}`}
                                onClick={() => setModoCobro('total')}>
                                Cobro total — entregar equipo
                            </button>
                            <button type='button'
                                className={`flex-1 px-4 py-2 rounded font-bold text-sm ${modoCobro === 'parcial' ? 'bg-amber-500 text-white' : 'bg-white text-gray-700 border'}`}
                                onClick={() => setModoCobro('parcial')}>
                                Pago parcial — queda en DEUDOR
                            </button>
                        </div>
                        {modoCobro === 'parcial' && (
                            <p className='text-xs text-gray-600 mt-2'>
                                ⚠️ El pago se acumula como seña, no se descuenta stock ni
                                se computa ganancia. La orden vuelve a Atención al Cliente
                                en estado DEUDOR para que cuando el cliente vuelva a pagar
                                se cierre la venta.
                            </p>
                        )}
                    </div>

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
                                            <td className='border px-2 py-1'>
                                                {r.repuesto}
                                                {r.existingReducestock && (
                                                    <span className='ml-2 text-xs text-amber-700'>(pre-cargado)</span>
                                                )}
                                            </td>
                                            <td className='border px-2 py-1 text-center'>{r.precio_compra}</td>
                                            <td className='border px-2 py-1 text-center'>
                                                {r.existingReducestock ? (
                                                    <span className='text-xs text-gray-500' title='Para eliminar, andá a Mensajes'>—</span>
                                                ) : (
                                                    <button type='button'
                                                        className='bg-red-500 text-white px-2 py-1 rounded text-xs'
                                                        onClick={() => eliminarRepuesto(r.indice, r.stockbranchid)}>
                                                        Eliminar
                                                    </button>
                                                )}
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

                    {/* Cajas de cobro — componente compartido. PreVentaCobro
                        no tiene vuelto (el monto del cobro = saldo). */}
                    <div className='mb-2 p-2 bg-blue-100'>
                        <label className='block text-gray-700 font-bold mb-2'>Cobro del saldo *</label>
                        <p className='text-xs text-gray-600 mb-2'>
                            Saldo a cobrar: <b>${Math.round(saldo).toLocaleString('es-AR')} {monedaOrden}</b>
                            {monedaOrden === 'USD' && (
                                <span> (≈ ${Math.round(saldoEnPesos).toLocaleString('es-AR')} ARS al blue {dolar})</span>
                            )}
                        </p>
                        <CajasInput
                            cuentasCategories={cuentasCategories}
                            cuentasVueltoCategories={cuentasVueltoCategories}
                            showVuelto={showVuelto}
                            setShowVuelto={setShowVuelto}
                            dolar={dolar}
                        />
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
