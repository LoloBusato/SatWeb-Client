import React, { useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';

function UpdateSupplier() {

    const navigate = useNavigate();
    const location = useLocation();
    const supplierId = location.pathname.split("/")[2];

    useEffect(() => {
        axios.get('http://localhost:3001/supplier')
          .then(response => {
            for (let i = 0; i < response.data.length; i++) {
                if (response.data[i].idproveedores === Number(supplierId)) {
                    document.getElementById("proveedor_nombre").value = response.data[i].nombre;
                    document.getElementById("telefono").value = response.data[i].telefono;
                    document.getElementById("direccion").value = response.data[i].direccion;
                }
            }
          })
          .catch(error => {
            console.error(error);
            // Aquí puedes mostrar un mensaje de error al usuario si la solicitud falla
          });
        // eslint-disable-next-line
      }, []);

    async function handleSubmit(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const supplierDate = {
        nombre: formData.get('proveedor_nombre'),
        telefono: Number(formData.get('telefono')),
        direccion: formData.get('direccion'),
        };
        try {        
            const response = await axios.put(`http://localhost:3001/supplier/${supplierId}`, supplierDate);
            if(response.status === 200){
                alert("Proveedor modificado")
                navigate("/supplier");
            }
        } catch (error) {
            alert(error)
        }
    }

  return (
    <div className="bg-gray-300 min-h-screen pb-2">
      <MainNavBar />
      <div className='bg-white m-2 py-8 px-2'>
        <h1 className="text-center text-5xl">Editar proveedor</h1>
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
            <div className='flex items-center justify-between'>
                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded" >
                    Guardar
                </button>
                <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                onClick={() => { navigate(`/supplier`) }} >
                    Volver
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default UpdateSupplier;