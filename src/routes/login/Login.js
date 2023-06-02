import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  function handleUsernameChange(event) {
    setUsername(event.target.value);
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    // Aquí es donde enviarías la información de inicio de sesión al servidor
    if (username !== "" && password !== "" ){
      try {
        const response = await axios.post('http://localhost:3001/users/login', {
          username,
          password,
        });
        if (response.status === 200){
          localStorage.setItem("userId", response.data[0].idusers)
          localStorage.setItem("username", response.data[0].username)
          navigate('/home')
        }
      } catch (error) {
        alert(error.response.data);
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm mx-auto">
    <div className="mb-4">
      <label htmlFor="username" className="block font-medium text-sm mb-2">Usuario:</label>
      <input
        type="text"
        id="username"
        value={username}
        onChange={handleUsernameChange}
        className="border border-gray-400 py-2 px-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
    <div className="mb-4">
      <label htmlFor="password" className="block font-medium text-sm mb-2">Contraseña:</label>
      <input
        type="password"
        id="password"
        value={password}
        onChange={handlePasswordChange}
        className="border border-gray-400 py-2 px-3 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
    <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
      Iniciar sesión
    </button>
  </form>
  );
}

export default Login;
