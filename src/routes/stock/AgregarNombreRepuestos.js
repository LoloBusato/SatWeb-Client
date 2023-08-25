import React from "react";
import MainNavBar from "../orders/MainNavBar";
import AgregarActualizarNombres from "./controladores/AgregarActualizarNombres";

function AgregarNombreRepuestos() {

  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <AgregarActualizarNombres urlAgregarFront='nombresRepuestos' urlActualizarFront='actualizarNombresRepuestos' urlServidor='nombresRepuestos' indiceColumnaDB='nombres_repuestos_id' nombreColumnaDB='nombre_repuestos' variableServidor='nombreRepuestos' textoTitulo='Agregar Nombre de Repuesto' placeholderInput='Bateria / Pantalla' mostrarTabla={true} actualizar={false} />
    </div>
  );
}

export default AgregarNombreRepuestos