import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

function Suppliers() {

    const [proveedores, setProveedores] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        axios.get(`${SERVER}/supplier`)
          .then(response => {
            setProveedores(response.data);
          })
          .catch(error => {
            console.error(error);
            // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
          });
      }, []);

    async function handleSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const supplierDate = {
        nombre: formData.get('proveedor_nombre'),
        telefono: formData.get('telefono'),
        direccion: formData.get('direccion'),
        };
        console.log(supplierDate)
        try {        
            const response = await axios.post(`${SERVER}/supplier`, supplierDate);
            if(response.status === 200){
                console.log("Proveedor agregado")
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
        <h1 className="text-2xl font-bold text-center">Agregar proveedor</h1>
        <div>
          <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <div className="flex flex-col mb-4">
              <label htmlFor="proveedor_nombre" className="text-lg mb-2">
                Nombre del proveedor: *
              </label>
              <input
                type="text"
                name="proveedor_nombre"
                id="proveedor_nombre"
                className="border border-gray-400 p-2"
              />
            </div>
            <div className="flex flex-col mb-4">
              <label htmlFor="telefono" className="text-lg mb-2">
                Número de teléfono: *
              </label>
              <input
                type="number"
                name="telefono"
                id="telefono"
                className="border border-gray-400 p-2"
              />
            </div>
            <div className="flex flex-col mb-4">
              <label htmlFor="direccion" className="text-lg mb-2">
                Dirección: (opcional)
              </label>
              <input
                type="text"
                name="direccion"
                id="direccion"
                className="border border-gray-400 p-2"
              />
            </div>
            <div className='flex items-center justify-center'>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded" >
                Guardar
                </button>
            </div>
          </form>
          <div className="flex justify-center mb-10">
            <table className="table-auto">
                <thead>
                    <tr>
                    <th className="px-4 py-2">Nombre</th>
                    <th className="px-4 py-2">Numero de Telefono</th>
                    <th className="px-4 py-2">Direccion</th>
                    </tr>
                </thead>
                <tbody>
                {proveedores.map((proveedor) => (
                    <tr key={proveedor.idproveedores}>
                        <td className="border px-4 py-2 font-bold" value={proveedor.nombre}>{proveedor.nombre}</td>
                        <td className="border px-4 py-2" value={proveedor.telefono}>{proveedor.telefono}</td>
                        <td className="border px-4 py-2" value={proveedor.direccion}>{proveedor.direccion}</td>
                        <td>
                            <button className="bg-green-500 hover:bg-green-700 border px-4 py-2 color"
                            onClick={() => { navigate(`/updateSupplier/${proveedor.idproveedores}`) }} >
                              Editar
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Suppliers;