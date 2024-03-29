import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from "react-router-dom";

const MainNavBar = () => {
    const navigate = useNavigate();
    const [expandedConfig, setExpandedConfig] = useState(false);
    const [expandedModif, setExpandedModif] = useState(false);
    const [expandedStock, setExpandedStock] = useState(false);
    const [expandedRegistro, setExpandedRegistro] = useState(false);

    const [menuOpen, setMenuOpen] = useState(false);

    const permisos = JSON.stringify(localStorage.getItem("permisos"))

    const handleMouseEnter = (type) => {
        if (type === "config") {
            setExpandedConfig(true);
        } else if (type === "modif") {
            setExpandedModif(true)
        } else if (type === "stock") {
            setExpandedStock(true)
        } else if (type === "registro") {
            setExpandedRegistro(true)
        }
    };

    const handleMouseLeave = (type) => {
        if (type === "config") {
            setExpandedConfig(false);
        } else if (type === "modif") {
            setExpandedModif(false)
        } else if (type === "stock") {
            setExpandedStock(false)
        } else if (type === "registro") {
            setExpandedRegistro(false)
        }
    }; 

    return (
        <nav className={`bg-gray-700 ${menuOpen ?  'h-screen' : ''}`} >
            {/* Menu para dispositivos de tamanio sm y superior */}
            <ul className="hidden justify-between items-center md:flex" >
                <div className='flex w-5/6 justify-around text-center'>
                    <Link to="/home" className="text-white font-bold text-lg hover:text-gray-300 border-r-2 bg-gray-800 px-4 w-full" ><li>Home</li></Link>
                    <Link to="/repair" className="text-white font-bold text-lg hover:text-gray-300 px-4 border-r-2 w-full" ><li>Reparaciones</li></Link>
                    {permisos.includes("ManipularOrdenes") && (
                        <li className="relative text-white font-bold text-lg hover:text-gray-300 px-4 border-r-2 w-full"
                            onMouseEnter={() => handleMouseEnter("modif")}
                            onMouseLeave={() => handleMouseLeave("modif")}
                        >
                            Modificaciones
                            <ul className={`w-full z-10 absolute bg-gray-700 text-white left-0 ${expandedModif ? 'block' : 'hidden'}`}>
                                <Link to='/clients'><li className='border-t'>Clientes</li></Link>
                                <Link to='/devices'><li className='border-t'>Equipos</li></Link>
                                <Link to='/brand'><li className='border-t'>Marcas</li></Link>
                                <Link to='/type'><li className='border-t'>Tipos</li></Link>
                            </ul>
                        </li>
                    )}
                    <li className="relative text-white font-bold text-lg hover:text-gray-300 px-4 border-r-2 w-full"
                        onMouseEnter={() => handleMouseEnter("stock")}
                        onMouseLeave={() => handleMouseLeave("stock")}
                    >
                        Stock 
                        <ul className={`w-full z-10 absolute bg-gray-700 text-white left-0 ${expandedStock ? 'block' : 'hidden'}`}>
                            <Link to='/stockCount'><li className='border-t'>Ver Stock</li></Link>
                            {permisos.includes("Stock") && (
                                <>
                                    <Link to='/stock'><li className='border-t'>Agregar Stock</li></Link>
                                    <Link to='/items'><li className='border-t'>Productos</li></Link>
                                    <Link to='/supplier'><li className='border-t'>Proveedores</li></Link>
                                </>
                            )}
                        </ul>
                    </li>
                    {permisos.includes("ManipularOrdenes") && (
                        <li className="relative text-white font-bold text-lg hover:text-gray-300 px-4 border-r-2 w-full"
                            onMouseEnter={() => handleMouseEnter("registro")}
                            onMouseLeave={() => handleMouseLeave("registro")}
                        >
                            Registros 
                            <ul className={`w-full z-10 absolute bg-gray-700 text-white left-0 ${expandedRegistro ? 'block' : 'hidden'}`}>
                                <Link to='/librocontable'><li className='border-t'>Libro Contable</li></Link>
                                <Link to='/resumen'><li className='border-t'>Resumen financiero</li></Link>
                                <Link to='/operaciones'><li className='border-t'>Operaciones completadas</li></Link>
                            </ul>
                        </li>
                    )}
                    <Link to="/movements" className="text-white font-bold text-lg hover:text-gray-300 px-4 border-r-2 w-full" ><li>Gastos</li></Link>
                    {permisos.includes("Administrador") && (
                        <li className="relative text-white font-bold text-lg hover:text-gray-300 px-4 border-r-2 w-full"
                            onMouseEnter={() => handleMouseEnter("config")}
                            onMouseLeave={() => handleMouseLeave("config")}
                        >
                            Configuracion 
                            <ul className={`w-full z-10 absolute bg-gray-700 text-white left-0 ${expandedConfig ? 'block' : 'hidden'}`}>
                                <Link to='/createUser'><li className='border-t'>Usuarios</li></Link>
                                <Link to='/createGroups'><li className='border-t'>Grupos de usuarios</li></Link>
                                <Link to='/branches'><li className='border-t'>Sucursales</li></Link>
                            </ul>
                        </li>
                    )}
                </div>
                <li className="font-bold text-lg hover:text-gray-300" >
                    <button className="bg-white text-black font-medium my-1 px-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    onClick={() => {
                        localStorage.clear()
                        navigate('/login')
                    }}
                    >
                        Salir
                    </button>
                </li>
            </ul>
            {/* Menu para dispositivos de tamanio inferior a sm */}
            <div className={`md:hidden flex flex-col justify-center`}>
                {/* Botón para desplegar el menú en pantallas pequeñas */}
                <button
                    className="block px-4 py-2 text-white focus:outline-none"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    Menú
                </button>
                {/* Menú desplegable en pantallas pequeñas */}
                {menuOpen && (
                    <div className="mt-2">
                        <ul className="flex flex-col items-center w-full" >
                            <div className='flex flex-col text-center w-full'>
                                <Link to="/home" className="text-white font-bold text-lg hover:text-gray-300 bg-gray-800 px-4 w-full" ><li>Home</li></Link>
                                <Link to="/repair" className="text-white font-bold text-lg hover:text-gray-300 px-4 w-full" ><li>Reparaciones</li></Link>
                                {permisos.includes("ManipularOrdenes") && (
                                    <li className="text-white font-bold text-lg hover:text-gray-300 px-4 w-full"
                                        onClick={() => setExpandedModif(!expandedModif)}
                                    >
                                        Modificaciones
                                        <ul className={`w-full bg-gray-700 text-white left-0 ${expandedModif ? 'block' : 'hidden'}`}>
                                            <Link to='/clients'><li className='border-t'>Clientes</li></Link>
                                            <Link to='/devices'><li className='border-t'>Equipos</li></Link>
                                            <Link to='/brand'><li className='border-t'>Marcas</li></Link>
                                            <Link to='/type'><li className='border-t'>Tipos</li></Link>
                                        </ul>
                                    </li>
                                )}
                                <li className="text-white font-bold text-lg hover:text-gray-300 px-4 w-full"
                                    onClick={() => setExpandedStock(!expandedStock)}
                                >
                                    Stock 
                                    <ul className={`w-full bg-gray-700 text-white left-0 ${expandedStock ? 'block' : 'hidden'}`}>
                                        <Link to='/stockCount'><li className='border-t'>Ver Stock</li></Link>
                                        {permisos.includes("Stock") && (
                                            <>
                                                <Link to='/stock'><li className='border-t'>Agregar Stock</li></Link>
                                                <Link to='/items'><li className='border-t'>Productos</li></Link>
                                                <Link to='/supplier'><li className='border-t'>Proveedores</li></Link>
                                            </>
                                        )}
                                    </ul>
                                </li>
                                {permisos.includes("ManipularOrdenes") && (
                                    <li className="text-white font-bold text-lg hover:text-gray-300 px-4 w-full"
                                        onClick={() => setExpandedRegistro(!expandedRegistro)}
                                    >
                                        Registros 
                                        <ul className={`w-full bg-gray-700 text-white left-0 ${expandedRegistro ? 'block' : 'hidden'}`}>
                                            <Link to='/librocontable'><li className='border-t'>Libro Contable</li></Link>
                                            <Link to='/resumen'><li className='border-t'>Resumen financiero</li></Link>
                                            <Link to='/operaciones'><li className='border-t'>Operaciones completadas</li></Link>
                                        </ul>
                                    </li>
                                )}
                                <Link to="/movements" className="text-white font-bold text-lg hover:text-gray-300 px-4 w-full" ><li>Gastos</li></Link>
                                {permisos.includes("Administrador") && (
                                    <li className="text-white font-bold text-lg hover:text-gray-300 px-4 w-full"
                                        onClick={() => setExpandedConfig(!expandedConfig)}
                                    >
                                        Configuracion 
                                        <ul className={`w-full bg-gray-700 text-white left-0 ${expandedConfig ? 'block' : 'hidden'}`}>
                                            <Link to='/createUser'><li className='border-t'>Usuarios</li></Link>
                                            <Link to='/createGroups'><li className='border-t'>Grupos de usuarios</li></Link>
                                            <Link to='/branches'><li className='border-t'>Sucursales</li></Link>
                                        </ul>
                                    </li>
                                )}
                            </div>
                            <li className="font-bold text-lg mt-2" >
                                <button className="bg-white text-black font-medium my-1 px-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                                onClick={() => {
                                    localStorage.clear()
                                    navigate('/login')
                                }}
                                >
                                    Salir
                                </button>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default MainNavBar;