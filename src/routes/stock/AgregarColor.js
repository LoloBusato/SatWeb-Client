import React from "react";
import MainNavBar from "../orders/MainNavBar";
import AgregarActualizarNombres from "./controladores/AgregarActualizarNombres";

function AgregarColor() {

  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <AgregarActualizarNombres urlAgregarFront='agregarColores' urlActualizarFront='actualizarColores' urlServidor='colores' indiceColumnaDB='colores_id' nombreColumnaDB='color' variableServidor='color' textoTitulo='Agregar colores' placeholderInput='Rojo / SpaceGray' mostrarTabla={true} actualizar={false} />
    </div>
  );
}

export default AgregarColor;
