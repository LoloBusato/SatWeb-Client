import React, { useState, useEffect, useRef } from 'react'

// PhoneInput — entrada estructurada para teléfono argentino en 3 campos:
// "+" fijo, país (default 54), código de área, número. El + se renderiza
// como prefijo no editable; los 3 inputs aceptan sólo dígitos.
//
// Restricciones:
//   - país          : máx 3 dígitos (default "54", editable)
//   - código_area   : máx 4 dígitos
//   - número        : máx (10 − codigo_area.length) dígitos
//   - área + número ≤ 10
//
// Acepta value completo (formato "+PPAAANNNNNNN" o similar). En cada
// cambio dispara onChange("+" + pais + codArea + numero). Para integrar
// con forms uncontrolled (formData.get('phone')), renderiza un hidden
// input con name si se pasa la prop.
//
// Heurística de split inicial cuando recibe un value pre-existente: si
// empieza con "+54" + 10 dígitos → 11/15/otro decide el corte (11 → área
// 11, resto 8; 15 elimina ya en el script de normalize, así que llega como
// área 9 + 8). Si no, deja todo en "número" — el usuario edita.

function splitFromFull(full) {
    if (!full || typeof full !== 'string') {
        return { pais: '54', area: '', numero: '' }
    }
    const cleaned = full.trim().replace(/[\s\-().]/g, '')
    const withoutPlus = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned
    if (!/^[0-9]+$/.test(withoutPlus)) {
        return { pais: '54', area: '', numero: '' }
    }
    if (withoutPlus.startsWith('54')) {
        const rest = withoutPlus.slice(2)
        // +549XXX...: 9 es prefijo móvil, área típica de 2-4 dígitos.
        // Heurística: si total = 11 (móvil con prefijo 9), área = 2; si
        // total = 10 (sin 9), área = 2; si 12+ probablemente capital.
        if (rest.startsWith('11')) return { pais: '54', area: '11', numero: rest.slice(2) }
        if (rest.startsWith('9')) return { pais: '54', area: rest.slice(1, 3), numero: rest.slice(3) }
        if (rest.length === 10) return { pais: '54', area: rest.slice(0, 2), numero: rest.slice(2) }
        return { pais: '54', area: rest.slice(0, 4), numero: rest.slice(4) }
    }
    return { pais: withoutPlus.slice(0, 3) || '54', area: '', numero: '' }
}

function onlyDigits(s) {
    return (s || '').replace(/[^0-9]/g, '')
}

function PhoneInput({ value, onChange, placeholder, name, className = '' }) {
    const [pais, setPais] = useState('54')
    const [area, setArea] = useState('')
    const [numero, setNumero] = useState('')
    const lastEmittedRef = useRef('')

    // Sync desde prop cuando cambia y no fue emitido por nosotros mismos.
    useEffect(() => {
        if (value === lastEmittedRef.current) return
        const s = splitFromFull(value)
        setPais(s.pais)
        setArea(s.area)
        setNumero(s.numero)
        lastEmittedRef.current = value ?? ''
    }, [value])

    function emit(p, a, n) {
        const full = '+' + p + a + n
        lastEmittedRef.current = full
        if (onChange) onChange(full)
    }

    function handlePais(e) {
        const v = onlyDigits(e.target.value).slice(0, 3)
        setPais(v)
        emit(v, area, numero)
    }
    function handleArea(e) {
        const v = onlyDigits(e.target.value).slice(0, 4)
        // Si esto rompe el límite 10 con el número actual, recortamos número.
        const maxNumeroLen = Math.max(0, 10 - v.length)
        const truncatedNumero = numero.slice(0, maxNumeroLen)
        setArea(v)
        setNumero(truncatedNumero)
        emit(pais, v, truncatedNumero)
    }
    function handleNumero(e) {
        const maxNumeroLen = Math.max(0, 10 - area.length)
        const v = onlyDigits(e.target.value).slice(0, maxNumeroLen)
        setNumero(v)
        emit(pais, area, v)
    }

    const fullValue = '+' + pais + area + numero
    // h-10 fuerza la misma altura que el resto de los inputs de los forms
    // (que usan py-2 + leading-tight = ~38px → 40px con h-10). box-border
    // mete el borde dentro de h-10 para evitar desbordes.
    const inputBase = 'shadow appearance-none border rounded h-10 box-border px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'

    return (
        <div className={`flex items-stretch gap-1 ${className}`}>
            <span className='flex items-center font-bold text-gray-700 px-1 select-none h-10'>+</span>
            <input
                className={`${inputBase} w-14 text-center`}
                type='text'
                inputMode='numeric'
                value={pais}
                onChange={handlePais}
                placeholder='54'
                aria-label='País'
            />
            <input
                className={`${inputBase} w-16 text-center`}
                type='text'
                inputMode='numeric'
                value={area}
                onChange={handleArea}
                placeholder={placeholder ? '' : 'área'}
                aria-label='Código de área'
            />
            <input
                className={`${inputBase} flex-1 min-w-0`}
                type='text'
                inputMode='numeric'
                value={numero}
                onChange={handleNumero}
                placeholder={placeholder ?? 'número'}
                aria-label='Número'
            />
            {name && <input type='hidden' name={name} value={fullValue} />}
        </div>
    )
}

export default PhoneInput
