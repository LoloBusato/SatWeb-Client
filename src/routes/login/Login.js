import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SERVER from '../server'
import LogoTDI from '../../images/TDILogo.png'

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    // Aquí es donde enviarías la información de inicio de sesión al servidor
    if (username !== "" && password !== "" ){
      try {
        const response = await axios.post(`${SERVER}/users/login`, {
          username,
          password,
        });
        if (response.status === 200){
          localStorage.setItem("userId", response.data[0].idusers)
          localStorage.setItem("username", response.data[0].username)
          localStorage.setItem("branchId", response.data[0].branch_id)
          localStorage.setItem("permisos", response.data[0].permisos)
          localStorage.setItem("grupoId", response.data[0].grupos_id)
          localStorage.setItem("grupo", response.data[0].grupo)
          navigate('/home')
        }
      } catch (error) {
        alert(error.response.data);
      }
    }
  }

  return (
    <div className=" bg-gray-200 h-screen flex-col flex items-center">
      <div className="w-4/12 px-1 mt-10"> 
        <div className="flex flex-col items-center">
          <div className="w-4/12">
            <img src={LogoTDI} alt="Logo TDI"></img>
          </div>
          <p className="text-xl text-yellow-500 font-semibold">
            Plataforma de Gestión de Servicio Técnico
          </p>
          <p className="text-gray-600 text-center">
            Diseñada para simplificar y optimizar todos los aspectos de tu negocio
          </p>
        </div>
      </div>
      <div className="w-4/12 px-1">
        <form onSubmit={handleSubmit} className="w-full mt-4 bg-white p-2 rounded-lg">
          <div className="mb-4">
            <label htmlFor="username" className="block font-medium text-sm mb-2">Usuario:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="border-gray-400 border-2 py-2 px-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block font-medium text-sm mb-2">Contraseña:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-2 border-gray-400 py-2 px-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
