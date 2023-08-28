import React from "react";
import MainNavBar from "../orders/MainNavBar";
import AgregarActualizarNombres from "./controladores/AgregarActualizarNombres";

function AgregarCalidadRepuestos() {

  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <AgregarActualizarNombres urlAgregarFront='home' urlActualizarFront='actualizarCalidadesRepuestos' urlServidor='calidadesRepuestos' indiceColumnaDB='calidades_repuestos_id' nombreColumnaDB='calidad_repuestos' variableServidor='calidadRepuestos' textoTitulo='Agregar Calidades de Repuestos' placeholderInput='Generica / Original' mostrarTabla={true} actualizar={false} />
    </div>
  );
}

export default AgregarCalidadRepuestos