import React, {useState, useEffect, useMemo} from 'react'
import axios from 'axios'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'
import { useLocation, useNavigate } from 'react-router-dom';

// Form rediseñado: 1 dropdown de caja + 1 monto. El sistema detecta el tipo
// (cobro/extracción) por el signo del movement de tipo Cuentas existente, y
// auto-balancea el lado P&L primario al guardar. Las líneas P&L secundarias
// (CMV/Repuestos en ventas) se preservan sin cambios.
function EditarOperaciones() {
    const [selectMovname, setSelectMovname] = useState({})
    const [operationMovements, setOperationMovements] = useState([])
    const [cuentasCategories, setCuentasCategories] = useState([])

    // Form state: caja seleccionada + monto. El sign y el balance del lado
    // P&L se calculan al submit a partir del original.
    const [selectedCajaId, setSelectedCajaId] = useState('')
    const [montoInput, setMontoInput] = useState('')

    const [isNotLoading, setIsNotLoading] = useState(true);
    const [dolar, setDolar] = useState(1000)

    const navigate = useNavigate();
    const location = useLocation();
    const movnameId = parseInt(location.pathname.split("/")[2]);
    const branchId = JSON.parse(localStorage.getItem("branchId"))

    useEffect(() => {
        const fetchStates = async () => {
            // movname (header)
            const movnameResp = await axios.get(`${SERVER}/movname/${branchId}`)
                .catch(err => { console.error(err); return { data: [] } })
            const filteredMovname = (movnameResp.data || []).find(m => m.idmovname === movnameId) || {}
            setSelectMovname(filteredMovname)

            // movements de esta operación
            const movsResp = await axios.get(`${SERVER}/movements/${branchId}`)
                .catch(err => { console.error(err); return { data: [] } })
            const filtered = (movsResp.data || []).filter(m => m.movname_id === movnameId)
            setOperationMovements(filtered)

            // cajas disponibles para el dropdown — categorías tipo Cuentas
            const catResp = await axios.get(`${SERVER}/movcategories`)
                .catch(err => { console.error(err); return { data: [] } })
            const cuentas = (catResp.data || [])
                .filter(c => (c.tipo || '').includes('Cuentas'))
                .filter(c => c.branch_id === branchId || c.branch_id === null)
            setCuentasCategories(cuentas)

            // Pre-populate form: la caja original + monto absoluto del lado caja.
            const cajaMov = filtered.find(m => (m.tipo || '').includes('Cuentas'))
            if (cajaMov) {
                setSelectedCajaId(String(cajaMov.movcategories_id))
                setMontoInput(String(Math.abs(parseFloat(cajaMov.unidades))))
            }

            // Tasa USD (blue) para conversiones cross-currency entre caja y P&L.
            await axios.get(`https://api.bluelytics.com.ar/v2/latest`)
                .then(r => setDolar(r.data.blue.value_sell))
                .catch(err => console.error(err))
        }
        fetchStates()
    // eslint-disable-next-line
    }, []);

    // Análisis del movname (caso, primary P&L, otras líneas) — derivado.
    const analysis = useMemo(() => {
        const cajaMov = operationMovements.find(m => (m.tipo || '').includes('Cuentas'))
        if (!cajaMov) return null
        const cajaOriginalSign = parseFloat(cajaMov.unidades) >= 0 ? 1 : -1
        const caso = cajaOriginalSign > 0 ? 'cobro' : 'extraccion'
        // Primary P&L: el movement no-Cuentas cuyo nombre matchea el lado
        // contrario al de la caja en movname (egreso si caja=ingreso).
        const otherSideName = cajaOriginalSign > 0 ? selectMovname.egreso : selectMovname.ingreso
        const primaryPnL = operationMovements.find(m =>
            !((m.tipo || '').includes('Cuentas')) && m.categories === otherSideName
        )
        const others = operationMovements.filter(m =>
            m !== cajaMov && m !== primaryPnL
        )
        return { cajaMov, cajaOriginalSign, caso, primaryPnL, others }
    }, [operationMovements, selectMovname.egreso, selectMovname.ingreso])

    const selectedCaja = useMemo(
        () => cuentasCategories.find(c => String(c.idmovcategories) === String(selectedCajaId)),
        [cuentasCategories, selectedCajaId]
    )
    const cajaIsDolar = selectedCaja?.es_dolar === 1

    async function handleSubmit(event) {
        event.preventDefault();
        if (!isNotLoading) return
        if (!analysis) {
            return alert('No se puede editar: la operación no tiene un movement de caja identificable.')
        }
        if (!selectedCaja) return alert('Seleccionar una caja.')
        const newMonto = parseFloat(montoInput)
        if (Number.isNaN(newMonto) || newMonto <= 0) return alert('Ingresar un monto válido (> 0).')

        setIsNotLoading(false)
        try {
            const sign = analysis.cajaOriginalSign // +1 cobro, -1 extracción
            const newMovements = []
            // Caja nueva con el sign correcto.
            newMovements.push([
                selectedCaja.idmovcategories,
                sign * newMonto,
                movnameId,
                branchId,
            ])

            // Primary P&L: opuesto al lado caja, con conversión de moneda
            // si caja y P&L difieren (USD vs pesos via dolar rate actual).
            if (analysis.primaryPnL) {
                const pnlIsDolar = analysis.primaryPnL.es_dolar === 1
                let pnlValue
                if (cajaIsDolar === pnlIsDolar) pnlValue = -sign * newMonto
                else if (cajaIsDolar && !pnlIsDolar) pnlValue = -sign * newMonto * dolar
                else pnlValue = -sign * newMonto / dolar
                newMovements.push([
                    analysis.primaryPnL.movcategories_id,
                    pnlValue,
                    movnameId,
                    branchId,
                ])
            }

            // Otras líneas (CMV/Repuestos en ventas) — preservadas sin cambios.
            analysis.others.forEach(m => {
                newMovements.push([
                    m.movcategories_id,
                    parseFloat(m.unidades),
                    movnameId,
                    branchId,
                ])
            })

            // movname.monto: convención cajas-en-pesos.
            const montoTotal = cajaIsDolar ? newMonto * dolar : newMonto

            const resp = await axios.put(`${SERVER}/movements/${movnameId}`, {
                arrayInsert: newMovements,
                montoTotal,
            })
            if (resp.status === 200) {
                setIsNotLoading(true)
                alert('Operación actualizada')
                navigate('/librocontable')
            }
        } catch (error) {
            setIsNotLoading(true)
            const msg = error?.response?.data || 'Error al actualizar'
            alert(typeof msg === 'string' ? msg : 'Error al actualizar')
        }
    }

    const casoLabel = analysis?.caso === 'cobro' ? 'Cobro / Ingreso' :
                      analysis?.caso === 'extraccion' ? 'Extracción / Gasto' :
                      'Sin clasificar'

    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className="bg-white my-2 py-4 max-w-3xl mx-auto px-4">
              <div className='text-center'>
                <h1 className="text-5xl font-bold mb-6">Editar operación</h1>

                <table className="mt-4 w-full">
                    <thead>
                        <tr>
                            <th className="px-4 py-2 border border-black">Id</th>
                            <th className="px-4 py-2 border border-black">Operacion</th>
                            <th className="px-4 py-2 border border-black">Monto</th>
                            <th className="px-4 py-2 border border-black">Fecha</th>
                        </tr>
                    </thead>
                    <tbody className='text-center'>
                        <tr className="hover:bg-gray-100 border border-black">
                            <td className="px-4 py-2">{selectMovname.idmovname}</td>
                            <td className="px-4 py-2">{selectMovname.operacion}</td>
                            <td className="px-4 py-2">{selectMovname.monto}</td>
                            <td className="px-4 py-2">{selectMovname.fecha}</td>
                        </tr>
                    </tbody>
                </table>

                <div className='mt-6 p-3 bg-blue-50 border border-blue-200 rounded text-left'>
                    <p><b>Tipo detectado:</b> {casoLabel}</p>
                    {analysis?.primaryPnL && (
                        <p><b>Lado P&L primario:</b> {analysis.primaryPnL.categories} (se balancea automáticamente)</p>
                    )}
                    {analysis?.others?.length > 0 && (
                        <p><b>Otras líneas preservadas:</b> {analysis.others.map(m => m.categories).join(', ')}</p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className='mt-6'>
                    <div className='flex flex-col md:flex-row gap-4 items-end'>
                        <div className='w-full'>
                            <label className="block text-gray-700 font-bold mb-2">
                                Caja {analysis?.caso === 'cobro' ? 'de recepción' : 'de origen'}:
                            </label>
                            <select
                                className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                                value={selectedCajaId}
                                onChange={(e) => setSelectedCajaId(e.target.value)}
                            >
                                <option value="" disabled>Seleccionar caja</option>
                                {cuentasCategories.map(c => (
                                    <option key={c.idmovcategories} value={c.idmovcategories}>
                                        {c.categories} {c.es_dolar === 1 ? '(USD)' : '($)'}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className='w-full'>
                            <label className="block text-gray-700 font-bold mb-2">
                                Monto {cajaIsDolar ? '(USD)' : '($)'}:
                            </label>
                            <input
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type="number"
                                step="0.01"
                                min="0"
                                value={montoInput}
                                onChange={(e) => setMontoInput(e.target.value)}
                            />
                        </div>
                    </div>
                    <button type='submit' className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                        Actualizar
                    </button>
                    <button
                        type='button'
                        className="mt-4 ml-2 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
                        onClick={() => navigate('/librocontable')}
                    >
                        Cancelar
                    </button>
                </form>
              </div>
            </div>
        </div>
    );
}

export default EditarOperaciones
