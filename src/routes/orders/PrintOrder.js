import React, {useState, useEffect} from 'react'
import axios from 'axios'
import { useLocation } from 'react-router-dom'
import SERVER from '../server'

function PrintOrder() {
    const [order, setOrder] = useState([])

    const location = useLocation();
    const orderId = location.pathname.split("/")[2];

    useEffect(() => {
        const fetchStates = async () => {
            await axios.get(`${SERVER}/orders`)
                .then(response => {
                    for (let i = 0; i < response.data.length; i++) {
                        let orderIdUser = response.data[i].order_id
                        if (orderIdUser === Number(orderId)){
                            setOrder(response.data[i])   
                            console.log(response.data[i])   
                        }
                    }
                })
                .catch(error => {
                    console.error(error)
                })
        }
        fetchStates()
        // eslint-disable-next-line
    }, []);
    const notas = [
        "Los diagnósticos de los equipos pueden borrar total o parcialmente la información almacenada en el equipo. TheDoniPhone, no se responsabiliza por los datos almacenados en el mismo. El cliente exonera a TheDoniPhone de toda responsabilidad respecto de dicha información.",
        "Respecto a los equipos amparados por cobertura de garantía, si el cliente no presenta la orden de trabajo que legitime la validación de la misma, TheDoniPhone recibirá el equipo en forma condicional diagnosticando la eventual falla y verificando que el equipo no presente ninguna de las siguientes situaciones: a)caídas, golpes o ralladuras sobre el cuerpo principal del equipo o su interior. b) rastro evidente de humedad, vapor o agua en el interior del equipo. c) exceso de calor sobre la placa principal del equipo o alguno de sus componentes. La garantía solo cubre arreglos a nivel componente (hardware) sobre el repuesto utilizado por TheDoniPhone, en ningún caso abarca otras partes del dispositivo que NO fueron cambiadas y/o modificadas ni tampoco cubre desperfectos, alteraciones, actualizaciones o errores de ningún tipo a nivel sistema (software). La duración de la garantía es de 90 días corridos a partir del retiro del equipo por parte del cliente.",
        "Los equipos que no fuesen retirados a los 90 días corridos de haber ingresado al establecimiento de TheDoniPhone se consideran abandonados. En ese caso TheDoniPhone adquirirá su dominio quedando facultada para disponer del mismo perdiendo el cliente todo derecho a indemnización o reclamo alguno (código civil, art.2525/2526).",
        "Los equipos para service y reparación junto a todos sus componentes y accesorios se consideran sin funcionamiento total hasta ser diagnosticados por nuestros técnicos. TheDoniPhone no se hace cargo bajo ninguna circunstancia del reclamo del cliente al momento de retirar el equipo con presupuesto no aceptado o sin reparación.",
        "Equipos que ingresen sin carga, o que por su falla no permitan un testeo general al momento del ingreso del mismo, su dueño puede optar por esperar que su equipo cargue lo suficiente para dicho testeo; en caso de que esto no ocurra, pierde cualquier posibilidad de reclamo ante algún desperfecto que el equipo tuviese al momento del ingreso que no sea la falla principal por la cual se deja.",
        "TheDoniPhone no se hace responsable si el código IMEI del equipo queda bloqueado por el ENACOM en el tiempo que permanezca en nuestra empresa.",
        "Todo equipo que se le tenga que realizar trabajo en la placa madre corre el riesgo de que NO vuelva a encender y el cliente acepta esta condición.",
        "Todo equipo mojado podrán presentar fallas progresivas en el transcurso del tiempo, inclusive luego de una reparación. La garantía sólo cubrirá lo presupuestado originalmente.",
        "Una vez ingresado el equipo (iPhone, iPad, Applewatch, iMac y Macbook) y abierto para su diagnostico pierde su sello de fabrica y su condicion de estanco por lo que TheDoniPhone no se responsabiliza por futuros daños de humedad, liquidos o vapor en su interior.",
        "El equipo solo podrá ser retirado en la sucursal en la que fue ingresado."
    ]
    return (
        <div className='min-h-screen'>
            <div className='mx-auto pt-8 max-w-2xl text-sm' >
                <div className='border-b-2 border-black flex'>
                    <div className='w-20'>
                        <img src="/sat-tdi/src/images/tdi_logo.jpg" alt='Logo The Don iPhone' />
                    </div>
                    <div className='text-center px-10'>
                        <h1 className='text-xl'>{order.branch}</h1>
                        <h1 className='text-sm'>{order.info}</h1>
                        <h1 className='text-sm'>{order.contact}</h1>
                    </div>
                </div>
                <div className='mt-2 text-center flex justify-between'>
                    <h1 className='text-3xl border-2 border-black w-1/4'># {order.order_id}</h1>
                    <h1 className='border-2 border-black px-4 h-6'>Fecha: {order.created_at}</h1>
                </div>
                {/* Cliente */}
                <div className='border-2 border-black my-3 pl-5 pb-2'>
                    <div>
                        <h1>Cliente: </h1>
                    </div>
                    <div className=' pl-10'>
                        <div className='flex gap-2'>
                            <h1>Nombre: </h1>
                            <h1>{order.name} {order.surname}</h1>
                        </div>
                        <div className='flex gap-2'>
                            <h1>Telefono: </h1>
                            <h1>{order.phone}</h1>
                        </div>
                        <div className='flex gap-2'>
                            <h1>Instagram: </h1>
                            <h1>{order.instagram}</h1>
                        </div>
                        <div className='flex gap-2'>
                            <h1>E-mail: </h1>
                            <h1>{order.email}</h1>
                        </div> 
                    </div>
                </div>
                {/* Equipo */}
                <div className='border-2 border-black mt-4 pl-5 pb-2'>
                    <div>
                        <h1>Equipo: </h1>
                    </div>
                    <div className='pl-10'>
                        <div className='flex gap-2'>
                            <h1>SN/ IMEI: </h1>
                            <h1>{order.serial}</h1>
                        </div>
                        <div className='flex gap-2'>
                            <h1>Equipo: </h1>
                            <h1>{order.brand} {order.type} {order.model} {order.device_color}</h1>
                        </div>
                        <div className='flex gap-2 pt-3'>
                            <h1>Falla: </h1>
                            <h1>{order.problem}</h1>
                        </div>
                        <div className='flex gap-2 pb-3'>
                            <h1>Contraseña: </h1>
                            <h1>{order.password}</h1>
                        </div> 
                        <div className='flex gap-2'>
                            <h1>Accesorios: </h1>
                            <h1>{order.accesorios}</h1>
                        </div> 
                        <div className='flex gap-2'>
                            <h1>Fecha: </h1>
                            <h1>{order.created_at}</h1>
                        </div> 
                    </div>
                </div>
                
                {/* Notas */}
                <div>
                    <div className='text-xs'>
                        <h1 className='text-sm border-b-2 border-black font-bold'>TERMINOS Y CONDICIONES</h1>
                        <ul className='list-decimal text-justify'>
                            {notas.map((nota) => (
                                <li>{nota}</li>
                            ))}
                        </ul>
                    </div>
                </div>
                {/* Firma */}
                <div className='flex justify-around py-3'>
                    <div className='flex gap-4'>
                        <h1>Firma:</h1>
                        <div className='border-b-2 border-black w-40'></div>
                    </div>
                    <div className='flex gap-4'>
                        <h1>Aclaración:</h1>
                        <div className='border-b-2 border-black w-40'></div>
                    </div>
                    <div className='flex gap-4'>
                        <h1>DNI:</h1>
                        <div className='border-b-2 border-black w-40'></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PrintOrder