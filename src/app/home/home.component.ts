import { Component, HostListener, OnInit} from '@angular/core';
import { TraerCertificadoService } from '../traer-certificado.service';
import { BateriasDistribuidor, QueryAPi} from './dataCliete';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { ViewportScroller } from '@angular/common';
declare var num_empleado: any;
declare var nombre_empleado:any;
declare var local_empleado:any;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
 /* @HostListener("click",["$event.target"]) onClick(e:Event){
    console.log('tocaste ');
    console.log(e);
  }*/


  constructor(public postCertificado: TraerCertificadoService, public alerta: ToastrService,public navegar:Router,private vps: ViewportScroller) { 

  }

  //funcion mueve el scroll dinamicamente cuando carga la pagina, se importo la lib viewportScroler vps
  scroll(id:any) {
    this.vps.scrollToAnchor(id);
  }


 codigo_distribuidor:string = '';
 cantidadBat:string = '';
 codigoDistribu?: number;
 nombreDistribu: string = '';
 mostrar_pantalla_siguiente:boolean = false;

 //codigo de empleado y nombre de empleado se asigna  dinamico, en onInit
 localEmpleado:string = '';
 codigoEmpleado:string = '';
 nombreEmpleado:string = '';

  validaDistribuidor(){
    const reg = new RegExp('^[0-9]+$');
    let soloNumeros = reg.test(this.codigo_distribuidor)

    if(this.codigo_distribuidor.length == 7 && soloNumeros == true ) {
      
           document.querySelector('.loader')?.classList.remove('d-none');
     
                this.postCertificado.postValidaDistrib(this.codigo_distribuidor).subscribe(data =>{
                    console.log(data)
             
                      if(data.length > 0){
                        let codigoDistri = data[0].NUM_CLIENTE;
                        let nombreDistribuidor = data[0].NOMBRE;
                
                          this.cantidadBat = data[0].NUM_BATERIAS;
                          this.codigoDistribu = codigoDistri;
                          this.nombreDistribu = nombreDistribuidor;

                          this.mostrar_pantalla_siguiente = true;

                          this.postCertificado.codigoDistribuidor = this.codigo_distribuidor;
                          
                          this.datosCliente_cedula_nombre(this.codigo_distribuidor)

                          this.fechaUltimoInventario()//llamo la ultima fecha de inventario para llenarla cuando cargue la pagina de toma  seriales
                      }else{
                          document.querySelector('.loader')?.classList.add('opacity-0');
                          setTimeout(() => {
                            document.querySelector('.loader')?.classList.add('d-none');
                            document.querySelector('.loader')?.classList.remove('opacity-0');
                          }, 700);

                        this.codigo_distribuidor = '';
                        this.alerta.warning('Número de distribuidor incorrecto, o este distribuidor no tiene baterías en su stock!', 'Dato no existe o incorrecto!');
                      } 

                },error =>{
                  document.querySelector('.loader')?.classList.add('d-none');
                  this.codigo_distribuidor = '';
                  this.alerta.error('error' +error + 'Inténtelo más tarde!', 'error conexión!');
                  console.log(error)
                });
         
    }else{
      this.alerta.error('El código está incompleto o introdujo alguna letra (este campo sólo permite números)!', 'Dato Incorrecto!');
      this.codigo_distribuidor = '';
    }

    this.getLocation();

  }

  fechaUltimoInv:string = '';//A MOSTRAR en html en tarjeta de distribuidor
async fechaUltimoInventario(){
    try {
     const Query = {
         query: `
         select distinct to_char(fecha_inicio,'dd/mm/yyyy') as fecha_ultimo_inventario ,id_inv 
          from hist_inv_bateria_distribuidor
            where num_cli_distribuidor = ${this.codigo_distribuidor}
            and estado_inv = 'C'
            and id_inv = (select max(id_inv) from hist_inv_bateria_distribuidor)
            and fecha_inicio = (select max(fecha_inicio) from hist_inv_bateria_distribuidor)
                `,
         mode : "0",
         asesor: "",
         local: ""
        }
        
         const opcion = {
             method : "POST",
             body : JSON.stringify(Query),
             headers : {
                 'Content-Type': 'application/json',
                 'Accept' : 'application/json'
             }
         } 

      let res = await fetch("../../api/Soap/Soap2.php",opcion);//produccion
      //let res = await fetch("https://grupoviamar.com/api/Soap/Soap2.php",opcion);//local
      let json = await res.json();
      
      if (res.ok == true) {
        this.fechaUltimoInv = json[0].FECHA_ULTIMO_INVENTARIO;
      }


    } catch (error) {
        console.log(error)
        this.alerta.error('Error de conexion', 'Error!');
    }

}



