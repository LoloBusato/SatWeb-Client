import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

const TableComponent = ({ data }) => {
    return (
      <table>
        <thead>
          <tr className='border'>
            <th className="py-2 px-4">ID</th>
            <th className="py-2 px-4">Producto</th>
            <th className="py-2 px-4">Cantidad</th>
          </tr>
        </thead>
        <tbody className='bg-blue-200'>
          {data.map((item) => (
            <tr key={item.stock_id}>
              <td className='border px-4 py-2'>{item.stock_id}</td>
              <td className='border px-4 py-2'>{item.repuesto}</td>
              <td className='border px-4 py-2'>{item.cantidad_restante}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

function Garantia() {
    const [stock, setStock] = useState([]);

    const navigate = useNavigate();

    const location = useLocation();
    const garantiaId = location.pathname.split("/")[3];

    useEffect(() => {
        const fetchData = async () => {
            await axios.get(`${SERVER}/stock/${garantiaId}`)
              .then(response => {
                const repuestosSucursal = response.data
                setStock(repuestosSucursal);
            })
              .catch(error => {
                console.error(error);
            });
        }
        fetchData()
        // eslint-disable-next-line
    }, []);

    const groupedTables = stock.filter((item) => item.cantidad_restante > 0).reduce((result, item) => {
        const { nombre } = item;
        if (!result[nombre]) {
          result[nombre] = [];
        }
        result[nombre].push(item);
        return result;
      }, {});
    
  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <div className='flex flex-wrap gap-10 justify-center mt-2'>
            {Object.keys(groupedTables).map((proveedor_id) => (
            <div key={proveedor_id} className='bg-white rounded px-2 py-2 text-center'>
                <h2 className='py-2 text-xl'>Proveedor: <b>{proveedor_id}</b></h2>
                <TableComponent data={groupedTables[proveedor_id]} />
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