import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
    ResponsiveContainer, LineChart, Line, BarChart, Bar,
    XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts'
import MainNavBar from '../orders/MainNavBar'
import SERVER from '../server'
import { v2Get } from '../utils/api'

// Categorías que entran en "Plata al banco" (CAMBIO 3 de la spec).
const PLATA_BANCO_CATEGORIES = new Set(['Banco', 'Dólares Banco', 'MercadoPago'])

// === Helpers ===============================================================

function parseDmyDate(str) {
    if (!str) return null
    const [d, m, y] = str.split(' ')[0].split('/').map(Number)
    if (!d || !m || !y) return null
    return new Date(y, m - 1, d)
}

function isInRange(date, fromStr, toStr) {
    if (!date) return false
    if (fromStr && date < new Date(fromStr)) return false
    if (toStr && date > new Date(toStr + 'T23:59:59')) return false
    return true
}

function defaultFrom() {
    // Lunes de la semana actual (el lunes ≤ hoy). getDay() devuelve 0 para
    // domingo — en ese caso retrocedemos 6 días; el resto retrocede
    // (day - 1) días.
    const d = new Date()
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    d.setDate(d.getDate() + diff)
    return d.toISOString().slice(0, 10)
}

function defaultTo() {
    return new Date().toISOString().slice(0, 10)
}

function formatARS(v) {
    const n = Number(v)
    if (!Number.isFinite(n)) return '—'
    return '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 })
}

function formatUSD(v) {
    const n = Number(v)
    if (!Number.isFinite(n)) return '—'
    return 'US$ ' + n.toLocaleString('es-AR', { maximumFractionDigits: 2 })
}

// === Sub-componentes ======================================================

function SectionTitle({ children }) {
    return (
        <h2 className='text-lg font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-200'>
            {children}
        </h2>
    )
}

function BoxCard({ label, value, currency }) {
    const isUsd = currency === 'USD'
    const badgeClass = isUsd ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
    const formatted = isUsd ? formatUSD(value) : formatARS(value)
    return (
        <div className='bg-white rounded-xl shadow-md p-4 border border-gray-100 flex flex-col gap-2'>
            <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-500 uppercase tracking-wide'>{label}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded ${badgeClass}`}>{currency}</span>
            </div>
            <span className='text-3xl font-bold text-gray-800'>{formatted}</span>
        </div>
    )
}

function StatCard({ label, value, format = 'number' }) {
    let display = value
    if (value === null || value === undefined) display = '—'
    else if (format === 'ars') display = formatARS(value)
    else if (format === 'usd') display = formatUSD(value)
    else display = Number(value).toLocaleString('es-AR')
    return (
        <div className='bg-white rounded-xl shadow-md p-4 border border-gray-100 flex flex-col gap-2'>
            <span className='text-sm text-gray-500 uppercase tracking-wide'>{label}</span>
            <span className='text-3xl font-bold text-gray-800'>{display}</span>
        </div>
    )
}

function ChartCard({ title, right, children }) {
    return (
        <div className='bg-white rounded-xl shadow-md p-4 border border-gray-100 mb-4'>
            <div className='flex justify-between items-center mb-3'>
                <h3 className='text-base font-semibold text-gray-700'>{title}</h3>
                {right}
            </div>
            {children}
        </div>
    )
}

// === Componente principal ==================================================

