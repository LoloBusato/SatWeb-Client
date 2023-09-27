import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import './index.css';

import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Navigate} from 'react-router-dom';

import Login from './routes/login/Login';

import Suppliers from './routes/stock/Suppliers';
import Items from './routes/stock/Items';
import Stock from './routes/stock/Stock';
import Garantia from './routes/stock/StockGarantia';
import UpdateStock from './routes/stock/UpdateStock';
import UpdateItem from './routes/stock/UpdateItem';
import UpdateSupplier from './routes/stock/UpdateSupplier';
import StockCount from './routes/stock/StockCount';
import PrintCode from './routes/stock/PrintCode';
import DistributeStock from './routes/stock/DistributeStock';
import EditDistributeStock from './routes/stock/EditDistributeStock';
import EnviarStock from './routes/stock/EnviarStock';
import AgregarNombreRepuestos from './routes/stock/AgregarNombreRepuestos';
import ActualizarNombreRepuestos from './routes/stock/ActualizarNombreRepuestos';

import Device from './routes/devices/Devices';
import Brands from './routes/devices/Brand';
import Types from './routes/devices/Types';
import UpdateBrand from './routes/devices/UpdateBrand';
import UpdateDevice from './routes/devices/UpdateDevice';
import UpdateTypes from './routes/devices/UpdateTypes';

import Client from './routes/clients/client';
import UpdateClient from './routes/clients/updateClient';

import DevolverDinero from './routes/orders/DevolverDinero';
import Orders from './routes/orders/orders';
import OrderStates from './routes/orders/States';
import UpdateStates from './routes/orders/UpdateStates';
import Messages from './routes/orders/Messages';
import UpdateOrders from './routes/orders/updateOrders';
import Repairs from './routes/orders/Repairs';
import ReasignOrder from './routes/orders/ReasignOrder';
import PrintOrder from './routes/orders/PrintOrder';
import Home from './routes/orders/Home';

import Branches from './routes/branches/branch';
import CreateUser from './routes/login/CreateUser';
import UpdateBranch from './routes/branches/updateBranch';
import UpdateUser from './routes/login/UpdateUser';
import CreateGroups from './routes/login/CreateGroups';

import RouteController from './routes/login/RouteController';

import LibroContable from './routes/statistics/LibroContable';
import Movements from './routes/finances/movements';
import MovesSells from './routes/finances/movesSells';
import MovesBranches from './routes/finances/movesBranches';
import MovesOthers from './routes/finances/movesOthers';
import MovesRepairs from './routes/finances/movesRepairs';
import Resumen from './routes/statistics/Resumen';
import MovesCapital from './routes/finances/movesCapital';
import Operaciones from './routes/statistics/Operaciones';
import EditarOperaciones from './routes/statistics/EditarOperaciones';
import ActualizarColor from './routes/stock/ActualizarColor';
import AgregarColor from './routes/stock/AgregarColor';
import ActualizarCalidadRepuestos from './routes/stock/ActualizarCalidadRepuestos';
import AgregarCalidadRepuestos from './routes/stock/AgregarCalidadRepuestos';

