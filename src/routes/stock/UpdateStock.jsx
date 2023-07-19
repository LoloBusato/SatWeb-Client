import React from 'react';
import { useLocation } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import StockForm from './controladores/StockForm';

function UpdateStock() {
  const location = useLocation();
  const stock_id = location.pathname.split("/")[2];
  const branch_id = JSON.parse(localStorage.getItem("branchId"))

  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
      <MainNavBar />
      <div className='bg-white m-2 py-8 px-2'>
        <h1 className="text-center text-5xl">Modificar stock</h1>
        <div>
          <StockForm stock_id={stock_id} branch_id={branch_id} update_boolean={true} />
        </div>
      </div>
    </div>
  );
}

export default UpdateStock;