async datosCliente_cedula_nombre(cod_distribuidor:any) {
  try {
    const Query = {
      query: `
          select c.local, 
                nvl(c.cedula,c.rnc)as cedula_rnc,
                c.num_cla
    from inv_bateria_distribuidor inv, clientes c
       where inv.num_cliente = c.num_cliente
       and inv.num_cla = c.num_cla
       and inv.local = c.local
       and inv.num_cliente = '${cod_distribuidor}'
       and rownum < 2
       `,
      mode: '0',
      asesor: '',
      local: '',
    };

    const opcion = {
      method: 'POST',
      body: JSON.stringify(Query),
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };

    let res = await fetch("../../api/Soap/Soap2.php",opcion);//produccion
    //let res = await fetch("https://grupoviamar.com/api/Soap/Soap2.php",opcion); //local
    let json = await res.json();
    console.log(json)

    if (res.ok == true) {
      this.cedula_rnc = json[0].CEDULA_RNC;
      this.localDistri = json[0].LOCAL;
      this.numCla = json[0].NUM_CLA;

                          document.querySelector('.loader')?.classList.add('opacity-0');
                          setTimeout(() => {
                            document.querySelector('.loader')?.classList.add('d-none');
                            document.querySelector('.loader')?.classList.remove('opacity-0');
                              this.scroll('targetSerial');//enfoco la entrada de seriales
                          }, 700);

    }else{
      document.querySelector('.loader')?.classList.add('d-none');
    }

  } catch (error) {
    console.log(error);
    document.querySelector('.loader')?.classList.add('d-none');
  }
}

cedula_rnc: string = '';
numCla: string = '';
localDistri: string = '';






  tablaInventarioBaterias:any = [];
 
//nota puedo capturar una etiqueta en angulr escribiendo #variable y pasarla por parametros
registrarSerial(serialInput : HTMLInputElement){
      const reg = new RegExp('^[0-9]+$');
      let soloNumeros = reg.test(serialInput.value)

    if(serialInput.value.length == 6 && soloNumeros == true ) {

        let contador = this.tablaInventarioBaterias.length;

        //uso interfaze para guardar cambios
        let baterias: BateriasDistribuidor = {
          id: 0,
          descripcion: ""
        }
        
          baterias.id = contador;
          baterias.descripcion = serialInput.value

          let contadorRepetidos = 0

          for (let i = 0; i < this.tablaInventarioBaterias.length; i++) {
              if(this.tablaInventarioBaterias[i].descripcion == baterias.descripcion){
                contadorRepetidos++
              }
          }

          if(contadorRepetidos == 0){
            this.tablaInventarioBaterias.push(baterias)
            serialInput.value = '';
          }else{
            this.alerta.warning('El número de serial ya se encuentra registrado', 'Serial repetido!');
            serialInput.value = '';
          }
          
    }else{
      this.alerta.error('Serial incompleto o contiene letras', 'Serial incorrecto!');
    }
    
}

