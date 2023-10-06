import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

function AgregarCategorias() {

    const [listaCategorias, setListaCategorias] = useState([]);
    const [es_dolar, setEsDolar] = useState(false)

    const navigate = useNavigate();
    const branchId = JSON.parse(localStorage.getItem('branchId'))

    useEffect(() => {
        axios.get(`${SERVER}/movcategories`)
          .then(response => {
            setListaCategorias(response.data);
          })
          .catch(error => {
            console.error(error);
          });
      }, []);

    async function handleSubmit(event) {
        event.preventDefault();

        const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        const defaultValueArray = [];
        checkboxes.forEach(element => {
            defaultValueArray.push(element.defaultValue);
        });
        const tipo = defaultValueArray.join(', ')
        if (tipo === ''){
            return alert('Seleccionar al menos un tipo de categoria')
        }

        let esDolar;
        if (es_dolar) {
            esDolar = 1;
        } else {
            esDolar = 0;
        }

        const categories = document.getElementById('name').value 
        if (categories === '') {
            return alert('Escribir un nombre para la categoria')
        }

        const valuesCategorias = {
            categories,
            tipo,
            es_dolar: esDolar,
            branch_id: branchId
        }

        try {        
            const response = await axios.post(`${SERVER}/categories`, valuesCategorias);
            if(response.status === 200){
                alert("Proveedor agregado")
                window.location.reload();
            }
        } catch (error) {
            alert(error)
        }
    }

  return (
    <div className="bg-gray-300 min-h-screen pb-2">
      <MainNavBar />
      <div className='bg-white m-2 py-8 px-2'>
        <h1 className="text-2xl font-bold text-center">Agregar categoria</h1>
        <div className="p-4 max-w-xl mx-auto">
            <form onSubmit={handleSubmit} className="mb-4">
                <div className="mb-2 flex flex-col">
                    <div className='w-full mb-2'>
                        <label className="block text-gray-700 font-bold mb-2" htmlFor="name">Nombre: *</label>
                        <input 
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                            type="text" 
                            id="name" 
                            placeholder="PcKing / Banco Santander"
                        />
                    </div>
                    <p className="block text-gray-700 font-bold mb-2">Tipos: *</p>
                    <div className='flex flex-wrap'>
                        <div className='w-1/2'>
                            <input type="checkbox" id="checkbox1" name="checkbox1" value='Dinero, Cuentas' className='mr-1' />
                            <label htmlFor="checkbox1">Cuenta</label>
                        </div>
                        <div className='w-1/2'>
                            <input type="checkbox" id="checkbox2" name="checkbox2" value='Otros, Repuestos, Proveedores' className='mr-1' />
                            <label htmlFor="checkbox2">Proveedor</label>
                        </div>
                        <div className='w-1/2'>
                            <input type="checkbox" id="checkbox3" name="checkbox3" value='Otros' className='mr-1' />
                            <label htmlFor="checkbox3">Otros</label>
                        </div>
                    </div>
                    <div className='mt-2'>
                        <p className='text-lg font-bold'>Es una cuenta en dolares?</p>
                        <div className='w-1/2'>
                            <input type="checkbox" id="checkbox4" name="checkbox4" value='' onChange={() => setEsDolar(!es_dolar)} className='mr-1' />
                            <label htmlFor="checkbox4">Es dolar?</label>
                        </div>
                    </div>
                </div>
                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                    Guardar
                </button>
                <button 
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    onClick={() => { navigate(`/device`) }} >
                        Volver
                </button>
            </form>
        </div>
        <div>
          <div className="flex justify-center mb-10">
            {/* Tabla para dispositivos de tamanio sm y mayor */}
            <table className="table-auto hidden md:block">
                <thead>
                    <tr>
                    <th className="px-4 py-2">Nombre</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2">Dolar</th>
                    </tr>
                </thead>
                <tbody>
                {listaCategorias.map((categoria) => (
                    <tr key={categoria.idmovcategories}>
                        <td className="border px-4 py-2 font-bold">{categoria.categories}</td>
                        <td className="border px-4 py-2">{categoria.tipo}</td>
                        <td className="border px-4 py-2">{categoria.es_dolar}</td>
                        <td>
                            <button className="bg-green-500 hover:bg-green-700 border px-4 py-2 color"
                            onClick={() => { navigate(`/actualizarCategorias/${categoria.idmovcategories}`) }} >
                              Editar
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            {/* Tabla colapsable para dispositivos pequeños */}
            <div className="md:hidden">
                {listaCategorias.map(categoria => (
                <details key={categoria.idmovcategories} className="border mb-1 rounded">
                    <summary className="px-4 py-2 cursor-pointer outline-none">
                        {categoria.categories}
                    </summary>
                    <div className=" bg-gray-100">
                        <div className='flex flex-col'>
                        <p className="border px-4 py-2 font-bold">Nombre: {categoria.categories}</p>
                        <p className="border px-4 py-2">Tipos: {categoria.tipo}</p>
                        <p className="border px-4 py-2">Dolar: {categoria.es_dolar}</p>
                        <button className="bg-green-500 hover:bg-green-700 border px-4 py-2 color"
                        onClick={() => { navigate(`/actualizarCategorias/${categoria.idmovcategories}`) }} >
                            Editar
                        </button>
                        </div>
                    </div>
                </details>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgregarCategorias;