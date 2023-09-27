import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

const TableComponent = ({ data }) => {
    return (
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
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

function Garantia() {
    const [listaPorProveedor, setListaPorProveedor] = useState([])

    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            await axios.get(`${SERVER}/garantia`)
              .then(response => {
                const listaGarantia = response.data

                const listaPorProveedor = listaGarantia.reduce((result, item) => {
                  const { nombre } = item;
                  if (!result[nombre]) {
                    result[nombre] = [];
                  }
                  result[nombre].push(item);
                  return result;
                }, {});
                setListaPorProveedor(listaPorProveedor)
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
          {Object.keys(listaPorProveedor).map((proveedor_id) => (
          <div key={proveedor_id} className='bg-white rounded px-2 py-2 text-center'>
            <h2 className='py-2 text-xl'>Proveedor: <b>{proveedor_id}</b></h2>
            <TableComponent data={listaPorProveedor[proveedor_id]} />
            <button
            className='bg-green-400 px-2 py-1 rounded mt-2'
            onClick={() => {navigate(`/modificarGarantia/${proveedor_id}`)}}
            >
                Modificar
            </button>
          </div>
          ))}
        </div>
    </div>
  );
}

export default Garantia;