//quitar teclado para entrada scanner
  entrada(inputTeclado : HTMLInputElement){
    inputTeclado.readOnly = true;

    setTimeout(() => {
      inputTeclado.readOnly = false;
    }, 100);
  }

  //habilitar teclado
  entrada2(inputTeclado : HTMLInputElement){
    inputTeclado.readOnly = false;
  }



  indexNumSerial: string = '';
  nuevoSerial: string = "";
  botonConfirma:boolean = false;


  serialSeleccionado_soloParaMostrar:string = '';

  editarSerial(numSerial : HTMLElement){
    this.indexNumSerial = numSerial.id;

   //con esto le muestro al usuario en la pantalla el serial que esta a punto de modificar
   this.serialSeleccionado_soloParaMostrar = this.tablaInventarioBaterias[this.indexNumSerial].descripcion 
  }


  confirmaPregunta(){
   document.querySelector(".divNuevoSerialInput")?.classList.remove('d-none')
   document.querySelector(".divNuevoSerialPregunta")?.classList.add('d-none')

   this.botonConfirma = true;
  }


  confirmaEditar(){
    const reg = new RegExp('^[0-9]+$');
    let serialNumeros = reg.test(this.nuevoSerial)

    if(this.nuevoSerial.length == 6 && serialNumeros == true){

      let serialRepetido = false;
      for (let i = 0; i < this.tablaInventarioBaterias.length; i++) {
        if(this.tablaInventarioBaterias[i].descripcion == this.nuevoSerial){
          serialRepetido = true;
          break;
        }  
      }

      if(serialRepetido != true){
        this.tablaInventarioBaterias[this.indexNumSerial].descripcion = this.nuevoSerial
        this.alerta.success('Serial modificado exitosamente', 'Serial Modificado!');
      }else{
        this.alerta.warning('El serial esta repetido y no se puede modificar', 'Serial Repetido!');
      }
      


          //limpio las variables para los ngIf y otras condiciones
          this.indexNumSerial = '';
          this.nuevoSerial = "";
          this.botonConfirma = false;

          //reinicio el modal de modificar.
          document.querySelector(".divNuevoSerialInput")?.classList.add('d-none')
          document.querySelector(".divNuevoSerialPregunta")?.classList.remove('d-none')
    }else{
      this.alerta.error('Serial introducido esta incorrecto o contiene letras', 'No.Serial no permitido!');
    }
  }

  //captura numero a utilizar en fuencion borrarSerial()
  numeroSerialBorrar:string = '';
  confirmaBorrarSerial(numSerialBorrar : HTMLElement){
    this.numeroSerialBorrar = numSerialBorrar.id;

    //con esto le muestro al usuario en la pantalla el serial que esta a punto de modificar
    this.serialSeleccionado_soloParaMostrar = this.tablaInventarioBaterias[this.numeroSerialBorrar].descripcion 
  }

  
  borrarSerial(){
    if(this.numeroSerialBorrar.length > 0){
      this.tablaInventarioBaterias.splice(this.numeroSerialBorrar,1)

      this.alerta.success('Serial borrado exitosamente', 'No.Serial eliminado!');

      //reordeno el index de la tabla
      for (let i = 0; i < this.tablaInventarioBaterias.length; i++) {
        this.tablaInventarioBaterias[i].id = i;
      }
    }else{
      this.alerta.error('No se pudo eliminar el serial seleccionado', 'Error al borrar!');
    }
  }

  maxIdInv:number = 0;
 async maxIdReporteInve(){

      //total de encuestas
      try {
       const Query = {
           query: "select nvl(max(id_inv),0) + 1 as id_inv  from hist_inv_bateria_distribuidor",
           mode : "0",
           asesor: "",
           local: ""
          }
          
           const opcion = {
               method : "POST",
               body : JSON.stringify(Query),
               headers : {
                   'Content-Type': 'application/json',
                   'Accept' : 'application/json'
               }
           } 
  
        let res = await fetch("../../api/Soap/Soap2.php",opcion);//produccion
        //let res = await fetch("https://grupoviamar.com/api/Soap/Soap2.php",opcion);//local
        let json = await res.json();
        
        if (res.ok == true) {
           this.maxIdInv = json[0].ID_INV;
        }

   } catch (error) {
       console.log(error)
       document.querySelector('.loader2')?.classList.add('d-none');
       this.alerta.error('Error de conexion', 'Error!');

   }

  }


result:any = 0; //resultado division
progreso: any = 0; // progreso de la barra de carga
barraProgreso(num:number){
 this.result = 100 / num;
}



  latitude:any = '';
  longitude:any ='';

  getLocation() {
    this.postCertificado.getPosition().then(pos => {
        this.latitude = pos.lat;
        this.longitude = pos.lng;
    });
  }


//contador incrementable que ademas se queda guardado el numero en caso de que se vaya la conexion continuar donde se quedo la insercion
i:number = 0
sendData(){
  this.barraProgreso(this.tablaInventarioBaterias.length)  

    if(this.codigo_distribuidor.length > 0 && this.tablaInventarioBaterias.length > 0 && this.maxIdInv > 0 && this.codigoEmpleado.length > 0 && this.localEmpleado.length > 0 && this.latitude > 0 && this.cedula_rnc.length > 0){
    
      this.postCertificado.guardarReporteGeneral(this.codigo_distribuidor,this.tablaInventarioBaterias[this.i].descripcion,this.maxIdInv,this.codigoEmpleado,this.localEmpleado,this.latitude,this.longitude).subscribe(data =>{
        if(this.i < (this.tablaInventarioBaterias.length-1)){
            this.progreso += this.result;
            this.i++;
              this.sendData();
        }else if(data != null && data > 0 && this.maxIdInv > 0){//valido que todo este listo para pasar a reporte
            this.navegar.navigateByUrl('/reporte');   
        }else{
            document.querySelector('.loader2')?.classList.add('opacity-0');
          setTimeout(() => {
            document.querySelector('.loader2')?.classList.add('d-none');
            document.querySelector('.loader2')?.classList.remove('opacity-0');
          }, 700);

          this.alerta.warning('Parece que hubo un error, intentelo mas tarde', 'Algo anda mal!');
        }
      },err=>{
        this.alerta.error('Error de conexion', 'Error!');
      });

    }else{
      this.alerta.warning('Error Back End :D, favor llamar a informatica!', 'Algo anda mal!');
    }

}


mostrarBotonCerrarBarraCarga: boolean = false;
 async guardarReporte(){   
    document.querySelector('.loader2')?.classList.remove('d-none');
    
    await this.maxIdReporteInve();
    
    //envio variables globales al servicio para usar en el componente de reporte
    this.postCertificado.tablaReporteFinal = this.tablaInventarioBaterias;
   
    this.postCertificado.localDistribuidor = this.localDistri;
    // this.postCertificado.codigoDistribuidor = this.codigo_distribuidor; yo mando ese valor en la funcion valida distribuidor
    this.postCertificado.nombreDistribuidor = this.nombreDistribu;
    this.postCertificado.cedulaRncDistribuidor = this.cedula_rnc;
    this.postCertificado.numClaDistribuidor = this.numCla;

    this.postCertificado.bateriasStock = this.cantidadBat;

    this.postCertificado.codigoEmpleado = this.codigoEmpleado;
    this.postCertificado.nombreEmpleado = this.nombreEmpleado;
    this.postCertificado.numInvActual = this.maxIdInv;


    //valida que haya algun tipo de error en la insercion para continuar donde se quedo 
    if(this.i > 0){
      this.maxIdInv -= 1;
      this.postCertificado.numInvActual = this.maxIdInv;
    }

    //verifico que las locacion ya este en memoria para guardar
    if(this.latitude > 0){
        //hago los insert al hist_inv_invetario para hacer el reporte
        this.sendData();
    }else{
        this.alerta.warning('Esta casi listo, intentalo otra vez' ,'Ya casi!');
        this.getLocation();
    }

    


    //muestra el boton de cerrar la barra de loading en caso de que tarde mas de lo esperado y en caso de errores para intentarlo otra vez
    setTimeout(() => {
        this.mostrarBotonCerrarBarraCarga = true;
    },this.tablaInventarioBaterias.length * 1000);
    

    //this.tablaInventarioBaterias = [];
   // this. codigo_distribuidor = '';
  }
  
  //cerrar forsozamente la barra de carga
  cerrarBarra(){
    this.mostrarBotonCerrarBarraCarga = false;
    document.querySelector('.loader2')?.classList.add('d-none');
  }


  ngOnInit(): void {
   this.codigoEmpleado = num_empleado;
   this.nombreEmpleado = nombre_empleado;
   this.localEmpleado = local_empleado;

   //si los datos de la sesion estan en localstorage mandame directamente al reporte para poder cerrarlo 
   if(localStorage.getItem('datos-inventario') !== undefined && localStorage.getItem('datos-inventario')){
      this.navegar.navigateByUrl('/reporte'); 
   }

  }


}
