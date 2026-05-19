import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import Select from 'react-select'
import MainNavBar from './MainNavBar'
import SERVER from '../server'

// Estados y grupo resueltos dinámicamente por NOMBRE (no hardcodeamos ids):
//   - Estado inicial de la pre-venta: 'COMPRAR REPUESTO'
//   - Grupo asignado: 'Atencion al cliente Belgrano' (el grupo 14 hoy)
const STATE_NAME = 'COMPRAR REPUESTO'
const GROUP_NAME = 'Atencion al cliente Belgrano'

function PreVenta() {
    const navigate = useNavigate()
    const branchId = JSON.parse(localStorage.getItem('branchId') ?? 'null')
    const userId = JSON.parse(localStorage.getItem('userId') ?? 'null')
    const username = localStorage.getItem('username') ?? ''

    // ---- Cliente (autocomplete igual que movesSells.js) ----
    const [clients, setClients] = useState([])
    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')

    // ---- Dispositivo / color / precio ----
    const [devices, setDevices] = useState([])
    const [deviceId, setDeviceId] = useState(null)
    const [color, setColor] = useState('')
    const [precioVenta, setPrecioVenta] = useState('')

    // ---- Cajas de seña + dolar ----
    const [cuentasCategories, setCuentasCategories] = useState([])
    const [senyaCategoryId, setSenyaCategoryId] = useState(null)
    const [dolar, setDolar] = useState(1000)

    // ---- Estado/grupo resueltos dinámicamente ----
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
            const senya = data.find(c => c.categories === 'Seña')
            if (senya) setSenyaCategoryId(senya.idmovcategories)
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

    const deviceOptions = useMemo(() => (
        devices.map(d => ({ label: `${d.brand ?? ''} ${d.type ?? ''} ${d.model}`.trim(), value: d.iddevices }))
    ), [devices])

    function handleSelectClient(c) {
        setNombre(c.name)
        setApellido(c.surname)
        document.getElementById('instagram').value = c.instagram ?? ''
        document.getElementById('email').value = c.email ?? ''
        document.getElementById('phone').value = c.phone ?? ''
        document.getElementById('postal').value = c.postal ?? ''
    }

    async function handleSubmit(event) {
        event.preventDefault()
        if (submitting) return
        if (stateId === null) { alert(`Estado "${STATE_NAME}" no encontrado en el catálogo`); return }
        if (groupId === null) { alert(`Grupo "${GROUP_NAME}" no encontrado en el catálogo`); return }
        if (senyaCategoryId === null) { alert('Categoría "Seña" no encontrada'); return }
        if (!deviceId) { alert('Seleccioná el equipo'); return }

        const precioVentaNum = parseFloat(precioVenta)
        if (!Number.isFinite(precioVentaNum) || precioVentaNum <= 0) {
            alert('Ingresá un precio de venta válido'); return
        }

        // Sumar la seña ingresada por caja. Las cuentas USD se convierten a
        // pesos con el blue venta para que el "monto" del movname quede en
        // una sola moneda (pesos), igual que movesSells.
        const cajasIngresadas = []
        let senyaTotalPesos = 0
        for (const c of cuentasCategories) {
            const el = document.getElementById(`caja-${c.idmovcategories}`)
            const val = parseFloat(el?.value || 0)
            if (val > 0) {
                const enPesos = c.es_dolar === 1 ? val * dolar : val
                cajasIngresadas.push({ cat: c, val, enPesos })
                senyaTotalPesos += enPesos
            }
        }
        if (senyaTotalPesos <= 0) { alert('Ingresá el monto de la seña en alguna caja'); return }
        if (senyaTotalPesos > precioVentaNum) {
            if (!window.confirm('La seña supera el precio de venta. ¿Continuar?')) return
        }

        setSubmitting(true)
        try {
            const fechaAR = new Date().toLocaleString('en-IN', {
                timeZone: 'America/Argentina/Buenos_Aires', hour12: false,
            }).replace(',', '')

            // 1. Cliente: si los datos del form matchean un cliente existente
            //    POST /clients devuelve el existente (lo maneja el backend);
            //    si es nuevo, lo crea.
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

            // 2. Crear la orden con es_preventa=1 + precio + color.
            const orderRes = await axios.post(`${SERVER}/orders`, {
                client_id: clientId,
                device_id: deviceId,
                branches_id: branchId,
                state_id: stateId,
                problem: 'Pre-Venta',
                password: 'n/a',
                accesorios: 'n/a',
                serial: 'n/a',
                device_color: color,
                users_id: groupId,
                es_preventa: 1,
                precio_venta: precioVentaNum,
                color_preventa: color,
            })
            const orderId = orderRes.data.insertId

            // 3. Registrar la seña: movname (ingreso=primera caja, egreso='Seña')
            //    + movements (caja_id +seña, seña_id -seña). El "operacion"
            //    muestra "Seña pre-venta #N" para que en Libro Contable se
            //    identifique fácil.
            const operacion = `Seña pre-venta #${orderId} - ${clientData.name} ${clientData.surname}`
            const arrayMovements = cajasIngresadas.map(c => {
                // Conservamos la moneda nativa de la caja en movements.unidades
                // (USD si es_dolar=1, pesos si no) — mismo criterio que
                // movesSells. La columna monto de movname sí va en pesos.
                const unidades = c.cat.es_dolar === 1 ? c.val : c.val
                return [c.cat.idmovcategories, unidades]
            })
            arrayMovements.push([senyaCategoryId, -senyaTotalPesos])

            // ingreso/egreso = nombre de la primera caja y 'Seña' respectivamente
            const firstCajaName = cajasIngresadas[0].cat.categories
            const valuesCreateMovname = [
                firstCajaName,     // ingreso
                'Seña',            // egreso
                operacion,
                senyaTotalPesos,   // monto
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

            alert('Pre-venta creada con éxito')
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
                    Generá una orden con depósito previo al retiro. El equipo se entrega
                    cuando el cliente vuelve a pagar el saldo.
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
                        <div className='flex'>
                            <div className='w-full'>
                                <label className='block text-gray-700 font-bold mb-2'>Instagram:</label>
                                <input className='shadow border rounded w-full py-2 px-3' type='text' id='instagram' name='instagram' />
                            </div>
                            <div className='w-full'>
                                <label className='block text-gray-700 font-bold mb-2'>Teléfono:</label>
                                <input className='shadow border rounded w-full py-2 px-3' type='text' id='phone' name='phone' />
                            </div>
                            <div className='w-full'>
                                <label className='block text-gray-700 font-bold mb-2'>Email:</label>
                                <input className='shadow border rounded w-full py-2 px-3' type='text' id='email' name='email' />
                            </div>
                        </div>
                        <label className='block text-gray-700 font-bold my-2'>Código Postal (opcional):</label>
                        <input className='shadow border rounded w-full py-2 px-3' type='text' id='postal' name='postal' />
                    </div>

                    {/* DISPOSITIVO + COLOR */}
                    <div className='mb-2 p-2 bg-blue-100'>
                        <label className='font-bold'>Equipo</label>
                        <div className='flex gap-2 items-end'>
                            <div className='flex-1'>
                                <label className='block text-gray-700 font-bold mb-2'>Modelo: *</label>
                                <Select
                                    options={deviceOptions}
                                    placeholder='Seleccionar modelo'
                                    onChange={e => setDeviceId(e?.value ?? null)}
                                    menuPlacement='auto' />
                                <button type='button'
                                    className='mt-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm'
                                    onClick={() => navigate('/devices')}>
                                    Agregar modelo
                                </button>
                            </div>
                            <div className='flex-1'>
                                <label className='block text-gray-700 font-bold mb-2'>Color: *</label>
                                <input className='shadow border rounded w-full py-2 px-3' type='text'
                                    value={color} onChange={e => setColor(e.target.value)}
                                    placeholder='Rojo / Negro / Plata' required />
                            </div>
                        </div>
                    </div>

                    {/* PRECIO DE VENTA */}
                    <div className='mb-2 p-2 bg-blue-100'>
                        <label className='block text-gray-700 font-bold mb-2'>Precio de venta acordado (pesos): *</label>
                        <input className='shadow border rounded w-full py-2 px-3' type='number' step='1' min='0'
                            value={precioVenta} onChange={e => setPrecioVenta(e.target.value)} required />
                    </div>

                    {/* SEÑA - CAJAS */}
                    <div className='mb-2 p-2 bg-blue-100'>
                        <label className='block text-gray-700 font-bold mb-2'>Seña recibida *</label>
                        <p className='text-xs text-gray-600 mb-2'>
                            Ingresá el monto recibido en la caja correspondiente. USD se
                            convierten al blue venta automáticamente.
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
