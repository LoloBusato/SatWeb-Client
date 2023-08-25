import React from "react";
import MainNavBar from "../orders/MainNavBar";
import AgregarActualizarNombres from "./controladores/AgregarActualizarNombres";

function ActualizarColor() {

  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <AgregarActualizarNombres urlAgregarFront='agregarColores' urlActualizarFront='actualizarColores' urlServidor='colores' indiceColumnaDB='colores_id' nombreColumnaDB='color' variableServidor='color' textoTitulo='Actualizar colores' placeholderInput='Rojo / SpaceGray' mostrarTabla={false} actualizar={true} />
    </div>
  );
}

export default ActualizarColor;
