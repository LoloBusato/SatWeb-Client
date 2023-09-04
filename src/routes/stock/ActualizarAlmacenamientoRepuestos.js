import React from "react";
import MainNavBar from "../orders/MainNavBar";
import AgregarActualizarNombres from "./controladores/AgregarActualizarNombres";

function ActualizarAlmacenamientoRepuestos() {

  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <AgregarActualizarNombres urlAgregarFront='almacenamientosRepuestos' urlActualizarFront='actualizarAlmacenamientosRepuestos' urlServidor='AlmacenamientosRepuestos' indiceColumnaDB='almacenamientos_repuestos_id' nombreColumnaDB='almacenamiento_repuestos' variableServidor='almacenamientoRepuestos' textoTitulo='Actualizar Almacenamientos de Repuestos' placeholderInput='128GB / 512GB' mostrarTabla={false} actualizar={true} />
    </div>
  );
}

export default ActualizarAlmacenamientoRepuestos;