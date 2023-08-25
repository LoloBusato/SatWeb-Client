import React from "react";
import MainNavBar from "../orders/MainNavBar";
import AgregarActualizarNombres from "./controladores/AgregarActualizarNombres";

function ActualizarCalidadRepuestos() {

  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <AgregarActualizarNombres urlAgregarFront='calidadesRepuestos' urlActualizarFront='actualizarCalidadesRepuestos' urlServidor='calidadesRepuestos' indiceColumnaDB='calidades_repuestos_id' nombreColumnaDB='calidad_repuestos' variableServidor='calidadRepuestos' textoTitulo='Actualizar Calidades de Repuestos' placeholderInput='Generica / Original' mostrarTabla={false} actualizar={true} />
    </div>
  );
}

export default ActualizarCalidadRepuestos;