function Resumen() {
    const navigate = useNavigate()
    const permisos = JSON.stringify(localStorage.getItem('permisos'))
    const isAdmin = permisos.includes('Administrador')
    const branchId = JSON.parse(localStorage.getItem('branchId'))

    // ---- Filtros compartidos ----
    const [fechaInicio, setFechaInicio] = useState(defaultFrom())
    const [fechaFin, setFechaFin] = useState(defaultTo())
    const [currentBranch, setCurrentBranch] = useState(branchId)
    const [granularity, setGranularity] = useState('month')

    // ---- Branches + lookups ----
    const [branches, setBranches] = useState([])
    const [garantiaId, setGarantiaId] = useState(0)

    // ---- Datos de cuentas (Resumen financiero) ----
    const [movname, setMovname] = useState([])
    const [allMovements, setAllMovements] = useState([])
    const [movementCategories, setMovementCategories] = useState([])
    // Cache por sucursal para no re-pegarle al backend al switchear branches
    const [movementsByBranch, setMovementsByBranch] = useState({})
    const [movnameByBranch, setMovnameByBranch] = useState({})

    // ---- Cotización del dólar (para fórmula de ganancia) ----
    // Default razonable mientras llega la respuesta de bluelytics; se
    // sobrescribe en el mount con el blue venta del día.
    const [dolar, setDolar] = useState(1000)

    // ---- v2 Dashboard (admin) ----
    const [ordersChartData, setOrdersChartData] = useState(null)
    const [revenueChartData, setRevenueChartData] = useState(null)
    const [branchPerfData, setBranchPerfData] = useState(null)
    const [chartErrors, setChartErrors] = useState({ orders: null, revenue: null, branch: null })
    const [chartToggles, setChartToggles] = useState({
        creadas: true, entregadas: true, facturacion: false, ganancia: false,
    })

    // ===== Effects =====

    // Branches + categorías (one-shot)
    useEffect(() => {
        axios.get(`${SERVER}/branches`)
            .then(r => {
                setBranches(r.data)
                const garantia = r.data.find(b => b.branch === 'Garantia')
                if (garantia) setGarantiaId(garantia.idbranches)
            })
            .catch(e => console.error('branches', e))

        axios.get(`${SERVER}/movcategories`)
            .then(r => {
                // Diagnóstico verbose mientras debugueamos el filtro de
                // cuentas (ver bug report mayo 2026). Pegame el output de
                // estos 3 logs si las Pesos siguen sin aparecer.
                console.log('[Resumen] /movcategories raw response:', r.data)
                const cuentas = r.data.filter(c => (c.tipo ?? '').includes('Cuentas'))
                console.log('[Resumen] cuentas detectadas (' + cuentas.length + '):',
                    cuentas.map(c => ({
                        cat: c.categories,
                        tipo: c.tipo,
                        branch_id: c.branch_id,
                        es_dolar: c.es_dolar,
                        es_dolar_type: typeof c.es_dolar,
                        Number_es_dolar: Number(c.es_dolar),
                        es_USD: Number(c.es_dolar) === 1,
                    })))
                setMovementCategories(r.data)
            })
            .catch(e => console.error('movcategories', e))

        axios.get('https://api.bluelytics.com.ar/v2/latest')
            .then(r => setDolar(r.data.blue.value_sell))
            .catch(e => console.error('bluelytics', e))
    }, [])

    // Movements + movname (por sucursal, cached)
    useEffect(() => {
        if (movementsByBranch[currentBranch]) {
            setAllMovements(movementsByBranch[currentBranch])
        } else {
            axios.get(`${SERVER}/movements/${currentBranch}`)
                .then(r => {
                    setAllMovements(r.data)
                    setMovementsByBranch(prev => ({ ...prev, [currentBranch]: r.data }))
                })
                .catch(e => console.error('movements', e))
        }
        if (movnameByBranch[currentBranch]) {
            setMovname(movnameByBranch[currentBranch])
        } else {
            axios.get(`${SERVER}/movname/${currentBranch}`)
                .then(r => {
                    setMovname(r.data)
                    setMovnameByBranch(prev => ({ ...prev, [currentBranch]: r.data }))
                })
                .catch(e => console.error('movname', e))
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentBranch])

    // Dashboard v2 (admin only) — refetch al cambiar rango / sucursal / granularity
    useEffect(() => {
        if (!isAdmin) return
        const params = { from: fechaInicio, to: fechaFin }
        // currentBranch === 0/undefined ⇒ todas las sucursales
        if (currentBranch && currentBranch !== garantiaId) params.branchId = currentBranch

        setChartErrors({ orders: null, revenue: null, branch: null })
        v2Get('/dashboard/orders-over-time', { ...params, granularity })
            .then(r => setOrdersChartData(r.data))
            .catch(e => setChartErrors(prev => ({ ...prev, orders: extractError(e) })))
        v2Get('/dashboard/revenue', { ...params, granularity, section: 'buckets' })
            .then(r => setRevenueChartData(r.data))
            .catch(e => setChartErrors(prev => ({ ...prev, revenue: extractError(e) })))
        v2Get('/dashboard/branch-performance', params)
            .then(r => setBranchPerfData(r.data))
            .catch(e => setChartErrors(prev => ({ ...prev, branch: extractError(e) })))
    }, [isAdmin, fechaInicio, fechaFin, currentBranch, granularity, garantiaId])

    // ===== Cómputo de cards =====

    // Saldo por cuenta en el rango: sumamos unidades de los movements cuyo
    // movname.fecha cae dentro de [fechaInicio, fechaFin]. Misma lógica que
    // el Resumen original (handleSearch); refactor a useMemo para que se
    // recalcule en cada cambio sin necesidad de un botón "Buscar".
    const boxValues = useMemo(() => {
        const totals = {}
        const movnameIdsEnRango = new Set()
        movname.forEach(m => {
            const d = parseDmyDate(m.fecha)
            if (isInRange(d, fechaInicio, fechaFin)) movnameIdsEnRango.add(m.idmovname)
        })
        allMovements.forEach(mv => {
            if (!movnameIdsEnRango.has(mv.movname_id)) return
            totals[mv.categories] = (totals[mv.categories] ?? 0) + parseFloat(mv.unidades || 0)
        })
        return totals
    }, [movname, allMovements, fechaInicio, fechaFin])

    // El campo movcategories.tipo es un string CSV (ej. "Dinero, Cuentas" o
    // "Repuestos, Otros, Pagar, Cuentas") — usamos String.includes igual que
    // hacía el Resumen original. Para la moneda usamos Number(es_dolar) === 1
    // como detector USD; cubre cualquier representación (number, "0"/"1"
    // string, null, undefined → NaN ≠ 1) y todo lo demás cae a ARS.
    const isUSD = (c) => Number(c.es_dolar) === 1
    const isInBranch = (c) => c.branch_id === currentBranch || c.branch_id === null
    const isCuenta = (c) => (c.tipo ?? '').includes('Cuentas')

    const cuentasUSD = useMemo(() => {
        const filtered = movementCategories.filter(c => isCuenta(c) && isUSD(c) && isInBranch(c))
        console.log('[Resumen] cuentasUSD computed:', filtered.length, '| currentBranch:', currentBranch, '|',
            filtered.map(c => c.categories))
        return filtered
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [movementCategories, currentBranch])

    const cuentasARS = useMemo(() => {
        const filtered = movementCategories.filter(c => isCuenta(c) && !isUSD(c) && isInBranch(c))
        console.log('[Resumen] cuentasARS computed:', filtered.length, '| currentBranch:', currentBranch, '|',
            filtered.map(c => c.categories))
        // Diagnóstico extra: si quedó vacío, mostrar por qué rechazó cada
        // candidato (qué chequeo falla — tipo, USD, o branch).
        if (filtered.length === 0 && movementCategories.length > 0) {
            const cuentas = movementCategories.filter(c => isCuenta(c))
            console.warn('[Resumen] ARS vacío — diagnóstico por candidato:',
                cuentas.map(c => ({
                    cat: c.categories,
                    es_USD: isUSD(c),
                    es_ARS_candidato: !isUSD(c),
                    branch_match: isInBranch(c),
                    branch_id: c.branch_id,
                })))
        }
        return filtered
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [movementCategories, currentBranch])

    // ===== Cómputo de stats Dashboard =====

    const stats = useMemo(() => {
        // Filtramos movnames por rango y armamos un dict id → bool.
        const inRange = new Set()
        movname.forEach(m => {
            const d = parseDmyDate(m.fecha)
            if (isInRange(d, fechaInicio, fechaFin)) inRange.add(m.idmovname)
        })

        // Por movname, categorías presentes (set). Una operación con varios
        // movements de la misma categoría cuenta una sola vez la operación
        // pero sumamos todos los unidades para el ticket promedio.
        const opByCategory = {}    // { categoria: Set<movname_id> }
        const sumByCategory = {}   // { categoria: sum |unidades| }
        const cntByCategory = {}   // { categoria: count(movements) }

        allMovements.forEach(mv => {
            if (!inRange.has(mv.movname_id)) return
            const cat = mv.categories
            const val = Math.abs(parseFloat(mv.unidades || 0))
            if (!opByCategory[cat]) opByCategory[cat] = new Set()
            opByCategory[cat].add(mv.movname_id)
            sumByCategory[cat] = (sumByCategory[cat] ?? 0) + val
            cntByCategory[cat] = (cntByCategory[cat] ?? 0) + 1
        })

        const opsReparaciones = opByCategory['Reparaciones']?.size ?? 0
        const opsVenta = opByCategory['Venta']?.size ?? 0
        const ticketRep = cntByCategory['Reparaciones']
            ? sumByCategory['Reparaciones'] / cntByCategory['Reparaciones']
            : 0
        const ticketVenta = cntByCategory['Venta']
            ? sumByCategory['Venta'] / cntByCategory['Venta']
            : 0

        // Plata al banco: suma signada (no abs) — un transfer OUT debería
        // restar al neto. Sumamos las 3 categorías declaradas en la spec.
        let plataBanco = 0
        // Para la fórmula de ganancia necesitamos sumas signadas (no abs)
        // de CMV / Venta / Reparaciones — Math.abs en sumByCategory rompe
        // la fórmula porque borra la convención de signo del backend
        // (income guardado como negativo). Las acumulamos aparte.
        let cmvSigned = 0, ventaSigned = 0, reparacionesSigned = 0
        allMovements.forEach(mv => {
            if (!inRange.has(mv.movname_id)) return
            const val = parseFloat(mv.unidades || 0)
            if (PLATA_BANCO_CATEGORIES.has(mv.categories)) plataBanco += val
            if (mv.categories === 'CMV') cmvSigned += val
            else if (mv.categories === 'Venta') ventaSigned += val
            else if (mv.categories === 'Reparaciones') reparacionesSigned += val
        })

        // Fórmula de ganancia (heredada del Resumen original):
        //   ganancia = (-CMV * dolar) - Venta - Reparaciones
        // La convención de signo del backend hace que Venta/Reparaciones
        // sean negativas (income), por eso restarlas suma al neto. CMV es
        // positivo (costo en USD) y se convierte a pesos con dolar blue.
        const ganancia = (-cmvSigned * dolar) - ventaSigned - reparacionesSigned

        return {
            opsReparaciones,
            opsVenta,
            ticketRep,
            ticketVenta,
            plataBanco,
            ganancia,
        }
    }, [movname, allMovements, fechaInicio, fechaFin, dolar])

    // ===== Charts data merging =====

    const mergedLineData = useMemo(() => {
        // Mergeamos buckets de orders + revenue por clave `bucket` para que
        // el LineChart pueda mostrar las 4 series sobre el mismo eje X.
        const map = new Map()
        const oBuckets = ordersChartData?.buckets ?? []
        const rBuckets = revenueChartData?.buckets ?? []
        oBuckets.forEach(b => {
            map.set(b.bucket, { bucket: b.bucket, created: b.created, delivered: b.delivered })
        })
        rBuckets.forEach(b => {
            const prev = map.get(b.bucket) ?? { bucket: b.bucket }
            map.set(b.bucket, {
                ...prev,
                facturacion: b.facturacion,
                // El endpoint puede o no exponer `ganancia` — si no está,
                // queda undefined y Recharts ignora la línea.
                ganancia: b.ganancia ?? b.profit ?? undefined,
            })
        })
        return Array.from(map.values()).sort((a, b) => String(a.bucket).localeCompare(String(b.bucket)))
    }, [ordersChartData, revenueChartData])

    const branchPerfRows = useMemo(() => {
        return (branchPerfData?.items ?? []).filter(i => i.ordersCreated > 0)
    }, [branchPerfData])

    // ===== Handlers =====

    function handleBranchClick(id) {
        if (id === garantiaId) {
            alert('Esta sucursal no tiene operaciones')
            return
        }
        setCurrentBranch(id)
    }

    function toggleChart(key) {
        setChartToggles(prev => ({ ...prev, [key]: !prev[key] }))
    }

    // ===== Render =====

    return (
        <div className='bg-gray-50 min-h-screen pb-8'>
            <MainNavBar />
            <div className='max-w-7xl mx-auto px-4 py-6'>
                {/* Header */}
                <div className='flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6'>
                    <div>
                        <h1 className='text-3xl font-semibold text-gray-800'>Dashboard</h1>
                        <p className='text-sm text-gray-500'>Resumen financiero y métricas operativas</p>
                    </div>
                    <button
                        className='bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-lg text-sm'
                        onClick={() => navigate('/categoryHistory')}>
                        Ver historial de cajas
                    </button>
                </div>

                {/* Selector de sucursal */}
                <div className='flex flex-wrap gap-2 mb-4'>
                    {branches.map(branch => (
                        <button
                            key={branch.idbranches}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                branch.idbranches === currentBranch
                                    ? 'bg-blue-700 text-white shadow'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => handleBranchClick(branch.idbranches)}>
                            {branch.branch}
                        </button>
                    ))}
                </div>

                {/* Filtros de fecha + granularity */}
                <div className='bg-white rounded-xl shadow-md p-4 border border-gray-100 mb-6 flex flex-wrap gap-4 items-end'>
                    <div>
                        <label className='block text-xs text-gray-500 uppercase tracking-wide mb-1'>Desde</label>
                        <input type='date' value={fechaInicio}
                            onChange={e => setFechaInicio(e.target.value)}
                            className='border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500' />
                    </div>
                    <div>
                        <label className='block text-xs text-gray-500 uppercase tracking-wide mb-1'>Hasta</label>
                        <input type='date' value={fechaFin}
                            onChange={e => setFechaFin(e.target.value)}
                            className='border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500' />
                    </div>
                    {isAdmin && (
                        <div>
                            <label className='block text-xs text-gray-500 uppercase tracking-wide mb-1'>Granularidad</label>
                            <select value={granularity}
                                onChange={e => setGranularity(e.target.value)}
                                className='border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500'>
                                <option value='day'>Día</option>
                                <option value='week'>Semana</option>
                                <option value='month'>Mes</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Resumen financiero — cajas en USD y ARS */}
                <section className='mb-8'>
                    <SectionTitle>💵 Dólares</SectionTitle>
                    {cuentasUSD.length === 0 ? (
                        <p className='text-sm text-gray-500 italic'>No hay cuentas en USD configuradas.</p>
                    ) : (
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
                            {cuentasUSD.map(c => (
                                <BoxCard
                                    key={c.idmovcategories}
                                    label={c.categories}
                                    value={boxValues[c.categories] ?? 0}
                                    currency='USD' />
                            ))}
                        </div>
                    )}

                    <SectionTitle>🏦 Pesos</SectionTitle>
                    {cuentasARS.length === 0 ? (
                        <p className='text-sm text-gray-500 italic'>No hay cuentas en ARS configuradas.</p>
                    ) : (
                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                            {cuentasARS.map(c => (
                                <BoxCard
                                    key={c.idmovcategories}
                                    label={c.categories}
                                    value={boxValues[c.categories] ?? 0}
                                    currency='ARS' />
                            ))}
                        </div>
                    )}
                </section>

                {/* Dashboard — solo Admin */}
                {isAdmin && (
                    <section>
                        <SectionTitle>📊 Métricas operativas</SectionTitle>

                        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
                            <StatCard label='Órdenes de servicio técnico' value={stats.opsReparaciones} />
                            <StatCard label='Órdenes de venta' value={stats.opsVenta} />
                            <StatCard label='Ticket promedio reparaciones' value={stats.ticketRep} format='ars' />
                            <StatCard label='Ticket promedio ventas' value={stats.ticketVenta} format='ars' />
                            <StatCard label='Plata al banco' value={stats.plataBanco} format='ars' />
                            <StatCard label='Ganancia' value={stats.ganancia} format='ars' />
                        </div>

                        {/* Gráfico combinado de órdenes/facturación/ganancia */}
                        <ChartCard
                            title='Órdenes por período'
                            right={
                                <div className='flex flex-wrap gap-3 text-sm'>
                                    {[
                                        { k: 'creadas', label: 'Creadas', color: '#3b82f6' },
                                        { k: 'entregadas', label: 'Entregadas', color: '#10b981' },
                                        { k: 'facturacion', label: 'Facturación', color: '#8b5cf6' },
                                        { k: 'ganancia', label: 'Ganancia', color: '#f59e0b' },
                                    ].map(t => (
                                        <label key={t.k} className='flex items-center gap-1 cursor-pointer'>
                                            <input type='checkbox' checked={chartToggles[t.k]}
                                                onChange={() => toggleChart(t.k)} />
                                            <span style={{ color: t.color }}>{t.label}</span>
                                        </label>
                                    ))}
                                </div>
                            }>
                            {chartErrors.orders && <p className='text-sm text-red-500 mb-2'>Órdenes: {chartErrors.orders}</p>}
                            {chartErrors.revenue && <p className='text-sm text-red-500 mb-2'>Ingresos: {chartErrors.revenue}</p>}
                            {mergedLineData.length === 0 ? (
                                <p className='text-sm text-gray-500'>Sin datos en el rango seleccionado.</p>
                            ) : (
                                <ResponsiveContainer width='100%' height={320}>
                                    <LineChart data={mergedLineData}>
                                        <CartesianGrid strokeDasharray='3 3' />
                                        <XAxis dataKey='bucket' />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Legend />
                                        {chartToggles.creadas &&
                                            <Line type='monotone' dataKey='created' stroke='#3b82f6' name='Creadas' strokeWidth={2} />}
                                        {chartToggles.entregadas &&
                                            <Line type='monotone' dataKey='delivered' stroke='#10b981' name='Entregadas' strokeWidth={2} />}
                                        {chartToggles.facturacion &&
                                            <Line type='monotone' dataKey='facturacion' stroke='#8b5cf6' name='Facturación' strokeWidth={2} />}
                                        {chartToggles.ganancia &&
                                            <Line type='monotone' dataKey='ganancia' stroke='#f59e0b' name='Ganancia' strokeWidth={2} />}
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard title='Ingresos por período'>
                            {revenueChartData && (
                                <p className='text-sm text-gray-500 mb-2'>
                                    Total facturación: <span className='font-semibold text-gray-700'>{formatARS(revenueChartData.totalFacturacion)}</span>
                                </p>
                            )}
                            {(revenueChartData?.buckets?.length ?? 0) === 0 ? (
                                <p className='text-sm text-gray-500'>Sin datos.</p>
                            ) : (
                                <ResponsiveContainer width='100%' height={280}>
                                    <BarChart data={revenueChartData.buckets}>
                                        <CartesianGrid strokeDasharray='3 3' />
                                        <XAxis dataKey='bucket' />
                                        <YAxis tickFormatter={formatARS} width={90} />
                                        <Tooltip formatter={(v) => formatARS(v)} />
                                        <Bar dataKey='facturacion' fill='#8b5cf6' name='Facturación' />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        <ChartCard title='Rendimiento por sucursal'>
                            {chartErrors.branch && <p className='text-sm text-red-500 mb-2'>{chartErrors.branch}</p>}
                            {branchPerfRows.length === 0 ? (
                                <p className='text-sm text-gray-500'>Sin actividad en el rango seleccionado.</p>
                            ) : (
                                <ResponsiveContainer width='100%' height={Math.max(220, branchPerfRows.length * 50)}>
                                    <BarChart data={branchPerfRows} layout='vertical' margin={{ left: 20 }}>
                                        <CartesianGrid strokeDasharray='3 3' />
                                        <XAxis type='number' allowDecimals={false} />
                                        <YAxis type='category' dataKey='branchName' width={130} />
                                        <Tooltip content={<BranchTooltip />} />
                                        <Legend />
                                        <Bar dataKey='ordersCreated' fill='#3b82f6' name='Creadas' />
                                        <Bar dataKey='ordersDelivered' fill='#10b981' name='Entregadas' />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </section>
                )}
            </div>
        </div>
    )
}

function BranchTooltip({ active, payload }) {
    if (!active || !payload?.length) return null
    const row = payload[0].payload
    return (
        <div className='bg-white p-2 border rounded shadow text-sm'>
            <p className='font-semibold'>{row.branchName}</p>
            <p>Creadas: {row.ordersCreated}</p>
            <p>Entregadas: {row.ordersDelivered}</p>
            <p>Tasa de entrega: {(row.deliveryRate * 100).toFixed(1)}%</p>
            <p>≤ 7 días: {row.deliveredWithin7Days}</p>
            {row.avgDaysToDelivery != null && <p>Promedio días: {row.avgDaysToDelivery.toFixed(1)}</p>}
        </div>
    )
}

function extractError(e) {
    if (e?.response?.status === 401) return 'Sesión expirada — reloguear'
    return e?.response?.data?.error?.message ?? e?.message ?? 'Error desconocido'
}

export default Resumen
