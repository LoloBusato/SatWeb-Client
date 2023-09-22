import React, { useRef } from 'react';
import ReactToPrint from 'react-to-print';
import { useLocation, useNavigate } from "react-router-dom";
import QRCode from "qrcode.react";

function PrintCode() {

    const navigate = useNavigate()
    const location = useLocation();
    const cod = location.pathname.split("/")[2].replace(/%20/g, ' ');
    const ref = useRef()

    return (
        <div className='flex flex-col items-center mt-5'>
            <div ref={ref} className='w-24 flex flex-col max-h-40'>
                <div className='text-center justify-center'>
                    <p className='text-sm'>{cod}</p>
                </div>
                <div className='flex justify-center'>
                    <QRCode size={40} value={cod} />
                </div>
            </div>
            <div className='py-4 flex gap-5'>      
                <button 
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    onClick={() => { navigate(`/stockCount`) }} >
                        Volver
                </button>
                <ReactToPrint
                    trigger={() => <button>Print</button>}
                    content={() => ref.current}
                />
            </div>
        </div>
    );
}
export default PrintCode;