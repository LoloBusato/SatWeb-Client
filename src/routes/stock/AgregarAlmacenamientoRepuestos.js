import React from "react";
import MainNavBar from "../orders/MainNavBar";
import AgregarActualizarNombres from "./controladores/AgregarActualizarNombres";

function AgregarAlmacenamientoRepuestos() {

  return (
    <div className='bg-gray-300 min-h-screen pb-2'>
        <MainNavBar />
        <AgregarActualizarNombres urlAgregarFront='home' urlActualizarFront='actualizarAlmacenamientosRepuestos' urlServidor='almacenamientosRepuestos' indiceColumnaDB='almacenamientos_repuestos_id' nombreColumnaDB='almacenamiento_repuestos' variableServidor='almacenamientoRepuestos' textoTitulo='Agregar Almacenamiento de Repuestos' placeholderInput='128GB / 512GB' mostrarTabla={true} actualizar={false} />
    </div>
  );
}

export default AgregarAlmacenamientoRepuestos