import React, { useRef } from 'react';
import ReactToPrint from 'react-to-print';
import { useLocation, useNavigate } from "react-router-dom";
import QRCode from "qrcode.react";


function PrintCode() {

    const navigate = useNavigate()
    const location = useLocation();
    const cod = location.pathname.split("/")[2];
    const ref = useRef()

    return (
        <div className='flex justify-center py-4'>
            <div >
                <div ref={ref} className='max-w-fit px-1'>
                    <div>
                        <QRCode size={64} level={"H"} value={cod} className='m-1' />
                    </div>
                    <div className='text-center pb-3 transform rotate-90 fixed top-5 left-10 right-0'>
                        <p className='text-xs'>{cod.slice(0,5)}</p>
                        <p className='text-xs'>{cod.slice(5)}</p>
                    </div>
                </div>
                <div className='py-4 flex gap-5'>
                    <ReactToPrint
                        trigger={() => <button>Print</button>}
                        content={() => ref.current}
                    />
                    <button 
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        onClick={() => { navigate(`/stockCount`) }} >
                            Volver
                    </button>
                </div>
            </div>
        </div>
    );
}
export default PrintCode;