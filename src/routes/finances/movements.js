import React from 'react'
import { useNavigate } from 'react-router-dom'
import MainNavBar from '../orders/MainNavBar';

function Movements() {
    
    const navigate = useNavigate();
    return (
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className='bg-white my-2 py-8 px-2 max-w-7xl mx-auto'>
                <h1 className="text-center text-5xl">Gastos</h1>
                <div className='flex flex-wrap mt-10'>
                    {/* Otros */}
                    <div className="w-1/2 mb-10 flex justify-center">
                        <button
                            className="bg-blue-500 text-2xl hover:bg-blue-700 text-white font-bold py-4 px-8 rounded"
                            onClick={() => navigate('/movesothers')}>
                            OTROS
                        </button>
                    </div>
                    {/* Ventas */}
                    <div className="w-1/2 mb-10 flex justify-center">
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded text-2xl"
                            onClick={() => navigate('/movessells')}>
                            VENTA DISPOSITIVOS
                        </button>
                    </div>
                    {/* Sucursales */}
                    <div className="w-1/2 mb-10 flex justify-center">
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded text-2xl"
                            onClick={() => navigate('/movesbranches')}>
                            COBRO SUCURSAL
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Movements