import ActualizarAlmacenamientoRepuestos from './routes/stock/ActualizarAlmacenamientoRepuestos';
import AgregarAlmacenamientoRepuestos from './routes/stock/AgregarAlmacenamientoRepuestos';
import AgregarEstadosGarantia from './routes/stock/AgregarEstadosGarantia';
import ActualizarEstadosGarantia from './routes/stock/ActualizarEstadosGarantia';
import ActualizarGarantia from './routes/stock/UpdateStockGarantia';

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route element={<RouteController />}>
        {/* Rutas para agregar dispositivos */}
        <Route element={<Device />} path='/devices' />
        <Route element={<UpdateDevice />} path='/updateDevice/:id' />

        <Route element={<Brands />} path='/brand' />
        <Route element={<UpdateBrand />} path='/updateBrand/:id' />

        <Route element={<Types />} path='/type' />
        <Route element={<UpdateTypes />} path='/updateType/:id' />


        {/* Rutas para agregar stock */}
        <Route element={<Stock />} path='/stock' />
        <Route element={<UpdateStock />} path='/updateStock/:id' />

        <Route element={<Garantia />} path='/stock/garantia' />
        <Route element={<ActualizarGarantia />} path='/stock/actualizarGarantia/:id' />

        <Route element={<AgregarEstadosGarantia />} path='/agregarEstadoGarantia' />
        <Route element={<ActualizarEstadosGarantia />} path='/actualizarEstadoGarantia/:id' />

        <Route element={<DistributeStock />} path='/distributeStock/:id' />
        <Route element={<EditDistributeStock />} path='/editdistributestock/:id' />
        <Route element={<EnviarStock />} path='/enviarstock/' />

        <Route element={<Suppliers />} path='/supplier' />
        <Route element={<UpdateSupplier />} path='/updateSupplier/:id' />

        <Route element={<Items />} path='/items' />
        <Route element={<UpdateItem />} path='/updateItem/:id' />

        <Route element={<AgregarNombreRepuestos />} path='/nombresRepuestos' />
        <Route element={<ActualizarNombreRepuestos />} path='/actualizarNombresRepuestos/:id' />
        
        <Route element={<AgregarCalidadRepuestos />} path='/calidadesRepuestos' />
        <Route element={<ActualizarCalidadRepuestos />} path='/actualizarCalidadesRepuestos/:id' />

        <Route element={<AgregarAlmacenamientoRepuestos />} path='/almacenamientosRepuestos' />
        <Route element={<ActualizarAlmacenamientoRepuestos />} path='/actualizarAlmacenamientosRepuestos/:id' />

        <Route element={<AgregarColor />} path='/agregarColores' />
        <Route element={<ActualizarColor />} path='/actualizarColores/:id' />

        <Route element={<StockCount />} path='/stockCount' />
        <Route element={<PrintCode />} path='/printCode/:id' />

        {/* Rutas para agregar usuarios */}
        <Route path= '/createUser' element= {<CreateUser /> }/>
        <Route path= '/createGroups' element= {<CreateGroups /> }/>
        <Route path= '/updateUser/:id' element= {<UpdateUser /> }/>  

        {/* Rutas para agregar clientes */}
        <Route path= '/clients' element= {<Client /> }/> 
        <Route path= '/updateClient/:id' element= {<UpdateClient />} /> 

        {/* Rutas para agregar ordenes */}
        <Route element={<Home />} path='/home' />
        <Route element={<PrintOrder />} path='/printOrder/:id' />
        <Route element={<ReasignOrder />} path='/reasignOrder/:id' />
        <Route element={<Repairs />} path='/repair' />
        <Route path= '/orders' element= {<Orders /> }/> 
        <Route path= '/updateOrder/:id' element={<UpdateOrders /> } /> 
        <Route path= '/messages/:id' element= {<Messages /> } /> 

        {/* Rutas para agregar estados */}
        <Route path= '/orderStates' element= {<OrderStates /> } /> 
        <Route path= '/updateStates/:id' element= {<UpdateStates /> } /> 

        {/* Rutas para agregar sucursales */}
        <Route path= '/branches' element= {<Branches /> } /> 
        <Route path= '/updateBranches/:id' element= {<UpdateBranch /> } /> 
        
        {/* Rutas para estadisticas */}
        <Route path= '/librocontable' element= {<LibroContable /> } /> 
        <Route path= '/resumen' element= {<Resumen /> } /> 
        <Route path= '/operaciones' element= {<Operaciones /> } /> 
        <Route path= '/editarOperaciones/:id' element= {<EditarOperaciones /> } /> 

        {/* Rutas para gastos */}
        <Route path= '/movements' element= {<Movements /> } />
        <Route path= '/movessells' element= {<MovesSells /> } /> 
        <Route path= '/movesbranches' element= {<MovesBranches /> } /> 
        <Route path= '/movesothers' element= {<MovesOthers /> } /> 
        <Route path= '/movesrepairs/:id' element= {<MovesRepairs /> } /> 
        <Route path= '/movescapital' element= {<MovesCapital /> } />
        <Route path= '/devolverDinero/:id' element= {<DevolverDinero /> } />  

      </Route>
      <Route path='/login' element={<Login />} />
      <Route path='/*' element={<Navigate to='/home' />} />
    </>
  )
)

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <RouterProvider router={router} />
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
