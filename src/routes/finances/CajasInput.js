import React from 'react'

// Layout fijo del grid 4x2 — primera fila ARS, segunda USD.
// IMPORTANTE: los nombres tienen que matchear EXACTO los de movcategories
// (en DB es 'Dolares' sin tilde, pero 'Dólares Banco' sí lleva tilde).
const ORDER_PAGO = [
    'Pesos', 'Banco', 'MercadoPago', 'MonotributoKat',
    'Dolares', 'Dólares Banco', 'Cripto', 'Encargado',
]

// Vuelto se reduce a 3 cajas — el operador llena la caja DESDE la que
// da el vuelto. Cada monto se debita de su propia cuenta en el handler.
const ORDER_VUELTO = ['Pesos', 'Dolares', 'Encargado']
function baseName(c) {
    return (c.categories ?? '').replace(/Vuelto$/, '')
}

function sortPago(arr) {
    const idx = (c) => {
        const i = ORDER_PAGO.indexOf(c.categories)
        return i === -1 ? 999 : i
    }
    return [...(arr ?? [])].sort((a, b) => idx(a) - idx(b))
}

// cuentasVueltoCategories vienen con suffix "Vuelto" en categories —
// filtramos a las 3 declaradas en ORDER_VUELTO y las ordenamos por la
// posición en esa lista.
function filterAndSortVuelto(arr) {
    return [...(arr ?? [])]
        .filter(c => ORDER_VUELTO.includes(baseName(c)))
        .sort((a, b) => ORDER_VUELTO.indexOf(baseName(a)) - ORDER_VUELTO.indexOf(baseName(b)))
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
    const vueltoBoxes = filterAndSortVuelto(cuentasVueltoCategories)

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
                    <label className='flex items-center gap-2 mb-2 cursor-pointer select-none'>
                        <input
                            type='checkbox'
                            id='dar-vuelto'
                            className='h-4 w-4'
                            checked={!!showVuelto}
                            onChange={(e) => setShowVuelto(e.target.checked)}
                        />
                        <span className='text-gray-700 font-bold'>¿Dar vuelto?</span>
                    </label>
                    {showVuelto && (
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
                            {vueltoBoxes.map(c => (
                                <CajaBox key={`v-${c.idmovcategories}`}
                                    category={c}
                                    label={baseName(c)} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    )
}

export default CajasInput
