import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from "react-router-dom";
import MainNavBar from '../orders/MainNavBar';
import SERVER from '../server'

function DistributeStock() {
    const [cantidad, setCantidad] = useState(0)

    const [stock, setStock] = useState([]);
    const [branches, setBranches] = useState([]);
    
    const location = useLocation();
    const stockId = location.pathname.split("/")[2];

    useEffect(() => {
        const fetchData = async () => {
            await axios.get(`${SERVER}/stock/distribute/${stockId}`)
              .then(response => {
                setStock(response.data);
                const cantidad = response.data.reduce((acum, valor) => acum + valor.cantidad_restante, 0)
                setCantidad(cantidad)
            })
              .catch(error => {
                console.error(error);
            });
            await axios.get(`${SERVER}/branches`)
                .then(response => {
                    setBranches(response.data);
                })
                .catch(error => {
                    console.error(error);
                });
        }
        fetchData()
        // eslint-disable-next-line
    }, []);

    
    async function handleSubmit(event) {
        event.preventDefault();
        try {            
            const arrSucursales = []
            let cantidadFinal = 0
            branches.forEach((branch) => {
                if (defaultInputValues[branch.branch] !== inputValues[branch.branch]) {
                    arrSucursales.push([stock[0].idstock, branch.idbranches, (inputValues[branch.branch] - defaultInputValues[branch.branch])])
                }
                cantidadFinal += inputValues[branch.branch]
            })
            if (cantidad !== cantidadFinal) {
                window.location.reload()
                return alert(`La cantidad distribuida no coincide con la inicial. Suma esperada: ${cantidad}`)
            } else if (arrSucursales.length === 0) {
                return alert("Realizar cambios en la distribucion")
            } else {
                // StockBranchId, StockId, BranchId, CantidadTotal, CantidadRestante
                await axios.put(`${SERVER}/stock/distribute/${stockId}`, {
                    arraySucursales: arrSucursales
                })
                    .then(response => {
                        window.location.reload()
                        return alert('Stock Modificado');
                    })
                    .catch(error => {
                        console.error(error);
                    });
            } 
        } catch (error) {
            alert(error.response.data);
        } 
    }

    const [inputValues, setInputValues] = useState({});
    const [defaultInputValues, setDefaultInputValues] = useState({});

    const handleInputChange = (e, branchId) => {
        const value = e.target.value;
        setInputValues((prevState) => ({
        ...prevState,
        [branchId]: parseInt(value),
        }));
    };

    return (     
        <div className='bg-gray-300 min-h-screen pb-2'>
            <MainNavBar />
            <div className='bg-white m-2 py-8 px-2'>
                <h1 className="text-2xl font-bold text-center">Enviar repuestos a otra sucursal/garantia</h1>
                <h1 className="text-2xl font-bold text-center my-5">{}</h1>
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col md:flex-row justify-center my-5">
                        {branches.map((branch) => {
                            const stockBranch = stock.filter((stock) => stock.branch_id === branch.idbranches)
                            let cantidad_restante = 0
                            if (stockBranch.length > 0) {
                                cantidad_restante = stockBranch[0].cantidad_restante
                            }                       
                            if (!defaultInputValues.hasOwnProperty(branch.branch)) {
                                setInputValues((prevState) => ({
                                    ...prevState,
                                    [branch.branch]: cantidad_restante, // Valor predeterminado en cero
                                }));
                                setDefaultInputValues((prevState) => ({
                                    ...prevState,
                                    [branch.branch]: cantidad_restante, // Valor predeterminado en cero
                                }));
                            }
                            return (
                                <div key={branch.idbranches} className='flex flex-col'>
                                    <label htmlFor={branch.branch}>{branch.branch}</label>
                                    <input max={cantidad} 
                                    type='number' 
                                    id={branch.branch} 
                                    defaultValue={cantidad_restante}
                                    onChange={(e) => handleInputChange(e, branch.branch)}
                                    className="mt-1 appearance-none w-full px-3 py-2 rounded-md border border-gray-400 shadow-sm leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                            )
                        })}
                    </div>
                    <div className='flex items-center justify-center px-10'>
                        <button type="submit" className='bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded'>
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DistributeStock;