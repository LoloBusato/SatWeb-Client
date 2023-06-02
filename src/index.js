import React from 'react';
import ReactDOM from 'react-dom/client';
import reportWebVitals from './reportWebVitals';
import './index.css';

import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider, Navigate} from 'react-router-dom';

import Login from './routes/login/Login';

import Home from './routes/orders/Home';
import Device from './routes/devices/Devices';
import CreateUser from './routes/login/CreateUser';
import Brands from './routes/devices/Brand';
import Types from './routes/devices/Types';

import Stock from './routes/stock/Stock';
import Suppliers from './routes/stock/Suppliers';
import Items from './routes/stock/Items';
import UpdateStock from './routes/stock/UpdateStock';
import UpdateItem from './routes/stock/UpdateItem';
import UpdateSupplier from './routes/stock/UpdateSupplier';
import StockCount from './routes/stock/StockCount';
import PrintCode from './routes/stock/PrintCode';
import UpdateBrand from './routes/devices/UpdateBrand';
import UpdateDevice from './routes/devices/UpdateDevice';
import UpdateTypes from './routes/devices/UpdateTypes';
import Client from './routes/clients/client';
import UpdateClient from './routes/clients/updateClient';
import Orders from './routes/orders/orders';
import OrderStates from './routes/orders/States';
import UpdateStates from './routes/orders/UpdateStates';
import Branches from './routes/branches/branch';
import UpdateBranch from './routes/branches/updateBranch';
import Messages from './routes/orders/Messages';
import UpdateOrders from './routes/orders/updateOrders';
import RouteController from './routes/login/RouteController';
import Repairs from './routes/orders/Repairs';
import ReasignOrder from './routes/orders/ReasignOrder';
import LibroContable from './routes/statistics/LibroContable';
import UpdateUser from './routes/login/UpdateUser';
import PrintOrder from './routes/orders/PrintOrder';
import Movements from './routes/finances/movements';
import MovesSells from './routes/finances/movesSells';
import MovesBranches from './routes/finances/movesBranches';
import MovesOthers from './routes/finances/movesOthers';
import MovesRepairs from './routes/finances/movesRepairs';
import MovCategories from './routes/finances/movcategories';
import Resumen from './routes/statistics/Resumen';
import CreateGroups from './routes/login/CreateGroups';

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

        <Route element={<Suppliers />} path='/supplier' />
        <Route element={<UpdateSupplier />} path='/updateSupplier/:id' />

        <Route element={<Items />} path='/items' />
        <Route element={<UpdateItem />} path='/updateItem/:id' />

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

        {/* Rutas para gastos */}
        <Route path= '/movements' element= {<Movements /> } />
        <Route path= '/movescategories' element= {<MovCategories /> } />
        <Route path= '/movessells' element= {<MovesSells /> } /> 
        <Route path= '/movesbranches' element= {<MovesBranches /> } /> 
        <Route path= '/movesothers' element= {<MovesOthers /> } /> 
        <Route path= '/movesrepairs/:id' element= {<MovesRepairs /> } /> 

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
