import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import MainNavBar from './MainNavBar'
import SERVER from '../server'
import PhoneInput from '../utils/PhoneInput'

// Una pre-venta es UNA orden con UN cliente y opcionalmente MÚLTIPLES equipos.
// Sólo el primer equipo se "engancha" como device_id de la orden (limitación
// del modelo orders × devices N:1). El resto queda volcado en un mensaje
// automático con formato fijo, agregado a la orden al crearla.
const STATE_NAME = 'COMPRAR REPUESTO'
const GROUP_NAME = 'Atencion al cliente Belgrano'

const CAPACIDADES = ['No corresponde', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB']

// Equipo blanco para inicializar / agregar fila.
// moneda default 'USD' per spec (el precio default es USD, el usuario
// toggla a ARS si corresponde).
const equipoVacio = () => ({ deviceId: null, deviceLabel: '', capacidad: '', color: '', precio: '', moneda: 'USD' })

function PreVenta() {
    const navigate = useNavigate()
    const branchId = JSON.parse(localStorage.getItem('branchId') ?? 'null')
    const userId = JSON.parse(localStorage.getItem('userId') ?? 'null')
    const username = localStorage.getItem('username') ?? ''

    const [clients, setClients] = useState([])
    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')
    // Teléfono controlado + matches server-side (mismo patrón que orders.jsx).
    const [phone, setPhone] = useState('')
    const [phoneMatches, setPhoneMatches] = useState([])

    const [devices, setDevices] = useState([])
    const [equipos, setEquipos] = useState([equipoVacio()])

    const [cuentasCategories, setCuentasCategories] = useState([])
    // Dos categorías Seña separadas por moneda (mayo 2026). Cada caja
    // ingresada genera un movement contra la categoría que matchea su
    // moneda — así el storage preserva la moneda nativa sin conversión
    // por dolar blue.
    const [senyaArsId, setSenyaArsId] = useState(null)
    const [senyaUsdId, setSenyaUsdId] = useState(null)
    const [dolar, setDolar] = useState(1000)

    const [stateId, setStateId] = useState(null)
    const [groupId, setGroupId] = useState(null)

    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        axios.get(`${SERVER}/clients`).then(r => setClients(r.data)).catch(e => console.error(e))
        axios.get(`${SERVER}/devices`).then(r => setDevices(r.data)).catch(e => console.error(e))
        axios.get('https://api.bluelytics.com.ar/v2/latest').then(r => setDolar(r.data.blue.value_sell)).catch(() => {})
        axios.get(`${SERVER}/movcategories`).then(r => {
            const data = r.data
            const cuentas = data
                .filter(c => (c.tipo ?? '').includes('Cuentas'))
                .filter(c => c.branch_id === branchId || c.branch_id === null)
            setCuentasCategories(cuentas)
            const sa = data.find(c => c.categories === 'Seña ARS')
            const su = data.find(c => c.categories === 'Seña USD')
            if (sa) setSenyaArsId(sa.idmovcategories)
            if (su) setSenyaUsdId(su.idmovcategories)
        }).catch(e => console.error(e))
        axios.get(`${SERVER}/states`).then(r => {
            const s = r.data.find(x => (x.state ?? '').trim().toUpperCase() === STATE_NAME)
            if (s) setStateId(s.idstates)
        }).catch(e => console.error(e))
        axios.get(`${SERVER}/grupousuarios`).then(r => {
            const g = r.data.find(x => (x.grupo ?? '').trim().toLowerCase() === GROUP_NAME.toLowerCase())
            if (g) setGroupId(g.idgrupousuarios)
        }).catch(e => console.error(e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Catálogo formato react-select. Conservamos brand/type/model en el
    // payload para poder armar el texto del mensaje automático sin hacer
    // otro lookup (devices ya está en memoria).
    const deviceOptions = useMemo(() => devices.map(d => ({
        label: `${d.brand ?? ''} ${d.type ?? ''} ${d.model}`.trim(),
        value: d.iddevices,
        raw: d,
    })), [devices])

    function updateEquipo(idx, patch) {
        setEquipos(prev => prev.map((e, i) => i === idx ? { ...e, ...patch } : e))
    }
    function addEquipo() {
        setEquipos(prev => [...prev, equipoVacio()])
    }
    function removeEquipo(idx) {
        setEquipos(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== idx))
    }

    function handleSelectClient(c) {
        setNombre(c.name)
        setApellido(c.surname)
        document.getElementById('instagram').value = c.instagram ?? ''
        document.getElementById('email').value = c.email ?? ''
        setPhone(c.phone || '')
        document.getElementById('postal').value = c.postal ?? ''
        setPhoneMatches([])
    }

    // Búsqueda server-side por coincidencia parcial de teléfono.
    useEffect(() => {
        const digits = (phone || '').replace(/[^0-9]/g, '')
        if (digits.length < 4) { setPhoneMatches([]); return }
        const id = setTimeout(() => {
            axios.get(`${SERVER}/clients/search?phone=${encodeURIComponent(digits)}`)
                .then(r => setPhoneMatches(r.data || []))
                .catch(err => { console.error('clients/search', err); setPhoneMatches([]) })
        }, 250)
        return () => clearTimeout(id)
    }, [phone])

    // moneda_preventa de la orden = moneda del PRIMER equipo (heurística
    // simple para órdenes mixtas; la columna sólo guarda un valor).
    const monedaOrden = equipos[0]?.moneda ?? 'USD'

    // Convierte un precio entre USD/ARS usando el blue venta.
    function convertTo(precio, desdeMoneda, hastaMoneda) {
        if (desdeMoneda === hastaMoneda) return precio
        if (desdeMoneda === 'USD' && hastaMoneda === 'ARS') return precio * dolar
        if (desdeMoneda === 'ARS' && hastaMoneda === 'USD') return precio / dolar
        return precio
    }

    // Total en la moneda de la orden (suma con conversión cuando hay mix).
    const totalAcordado = useMemo(() => (
        equipos.reduce((acc, e) => (
            acc + convertTo(parseFloat(e.precio) || 0, e.moneda, monedaOrden)
        ), 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [equipos, monedaOrden, dolar])

    async function handleSubmit(event) {
        event.preventDefault()
        if (submitting) return
        if (stateId === null) { alert(`Estado "${STATE_NAME}" no encontrado`); return }
        if (groupId === null) { alert(`Grupo "${GROUP_NAME}" no encontrado`); return }
        if (senyaArsId === null || senyaUsdId === null) {
            alert('Categorías "Seña ARS"/"Seña USD" no encontradas'); return
        }

        // Validación por equipo: todos los campos son requeridos.
        for (let i = 0; i < equipos.length; i++) {
            const e = equipos[i]
            if (!e.deviceId) { alert(`Equipo ${i + 1}: seleccioná el modelo`); return }
            if (!e.capacidad) { alert(`Equipo ${i + 1}: seleccioná la capacidad`); return }
            if (!e.color.trim()) { alert(`Equipo ${i + 1}: ingresá el color`); return }
            const p = parseFloat(e.precio)
            if (!Number.isFinite(p) || p <= 0) { alert(`Equipo ${i + 1}: precio inválido`); return }
        }
        if (totalAcordado <= 0) { alert('El total acordado debe ser mayor a 0'); return }

        // Sumar la seña ingresada por caja, agrupando por moneda nativa.
        // No más conversión a pesos en el storage — cada moneda mantiene
        // su precisión.
        const cajasIngresadas = []
        let senyaTotalUSD = 0
        let senyaTotalARS = 0
        for (const c of cuentasCategories) {
            const el = document.getElementById(`caja-${c.idmovcategories}`)
            const val = parseFloat(el?.value || 0)
            if (val > 0) {
                cajasIngresadas.push({ cat: c, val })
                if (c.es_dolar === 1) senyaTotalUSD += val
                else senyaTotalARS += val
            }
        }
        // Para comparar con totalAcordado convertimos cada lado a la moneda
        // de la orden y sumamos.
        const senyaEnMonedaOrden = monedaOrden === 'USD'
            ? senyaTotalUSD + senyaTotalARS / dolar
            : senyaTotalARS + senyaTotalUSD * dolar
        if (senyaEnMonedaOrden > totalAcordado) {
            if (!window.confirm('La seña supera el total acordado. ¿Continuar?')) return
        }

        setSubmitting(true)
        try {
            const fechaAR = new Date().toLocaleString('en-IN', {
                timeZone: 'America/Argentina/Buenos_Aires', hour12: false,
            }).replace(',', '')

            // 1. Cliente: alta o match existente (POST /clients lo decide
            //    server-side por nombre + contacto, ver CRUD/clients.js).
            const formData = new FormData(event.target)
            const clientData = {
                name: formData.get('name').trim(),
                surname: formData.get('surname').trim(),
                email: formData.get('email').trim(),
                instagram: formData.get('instagram').trim(),
                phone: formData.get('phone').trim(),
                postal: formData.get('postal').trim(),
            }
            if (!clientData.name || !clientData.surname) {
                setSubmitting(false); return alert('Agregá nombre y apellido')
            }
            if (!clientData.email && !clientData.instagram && !clientData.phone) {
                setSubmitting(false); return alert('Agregá algún método de contacto')
            }
            const clientRes = await axios.post(`${SERVER}/clients`, clientData)
            const clientId = clientRes.data[0].idclients

            // 2. Crear la orden. device_id = primer equipo (limitación del
            //    modelo orders × devices N:1). El resto va al mensaje
            //    automático abajo. color_preventa = color del primer
            //    equipo (para mostrar en el banner de Messages.js).
            const primerEquipo = equipos[0]
            const orderRes = await axios.post(`${SERVER}/orders`, {
                client_id: clientId,
                device_id: primerEquipo.deviceId,
                branches_id: branchId,
                state_id: stateId,
                problem: 'Pre-Venta',
                password: 'n/a',
                accesorios: 'n/a',
                serial: 'n/a',
                device_color: primerEquipo.color,
                users_id: groupId,
                es_preventa: 1,
                precio_venta: totalAcordado,
                color_preventa: primerEquipo.color,
                moneda_preventa: monedaOrden,
            })
            const orderId = orderRes.data.insertId

            // 3. Mensaje automático con el detalle completo de la pre-venta.
            //    Formato pedido por el owner (mayo 2026).
            const lineasEquipos = equipos.map((e, i) => {
                const d = e.deviceLabel || ''
                const precioFmt = Number(e.precio).toLocaleString('es-AR')
                return `Equipo ${i + 1}: ${d} ${e.capacidad} ${e.color} - $${precioFmt} ${e.moneda}`
            }).join('\n')
            const totalFmt = `$${Math.round(totalAcordado).toLocaleString('es-AR')} ${monedaOrden}`
            const senaLines = []
            for (const c of cajasIngresadas) {
                const m = c.cat.es_dolar === 1 ? 'USD' : 'ARS'
                senaLines.push(`$${Number(c.val).toLocaleString('es-AR')} ${m} (${c.cat.categories})`)
            }
            const senaFmt = senaLines.length > 0 ? senaLines.join(' + ') : '$0'
            const msgText =
`PRE-VENTA:
${lineasEquipos}
Total acordado: ${totalFmt}
Seña recibida: ${senaFmt}`
            await axios.post(`${SERVER}/orders/messages`, {
                username,
                message: msgText,
                orderId,
            })

            // 4. Registrar la seña en movname/movements (si total > 0).
            //    Cada caja ingresa por su moneda nativa. La contraparte de
            //    seña se splittea en Seña USD / Seña ARS para mantener
            //    moneda — sin pérdida por conversión.
            const senyaTotalAny = senyaTotalUSD > 0 || senyaTotalARS > 0
            if (senyaTotalAny) {
                const operacion = `Seña pre-venta #${orderId} - ${clientData.name} ${clientData.surname}`
                const arrayMovements = cajasIngresadas.map(c => (
                    [c.cat.idmovcategories, c.val]
                ))
                if (senyaTotalUSD > 0) arrayMovements.push([senyaUsdId, -senyaTotalUSD])
                if (senyaTotalARS > 0) arrayMovements.push([senyaArsId, -senyaTotalARS])

                // movname.monto en pesos para display agregado en Libro
                // Contable (usamos el blue actual para el display sumado;
                // las unidades movements quedan en moneda nativa).
                const montoPesos = senyaTotalARS + senyaTotalUSD * dolar
                // ingreso/egreso son labels — primer caja como ingreso,
                // egreso 'Seña ARS'/'Seña USD'/'Seña (mixto)' según el caso.
                const firstCajaName = cajasIngresadas[0].cat.categories
                const egresoLabel = senyaTotalUSD > 0 && senyaTotalARS > 0
                    ? 'Seña (mixto)'
                    : senyaTotalUSD > 0 ? 'Seña USD' : 'Seña ARS'
                const valuesCreateMovname = [
                    firstCajaName,
                    egresoLabel,
                    operacion,
                    montoPesos,
                    fechaAR,
                    userId,
                    branchId,
                    orderId,
                ]
                await axios.post(`${SERVER}/movname/movesPreVentaSenya`, {
                    valuesCreateMovname,
                    arrayMovements,
                    branch_id: branchId,
                })
            }

            alert(senyaTotalAny
                ? 'Pre-venta creada con éxito'
                : 'Pre-venta creada sin seña — el saldo total se cobra al retiro')
            navigate(`/messages/${orderId}`)
        } catch (error) {
            console.error(error)
            const msg = error?.response?.data ?? error.message
            alert('No se pudo guardar la pre-venta — ' + (typeof msg === 'string' ? msg : 'ver consola'))
            setSubmitting(false)
        }
    }

    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className='bg-white my-2 py-8 px-2 max-w-4xl mx-auto'>
                <h1 className='text-center text-5xl'>Pre-Venta</h1>
                <p className='text-center text-sm text-gray-600 mb-4'>
                    Generá una orden con depósito previo al retiro. Podés agregar
                    múltiples equipos al mismo cliente.
                </p>
                <form onSubmit={handleSubmit} className='p-4 max-w-3xl mx-auto'>
                    {/* CLIENTE */}
                    <div className='mb-2 p-2 bg-blue-100'>
                        <label className='font-bold'>Cliente</label>
                        <div className='flex'>
                            <div className='w-full'>
                                <label className='block text-gray-700 font-bold mb-2'>Nombre: *</label>
                                <input className='shadow border rounded w-full py-2 px-3' type='text' id='name' name='name'
                                    value={nombre} onChange={e => setNombre(e.target.value)} required />
                            </div>
                            <div className='w-full'>
                                <label className='block text-gray-700 font-bold mb-2'>Apellido: *</label>
                                <input className='shadow border rounded w-full py-2 px-3' type='text' id='surname' name='surname'
                                    value={apellido} onChange={e => setApellido(e.target.value)} required />
                            </div>
                        </div>
                        {nombre && (
                            <ul className='bg-gray-100 absolute z-10'>
                                {clients.filter(c =>
                                    String(c.name).toLowerCase().includes(nombre.toLowerCase()) &&
                                    String(c.surname).toLowerCase().includes(apellido.toLowerCase())
                                ).slice(0, 8).map(c => (
                                    <li key={c.idclients} className='border px-2 py-1 cursor-pointer'
                                        onClick={() => handleSelectClient(c)}>
                                        {c.name} {c.surname} — {c.email || c.instagram || c.phone}
                                    </li>
                                ))}
                            </ul>
                        )}
                        <label className='flex justify-center text-gray-700 font-bold mt-2'>Contacto *</label>
                        <div className='flex gap-2'>
                            <div className='w-full'>
                                <label className='block text-gray-700 font-bold mb-2' htmlFor='instagram'>Instagram:</label>
                                <input className='shadow border rounded w-full h-10 box-border px-3 text-gray-700 leading-tight'
                                    type='text' id='instagram' name='instagram' />
                            </div>
                            <div className='w-full relative'>
                                <label className='block text-gray-700 font-bold mb-2' htmlFor='phone'>Teléfono:</label>
                                <PhoneInput value={phone} onChange={setPhone} name='phone' placeholder='número' />
                                {phoneMatches.length > 0 && (
                                    <ul className='bg-gray-100 absolute z-10 border shadow left-0 right-0'>
                                        {phoneMatches.map(c => (
                                            <li key={`phone-${c.idclients}`}
                                                className='border px-2 py-1 cursor-pointer hover:bg-gray-200'
                                                onClick={() => handleSelectClient(c)}>
                                                {c.phone} — {c.name} {c.surname} {c.email && `(${c.email})`}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                        <label className='block text-gray-700 font-bold mt-2 mb-2' htmlFor='email'>Email:</label>
                        <input className='shadow border rounded w-full h-10 box-border px-3 text-gray-700 leading-tight'
                            type='text' id='email' name='email' />
                        <label className='block text-gray-700 font-bold mt-2 mb-2' htmlFor='postal'>Código Postal (opcional):</label>
                        <input className='shadow border rounded w-1/2 h-10 box-border px-3 text-gray-700 leading-tight'
                            type='text' id='postal' name='postal' />
                    </div>

                    {/* EQUIPOS */}
                    <div className='mb-2 p-2 bg-blue-100'>
                        <div className='flex justify-between items-center mb-2'>
                            <label className='font-bold'>Equipos *</label>
                            <button type='button'
                                className='bg-blue-500 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded text-sm'
                                onClick={addEquipo}>
                                + Agregar equipo
                            </button>
                        </div>
                        <p className='text-xs text-gray-600 mb-2'>
                            El primer equipo se asocia al device_id de la orden. Los demás
                            se guardan como mensaje automático.
                        </p>
                        {equipos.map((eq, i) => (
                            <div key={i} className='border border-blue-300 rounded p-2 mb-2 bg-white'>
                                <div className='flex justify-between items-center mb-2'>
                                    <span className='text-sm font-bold text-blue-800'>Equipo {i + 1}</span>
                                    {equipos.length > 1 && (
                                        <button type='button'
                                            className='text-red-600 hover:text-red-800 font-bold text-sm'
                                            onClick={() => removeEquipo(i)}>
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                                    <div>
                                        <label className='block text-gray-700 font-bold text-sm mb-1'>Modelo *</label>
                                        <Select
                                            options={deviceOptions}
                                            placeholder='Seleccionar modelo'
                                            value={eq.deviceId
                                                ? deviceOptions.find(o => o.value === eq.deviceId)
                                                : null}
                                            onChange={opt => updateEquipo(i, {
                                                deviceId: opt?.value ?? null,
                                                deviceLabel: opt?.label ?? '',
                                            })}
                                            menuPlacement='auto' />
                                    </div>
                                    <div>
                                        <label className='block text-gray-700 font-bold text-sm mb-1'>Capacidad *</label>
                                        <select required
                                            className='shadow border rounded w-full py-2 px-3 bg-white'
                                            value={eq.capacidad}
                                            onChange={e => updateEquipo(i, { capacidad: e.target.value })}>
                                            <option value=''>— Elegir —</option>
                                            {CAPACIDADES.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className='block text-gray-700 font-bold text-sm mb-1'>Color *</label>
                                        <input required
                                            className='shadow border rounded w-full py-2 px-3'
                                            type='text' placeholder='Negro / Plata / Rojo'
                                            value={eq.color}
                                            onChange={e => updateEquipo(i, { color: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className='block text-gray-700 font-bold text-sm mb-1'>
                                            Precio ({eq.moneda}) *
                                        </label>
                                        <div className='flex gap-1'>
                                            <input required
                                                className='shadow border rounded flex-1 py-2 px-3'
                                                type='number' step='1' min='0'
                                                value={eq.precio}
                                                onChange={e => updateEquipo(i, { precio: e.target.value })} />
                                            <div className='inline-flex rounded shadow border overflow-hidden'>
                                                <button type='button'
                                                    onClick={() => updateEquipo(i, { moneda: 'USD' })}
                                                    className={`px-3 py-2 text-xs font-bold ${eq.moneda === 'USD' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
                                                    USD
                                                </button>
                                                <button type='button'
                                                    onClick={() => updateEquipo(i, { moneda: 'ARS' })}
                                                    className={`px-3 py-2 text-xs font-bold ${eq.moneda === 'ARS' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
                                                    ARS
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className='text-right text-sm mt-1'>
                            <span className='text-gray-600'>Total acordado: </span>
                            <span className='font-bold text-lg'>
                                ${Math.round(totalAcordado).toLocaleString('es-AR')} {monedaOrden}
                            </span>
                            {equipos.some(e => e.moneda !== monedaOrden) && (
                                <span className='text-xs text-gray-500 ml-2'>(equipos en otras monedas convertidos al blue ${dolar})</span>
                            )}
                        </div>
                        <button type='button' className='mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm'
                            onClick={() => navigate('/devices')}>
                            Agregar modelo al catálogo
                        </button>
                    </div>

                    {/* SEÑA */}
                    <div className='mb-2 p-2 bg-blue-100'>
                        <label className='block text-gray-700 font-bold mb-2'>Seña recibida (opcional)</label>
                        <p className='text-xs text-gray-600 mb-2'>
                            Dejar todas las cajas en 0 si el cliente reserva sin pagar todavía.
                            USD se convierten al blue venta automáticamente.
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
                            {submitting ? 'Guardando…' : 'Guardar pre-venta'}
                        </button>
                        <button type='button'
                            className='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded'
                            onClick={() => navigate('/home')}>
                            Volver
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default PreVenta
