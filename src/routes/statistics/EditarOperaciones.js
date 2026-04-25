import React, {useState, useEffect, useMemo} from 'react'
import axios from 'axios'
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'
import { useLocation, useNavigate } from 'react-router-dom';

// Form inspirado en el flujo de cobro de órdenes (movesRepairs.js): listado
// horizontal de TODAS las cajas, un input por caja, pre-populated con el
// valor actual si la operación lo tiene. Las categorías P&L (Reparaciones/
// Venta/CMV/etc.) se manejan internamente — el usuario no las ve.
//
// Detección automática:
//   - cobro/ingreso (signo + en la caja del original) → cajas suman positivo,
//     P&L primario se setea en -sum.
//   - extracción/gasto (signo -) → cajas suman negativo, P&L primario se
//     setea en +sum.
// Líneas P&L secundarias (CMV/Repuestos en ventas) se preservan tal cual.
function EditarOperaciones() {
    const [selectMovname, setSelectMovname] = useState({})
    const [operationMovements, setOperationMovements] = useState([])
    const [cuentasCategories, setCuentasCategories] = useState([])
    const [inputs, setInputs] = useState({})  // { [idmovcategories]: stringValue }

    const [isNotLoading, setIsNotLoading] = useState(true);
    const [dolar, setDolar] = useState(1000)

    const navigate = useNavigate();
    const location = useLocation();
    const movnameId = parseInt(location.pathname.split("/")[2]);
    const branchId = JSON.parse(localStorage.getItem("branchId"))

    useEffect(() => {
        const fetchStates = async () => {
            const movnameResp = await axios.get(`${SERVER}/movname/${branchId}`)
                .catch(err => { console.error(err); return { data: [] } })
            const filteredMovname = (movnameResp.data || []).find(m => m.idmovname === movnameId) || {}
            setSelectMovname(filteredMovname)

            const movsResp = await axios.get(`${SERVER}/movements/${branchId}`)
                .catch(err => { console.error(err); return { data: [] } })
            const filtered = (movsResp.data || []).filter(m => m.movname_id === movnameId)
            setOperationMovements(filtered)

            const catResp = await axios.get(`${SERVER}/movcategories`)
                .catch(err => { console.error(err); return { data: [] } })
            const cuentas = (catResp.data || [])
                .filter(c => (c.tipo || '').includes('Cuentas'))
                .filter(c => c.branch_id === branchId || c.branch_id === null)
            setCuentasCategories(cuentas)

            // Pre-populate inputs con abs(value) de los movements de cada caja.
            // Cajas sin movement en la operación → input vacío.
            const initial = {}
            filtered.forEach(m => {
                if ((m.tipo || '').includes('Cuentas')) {
                    initial[m.movcategories_id] = String(Math.abs(parseFloat(m.unidades)))
                }
            })
            setInputs(initial)

            await axios.get(`https://api.bluelytics.com.ar/v2/latest`)
                .then(r => setDolar(r.data.blue.value_sell))
                .catch(err => console.error(err))
        }
        fetchStates()
    // eslint-disable-next-line
    }, []);

    // Análisis: caso (cobro/extracción), P&L primario, líneas P&L preservadas.
    const analysis = useMemo(() => {
        const cajaMov = operationMovements.find(m => (m.tipo || '').includes('Cuentas'))
        if (!cajaMov) return null
        const sign = parseFloat(cajaMov.unidades) >= 0 ? 1 : -1
        const caso = sign > 0 ? 'cobro' : 'extraccion'
        const otherSideName = sign > 0 ? selectMovname.egreso : selectMovname.ingreso
        const primaryPnL = operationMovements.find(m =>
            !((m.tipo || '').includes('Cuentas')) && m.categories === otherSideName
        )
        const others = operationMovements.filter(m =>
            !((m.tipo || '').includes('Cuentas')) && m !== primaryPnL
        )
        return { sign, caso, primaryPnL, others }
    }, [operationMovements, selectMovname.egreso, selectMovname.ingreso])

    const handleInputChange = (catId, value) => {
        setInputs(prev => ({ ...prev, [catId]: value }))
    }

    // Live preview del lado P&L: se recalcula en cada render según inputs.
    // Misma lógica que se aplica al submit, expuesta visualmente para que el
    // user vea el balance antes de guardar.
    const previewPnL = useMemo(() => {
        if (!analysis) return null
        let netPesos = 0
        cuentasCategories.forEach(cat => {
            const v = parseFloat(inputs[cat.idmovcategories])
            if (Number.isNaN(v) || v === 0) return
            netPesos += Math.abs(v) * (cat.es_dolar === 1 ? dolar : 1)
        })
        if (!analysis.primaryPnL) return null
        const sign = analysis.sign
        const pnlIsDolar = analysis.primaryPnL.es_dolar === 1
        const pnlAmountPesos = -sign * netPesos
        const pnlValue = pnlIsDolar ? pnlAmountPesos / dolar : pnlAmountPesos
        return { value: pnlValue, isDolar: pnlIsDolar, name: analysis.primaryPnL.categories }
    }, [analysis, cuentasCategories, inputs, dolar])

    async function handleSubmit(event) {
        event.preventDefault();
        if (!isNotLoading) return
        if (!analysis) {
            return alert('No se puede editar: la operación no tiene un movement de caja identificable.')
        }

        setIsNotLoading(false)
        try {
            const sign = analysis.sign
            const newMovements = []
            let netPesos = 0  // suma de cajas convertida a pesos

            cuentasCategories.forEach(cat => {
                const raw = inputs[cat.idmovcategories]
                const value = parseFloat(raw)
                if (Number.isNaN(value) || value === 0) return  // omitir vacíos / 0
                const signedValue = sign * Math.abs(value)
                newMovements.push([cat.idmovcategories, signedValue, movnameId, branchId])
                netPesos += Math.abs(value) * (cat.es_dolar === 1 ? dolar : 1)
            })

            if (newMovements.length === 0) {
                setIsNotLoading(true)
                return alert('Insertar al menos un valor en alguna caja.')
            }

            // Primary P&L: balance opuesto al lado caja, en moneda del P&L.
            if (analysis.primaryPnL) {
                const pnlIsDolar = analysis.primaryPnL.es_dolar === 1
                const pnlAmountPesos = -sign * netPesos
                const pnlValue = pnlIsDolar ? pnlAmountPesos / dolar : pnlAmountPesos
                newMovements.push([
                    analysis.primaryPnL.movcategories_id,
                    pnlValue,
                    movnameId,
                    branchId,
                ])
            }

            // Otras líneas P&L (CMV/Repuestos en ventas) — preservadas.
            analysis.others.forEach(m => {
                newMovements.push([
                    m.movcategories_id,
                    parseFloat(m.unidades),
                    movnameId,
                    branchId,
                ])
            })

            const resp = await axios.put(`${SERVER}/movements/${movnameId}`, {
                arrayInsert: newMovements,
                montoTotal: netPesos,
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
            <div className='bg-white my-2 py-8 px-2 max-w-4xl mx-auto'>
                <h1 className="text-center text-5xl">Editar operación</h1>
                <div className="p-4 max-w-3xl mx-auto">
                    <div className='bg-blue-50 border border-blue-200 rounded p-3 mb-4 text-sm'>
                        <p><b>Operación:</b> {selectMovname.operacion}</p>
                        <p><b>Fecha:</b> {selectMovname.fecha}</p>
                        <p><b>Tipo detectado:</b> {casoLabel}</p>
                        <p className='text-xs text-gray-600 mt-1'>
                            Solo se editan las cajas. El lado P&L ({analysis?.primaryPnL?.categories || '—'}) se balancea automáticamente.
                            {analysis?.others?.length > 0 && ' Otras líneas (' + analysis.others.map(m => m.categories).join(', ') + ') se preservan.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mb-4">
                        <div className='bg-blue-100 mb-1 p-2'>
                            <label className="block text-gray-700 font-bold mb-2 border-b-2 text-center">Cajas</label>
                            <div className='flex flex-wrap'>
                                {cuentasCategories.map((category) => (
                                    <div className='w-1/3 px-1' key={category.idmovcategories}>
                                        <label className="block text-gray-700 font-bold mb-2" htmlFor={`caja-${category.idmovcategories}`}>
                                            {category.categories}{category.es_dolar === 1 ? ' (USD)' : ''}:
                                        </label>
                                        <input
                                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                            type="number"
                                            step="1"
                                            min="0"
                                            id={`caja-${category.idmovcategories}`}
                                            value={inputs[category.idmovcategories] ?? ''}
                                            onChange={(e) => handleInputChange(category.idmovcategories, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Preview live del lado P&L: se recalcula al cambiar
                            cualquier caja arriba. Read-only — el valor real
                            se commite al hacer click en Actualizar. */}
                        {previewPnL && (
                            <div className='bg-yellow-50 border border-yellow-300 mb-1 p-2'>
                                <label className="block text-gray-700 font-bold mb-2 border-b-2 text-center">
                                    Lado P&L (auto-balanceado)
                                </label>
                                <div className='flex flex-wrap'>
                                    <div className='w-1/3 px-1'>
                                        <label className="block text-gray-700 font-bold mb-2">
                                            {previewPnL.name}{previewPnL.isDolar ? ' (USD)' : ''}:
                                        </label>
                                        <input
                                            className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight bg-gray-100 cursor-not-allowed"
                                            type="text"
                                            readOnly
                                            value={previewPnL.value.toFixed(2)}
                                        />
                                    </div>
                                </div>
                                <p className='text-xs text-gray-600 mt-1'>
                                    Este valor se actualiza automáticamente al cambiar las cajas y se guarda al hacer click en Actualizar.
                                </p>
                            </div>
                        )}
                        <div className='flex gap-2 mt-4'>
                            <button type='submit' className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                Actualizar
                            </button>
                            <button
                                type='button'
                                className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
                                onClick={() => navigate('/librocontable')}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default EditarOperaciones
