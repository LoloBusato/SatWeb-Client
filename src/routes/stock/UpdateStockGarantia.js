import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

const TableComponent = ({ data }) => {
    return (
        <div className='bg-white rounded px-2 py-2 text-center'>
            {data.length > 0 && (
            <h2 className='py-2 text-xl'>Proveedor: <b>{data[0].nombre}</b></h2>
            )}
            <table>
                <thead>
                <tr className='border'>
                    <th className="py-2 px-4">ID</th>
                    <th className="py-2 px-4">Producto</th>
                    <th className="py-2 px-4">Estado</th>
                    <th className="py-2 px-4">Precio</th>
                    <th className="py-2 px-4">Fecha Compra</th>
                </tr>
                </thead>
                <tbody>
                {data.map((item) => (
                    <tr key={item.idgarantia} style={{backgroundColor: item.estado_color}}>
                        <td className='border px-4 py-2'>{item.stock_id}</td>
                        <td className='border px-4 py-2'>{item.repuesto}</td>
                        <td className='border px-4 py-2'>{item.estado_nombre}</td>
                        <td className='border px-4 py-2'>${item.precio_compra}</td>
                        <td className='border px-4 py-2'>{item.fecha_compra.split('T')[0]}</td>
                        <td className='border'>
                            <button
                            className='bg-red-500 border px-4 py-2'

                            >
                                Sin enviar
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
  };

function ActualizarGarantia() {
    const [listaGarantia, setListaGarantia] = useState([])
    const [listaSeleccionados, setListaSeleccionados] = useState([])

    const navigate = useNavigate();
    const location = useLocation();
    const proveedor_id =location.pathname.split("/")[3]

    useEffect(() => {
        const fetchData = async () => {
            await axios.get(`${SERVER}/garantia`)
              .then(response => {
                const listaGarantia = response.data.filter((item) => item.idproveedores === parseInt(proveedor_id))
                setListaGarantia(listaGarantia)
            })
              .catch(error => {
                console.error(error);
            });
        }
        fetchData()
        // eslint-disable-next-line
    }, []);
    
  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <button
        onClick={() => navigate('/agregarEstadoGarantia')}
        >
          Agregar estado garantia
        </button>
        <div className='flex flex-wrap gap-10 justify-center mt-2'>
            <TableComponent data={listaGarantia} />
            <TableComponent data={listaSeleccionados} />
        </div>
    </div>
  );
}

export default ActualizarGarantia;