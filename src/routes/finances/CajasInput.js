import React from 'react'

// Layout fijo del grid 4x2 — primera fila ARS, segunda USD:
//   Pesos | Banco | MercadoPago | MonotributoKat
//   Dólares | Dólares Banco | Cripto | Encargado
// Cualquier caja no listada cae al final del orden.
const ORDER_PAGO = [
    'Pesos', 'Banco', 'MercadoPago', 'MonotributoKat',
    'Dólares', 'Dólares Banco', 'Cripto', 'Encargado',
]

function sortPago(arr) {
    const idx = (c) => {
        const i = ORDER_PAGO.indexOf(c.categories)
        return i === -1 ? 999 : i
    }
    return [...(arr ?? [])].sort((a, b) => idx(a) - idx(b))
}

// cuentasVueltoCategories vienen con suffix "Vuelto" en categories — los
// ordenamos por el nombre base (sin el suffix) y los renderizamos sin él.
function sortVuelto(arr) {
    const idx = (c) => {
        const base = (c.categories ?? '').replace(/Vuelto$/, '')
        const i = ORDER_PAGO.indexOf(base)
        return i === -1 ? 999 : i
    }
    return [...(arr ?? [])].sort((a, b) => idx(a) - idx(b))
}

function CajaBox({ category, label }) {
    const esUSD = category.es_dolar === 1
    return (
        <div className='bg-white shadow rounded-lg p-3 border border-gray-200'>
            <label className='block text-gray-700 font-bold text-sm mb-1' htmlFor={category.categories}>
                {label}
                {esUSD && <span className='text-xs text-blue-700 font-semibold ml-1'>(USD)</span>}
            </label>
            <input
                className='shadow appearance-none border rounded w-full h-10 box-border px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                type='number' step='1' min='0'
                id={category.categories}
                name={category.categories}
                defaultValue=''
            />
        </div>
    )
}

// CajasInput — bloque reutilizable de cobro. Renderiza las 8 cajas en
// grid 4x2 y opcionalmente el selector + cajas de vuelto. Los inputs
// usan id = category.categories (e.g. "Pesos" / "PesosVuelto") así
// los formularios consumen via document.getElementById(name).value.
//
// Props:
//   - cuentasCategories         : [{idmovcategories, categories, es_dolar, ...}]
//   - cuentasVueltoCategories   : idem pero con suffix "Vuelto" en categories
//   - payCategories             : (legacy, no usado — el dropdown de vuelto
//                                  ahora incluye TODAS las cajas, no sólo Pagar)
//   - showVuelto / setShowVuelto: control del bloque vuelto
//   - dolar                     : reservado para uso futuro (display de saldo)
//   - withVuelto = true         : false para deshabilitar el bloque vuelto
//                                  (ej. PreVentaCobro no tiene vuelto)
function CajasInput({
    cuentasCategories,
    cuentasVueltoCategories,
    payCategories: _payCategories,  // eslint-disable-line no-unused-vars
    showVuelto,
    setShowVuelto,
    dolar: _dolar,                  // eslint-disable-line no-unused-vars
    withVuelto = true,
}) {
    const sortedPago = sortPago(cuentasCategories)
    const sortedVuelto = sortVuelto(cuentasVueltoCategories)
    // El selector incluye TODAS las cajas — antes filtraba por "Pagar" y
    // sólo aparecían Caja/Encargado. Ahora se puede vueltear a cualquier
    // caja en cualquier moneda.
    const dropdownOptions = sortPago(cuentasCategories)

    return (
        <>
            <div className='mb-1 p-2'>
                <label className='block text-gray-700 font-bold mb-2'>Pago *</label>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                    {sortedPago.map(c => (
                        <CajaBox key={c.idmovcategories}
                            category={c}
                            label={c.categories} />
                    ))}
                </div>
            </div>

            {withVuelto && (
                <div className='mb-1 p-2'>
                    <div className='flex items-end gap-2'>
                        <div className='w-3/12 min-w-[12rem]'>
                            <label className='block text-gray-700 font-bold mb-2' htmlFor='cuenta'>Cuenta vuelto:</label>
                            <select
                                onChange={(e) => setShowVuelto(e.target.value !== '')}
                                name='cuenta' id='cuenta' defaultValue=''
                                className='w-full shadow appearance-none border rounded h-10 box-border px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'>
                                <option value='' disabled>Cuenta</option>
                                {dropdownOptions.map(c => (
                                    <option key={c.idmovcategories} value={c.idmovcategories}>
                                        {c.categories}{c.es_dolar === 1 ? ' (USD)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    {showVuelto && (
                        <div className='mt-2'>
                            <label className='block text-gray-700 font-bold mb-2'>Vuelto *</label>
                            <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                                {sortedVuelto.map(c => (
                                    <CajaBox key={`v-${c.idmovcategories}`}
                                        category={c}
                                        label={(c.categories ?? '').replace(/Vuelto$/, '')} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </>
    )
}

export default CajasInput
