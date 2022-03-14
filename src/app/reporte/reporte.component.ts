import { Component, HostListener, OnInit } from '@angular/core';
import { TraerCertificadoService } from '../traer-certificado.service';
import { ToastrService } from 'ngx-toastr';
import { LocationStrategy, ViewportScroller } from '@angular/common';

@Component({
  selector: 'app-reporte',
  templateUrl: './reporte.component.html',
  styleUrls: ['./reporte.component.css'],
  
})
export class ReporteComponent implements OnInit {
  //evento que detecta si algo esta pendiente antes de salir de la pagina y te pregunta si quieres avandonarla
  @HostListener('window:beforeunload')
    onBeforeUnload() {
      //returnar false hace que salga un alert
      return this.evitarPreguntaSalirPagina;
  }
  
  constructor( public reporte: TraerCertificadoService, public alerta: ToastrService,private vps: ViewportScroller, private location: LocationStrategy ) {
    //LocationStrategy lo importo instancio en construcotr y lo uso aca para decirle que desavilite el boton de retroseder en el navegador
    history.pushState(null, '', window.location.href);  
    this.location.onPopState(() => {
      history.pushState(null, '', window.location.href);
    });  
  }

  scroll(id:any) {
    this.vps.scrollToAnchor(id);
  }


  tablaReporte: any[] = this.reporte.tablaReporteFinal; //tabla que tiene todos los chasis tomados

  seriales_No_Encontrados: any[] = []; //o mal digitados
  seriales_sinFacturas: any[] = []; // seriales fisicos donde el distribuidor pero sin factura de viamar(como el las tiene si viamar no se las vendio)
  seriales_dados_deBaja: any[] = []; //todos los seriales fuera de uso que nunca volveran a viamar
  reporteFinalBaterias_a: any[] = [];
  reporteFinalBaterias_b: any[] = [];
  reporteFinalBaterias_c: any[] = [];
  reporteFinalBaterias_d: any[] = [];

  //variables bindiadas en html
  localDistribuidor: string = this.reporte.localDistribuidor;
  codigoDistribuidor: string = this.reporte.codigoDistribuidor;
  cedula_rnc: string = this.reporte.cedulaRncDistribuidor;
  nombreDistribuidor: string = this.reporte.nombreDistribuidor;
  numClaDistribuidor: string = this.reporte.numClaDistribuidor;
 
  codigo_de_empleado: string = this.reporte.codigoEmpleado;
  nombre_de_empleado: string = this.reporte.nombreEmpleado
  baterias_en_stock: string = this.reporte.bateriasStock;
  id_inv_actual: string = this.reporte.numInvActual;


  //objeto de la secion a guardar en el local storage en caso de cierre bruscamente
  reporte_sesion = {
    'idInv': this.id_inv_actual,
    'local_distri': this.localDistribuidor,
    'codigo_distri': this.codigoDistribuidor,
    'cedula_rnc_distri': this.cedula_rnc,
    'nombre_distri': this.nombreDistribuidor,
    'num_cla_distri': this.numClaDistribuidor,
    'codigo_emple': this.codigo_de_empleado
  };


  condicion: boolean = false;

  //guardo solamente los seriales de la tabla principal
  seriales: any = [];

  NofilaSeleccionada: any; //el numero id de la fila que seleccione

  /*************************************************************************************** */



  /****************************************************************************************** */
  //Proceso de rotacioin de baterias de la lista reporte B

  //datos de rotacion cuando se selecciona la fila a hacer la rotacion
  filaRotacion: any = [];

  //traigo los datos de la fila en cada caso
  datoFilaRotacion(datosRotacion: HTMLElement) {
    this.filaRotacion.push(this.codigoDistribuidor);
    this.filaRotacion.push(datosRotacion.dataset.serie);

    this.NofilaSeleccionada = datosRotacion.id;
  }

  async traerMaxNum_solicitudRotacion() {
    //total de encuestas
    try {
      const Query = {
        query: 'select max(secuencial) +1 as maxnum  from enc_sol_bateria',
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

      let res = await fetch("../../api/Soap/Soap2.php",opcion);
      let json = await res.json();

      if (res.ok == true) {
        this.maxnum = json[0].MAXNUM;
      }
    } catch (error) {
      console.log(error);
    }
  }

  inputSerialRotar: string = ''; //input de la confirmacion de serial para los casos de rotacion y dar de baja
  maxnum: any; //el numero maximo de tabla enc_rotacion
  rotarMultiplesSeriales: any = []; //seriales que se rotaran en seleccion multiple

  selectCheck(seleccionRotacion: HTMLInputElement) {
    if (seleccionRotacion.checked == true) {
      this.rotarMultiplesSeriales.push(seleccionRotacion.name); //introduzco serial
      seleccionRotacion.classList.add('tomado'); //coloco clase para saber cuales quitar de las lista despues
    }

    if (
      seleccionRotacion.checked == false &&
      seleccionRotacion.classList.contains('tomado')
    ) {
      let indice = this.rotarMultiplesSeriales.indexOf(
        `${seleccionRotacion.name}`
      );
      this.rotarMultiplesSeriales.splice(indice, 1); //saco el serial de esta lista
      seleccionRotacion.classList.remove('tomado');
    }

    //console.log(this.rotarMultiplesSeriales);
  }

  lista_temporar_comparar_seriales_tomados: any = [];
  validarSerialesRotar(inputSerial: HTMLInputElement) {
    if (inputSerial.value.length < 6) {
      this.alerta.warning('Numero de digitos insuficientes');
    }

    if (inputSerial.value.length == 6) {
      this.lista_temporar_comparar_seriales_tomados.push(inputSerial.value);
      //console.log(inputSerial.value);
      inputSerial.value = '';
    }

    //bucle para verificar que los seriales a confirmar sean los mismo que se seleccionaron
    let contadorBien = 0;
    if (
      this.lista_temporar_comparar_seriales_tomados.length ==
      this.rotarMultiplesSeriales.length
    ) {
      for (let i = 0; i < this.rotarMultiplesSeriales.length; i++) {
        for (
          let j = 0;
          j < this.lista_temporar_comparar_seriales_tomados.length;
          j++
        ) {
          if (
            this.rotarMultiplesSeriales[i] ==
            this.lista_temporar_comparar_seriales_tomados[j]
          ) {
           // console.log('bien');
            contadorBien++;
          }
        }
      }
    }

    //confirmo que todo se(el contador) cumpla para poder hacer la solicitud
    if (
      this.lista_temporar_comparar_seriales_tomados.length ==
      this.rotarMultiplesSeriales.length
    ) {
      if (contadorBien != this.rotarMultiplesSeriales.length) {
        this.lista_temporar_comparar_seriales_tomados = [];
        this.alerta.warning(
          'Serial no coincide, cancele el proceso y intentelo de nuevo',
          'Error de serial'
        );
      }
    }
  }

  async solicitarRotacion() {
    document.querySelector('.loader')?.classList.remove('d-none');

    if (this.filaRotacion[1] == this.inputSerialRotar) {
      await this.traerMaxNum_solicitudRotacion();

      this.reporte
        .rotar1(
          this.codigoDistribuidor,
          this.maxnum,
          this.reporteFinalBaterias_b[this.NofilaSeleccionada]
        )
        .subscribe(
          (data) => {
            console.log('creo enc_sol de la bateria ' + data);
            if(data == 1){
              this.reporteFinalBaterias_b.splice(this.NofilaSeleccionada, 1);
            }else{
              this.alerta.warning('No se puedo realizar la solicitud de rotacion', 'error de solicitud!');
            }
            
          },
          (err) => {
            //manejo los errores equivalente a try catch
            document.querySelector('.loader')?.classList.add('d-none');
            this.alerta.error('Error de conexion' + err, 'error conexion!');
          }
        );

      this.reporte
        .rotar2(
          this.codigoDistribuidor,
          this.inputSerialRotar,
          this.maxnum,
          this.reporteFinalBaterias_b[this.NofilaSeleccionada]
        )
        .subscribe(
          (data) => {
            console.log('creo det_sol de una bateria ' + data);

              document.querySelector('.loader')?.classList.add('opacity-0');
            setTimeout(() => {
              document.querySelector('.loader')?.classList.add('d-none');
              document.querySelector('.loader')?.classList.remove('opacity-0');
            }, 700);

            this.alerta.success(
              'Se realizo la solicitud de rotacion exitosamente',
              'Bateria Rotada!'
            );
          },
          (err) => {
            //manejo los errores equivalente a try catch
            document.querySelector('.loader')?.classList.add('d-none');
            this.alerta.error('Error de conexion' + err, 'error conexion!');
          }
        );

      this.inputSerialRotar = '';
      this.NofilaSeleccionada = '';
    } else {
      document.querySelector('.loader')?.classList.add('d-none');
      this.alerta.warning(
        'El numero de serial no coinside con el seleccionado',
        'Serial Incorrecto!'
      );
      this.inputSerialRotar = '';
    }

    //reinicio la fila de datos
    this.filaRotacion = [];
  }

  async rotarMultiples(reporte_b: HTMLTableSectionElement) {
    let validaInsercion = 0 // 0 si es falso y 1 si la insercino es verdadera

    document.querySelector('.loader')?.classList.remove('d-none');

    await this.traerMaxNum_solicitudRotacion();

    //creo el encabezado reutilizando la funcion de rotar1, es obligatoria crear un encabezado antes de introducir los det_sol baterias por su primary key en la columna FRB #
    //nota: se cambio this.NofilaSeleccionada por 0 lo que me dara un el local de la primera fila seleccionada y esto podria cambiar
    this.reporte
      .rotar1(
        this.codigoDistribuidor,
        this.maxnum,
        this.reporteFinalBaterias_b[0]
      )
      .subscribe(
        (data) => {
          console.log('creo enc_sol de la bateria ' + data)
          if(data == 1){
            validaInsercion = 1;
          }
        },
        (err) => {
          document.querySelector('.loader')?.classList.add('d-none');
          this.alerta.error('Error de conexion' + err, 'error conexion!');
        }
      );

    //introduzcos multiplez seriales a la vez, los seleccionados en el checkbox
    this.reporte
      .rotarSeleccionados(
        this.rotarMultiplesSeriales,
        this.maxnum,
        this.codigoDistribuidor
      )
      .subscribe(
        (data) => {
          console.log('creo det_sol de multiples bateria ' + data);

          document.querySelector('.loader')?.classList.add('opacity-0');
            setTimeout(() => {
              document.querySelector('.loader')?.classList.add('d-none');
              document.querySelector('.loader')?.classList.remove('opacity-0');
            }, 700);

          this.alerta.success(
            'Se genero la solicitud de las baterias seleccionadas',
            'Baterias Rotadas'
          );
        },
        (err) => {
          document.querySelector('.loader')?.classList.add('d-none');
          this.alerta.error('Error de conexion' + err, 'error conexion!');
        }
      );

        if(validaInsercion){
              let listaSerialesSeleccionados = reporte_b.children;

                  //los seriales seleccionados con la clase tomado, les pondre d-none para que se vea dinamico
                  for (let i = 0; i < listaSerialesSeleccionados.length; i++) {
                    if (
                      listaSerialesSeleccionados
                        .item(i)
                        ?.children[0].children[0].classList.contains('tomado')
                    ) {
                      listaSerialesSeleccionados.item(i)?.classList.add('d-none');
                    }
                  }

              //limpio variable
              this.rotarMultiplesSeriales = [];
        }

  }

  //seccion de dar de baja a bateria
  comentarioDarDeBaja: string = ''; //input comentario
  darDeBajaBateria() {  
    document.querySelector('.loader')?.classList.remove('d-none');

    if (this.filaRotacion[1] == this.inputSerialRotar) {
      this.reporte
        .dar_baja_bateriaRotacion(
          this.filaRotacion[1],
          this.comentarioDarDeBaja
        )
        .subscribe(
          (data) => {
            console.log(data);
              if(data == 1){
                this.reporteFinalBaterias_b.splice(this.NofilaSeleccionada, 1);
                this.inputSerialRotar = '';
                this.comentarioDarDeBaja = '';
                
                document.querySelector('.loader')?.classList.add('opacity-0');
                setTimeout(() => {
                  document.querySelector('.loader')?.classList.add('d-none');
                  document.querySelector('.loader')?.classList.remove('opacity-0');
                }, 700);
    
                this.alerta.success(
                  'Bateria dada de baja',
                  'Echo'
                );            
              }else{
                this.alerta.success( 'No se puedo dar de baja esta bateria', 'Error al dar de baja');   
              }
            
              document.querySelector('.loader')?.classList.add('d-none');

          },
          (err) => {
            //manejo los errores equivalente a try catch
            document.querySelector('.loader')?.classList.add('d-none');
            this.alerta.error('Error de conexion' + err, 'error conexion!');
          }
        );
    } else {
      document.querySelector('.loader')?.classList.add('d-none');
      this.alerta.warning(
        'Serial introducido no es igual al seleccionado',
        'Serial incorrecto!'
      );
    }

    this.filaRotacion = [];
  }

  /************************************************************************* */
  //datos de rehabilitacion de baterias para que pueda volver a venderse en el establecimiento donde sea que este
  filaRehabilitacion: any = [];

  datoFilaRehabilitarSerial(datosRehabilitacion: HTMLElement) {
    this.NofilaSeleccionada = datosRehabilitacion.id;
    this.filaRehabilitacion.push(datosRehabilitacion.dataset.serie);
  }

  inputSerialRehabilitar: string = ''; //ngmodel de este input
  inputObservacionRehabilitar: string = '';

  rehabilitarSerial() {
    if (this.filaRehabilitacion[0] == this.inputSerialRehabilitar) {
      document.querySelector('.loader')?.classList.remove('d-none');

      this.reporte
        .rehabilitar(
          this.filaRehabilitacion[0],
          this.inputObservacionRehabilitar
        )
        .subscribe(
          (data) => {
            console.log(data);

            if(data == 1){
              this.reporteFinalBaterias_c[0].splice(this.NofilaSeleccionada, 1);
              this.NofilaSeleccionada = '';
              this.filaRehabilitacion = []; //limpio variables para otro proceso nuevo
              this.inputObservacionRehabilitar = '';
              this.inputSerialRehabilitar = '';
  
                document.querySelector('.loader')?.classList.add('opacity-0');
                setTimeout(() => {
                  document.querySelector('.loader')?.classList.add('d-none');
                  document.querySelector('.loader')?.classList.remove('opacity-0');
                }, 700);
    
                this.alerta.success(
                  'Bateria disponible nuevamente para su venta',
                  'Bateria rehabilitada!'
                );
            }else{
              this.alerta.warning( 'Ha fallado la rehabilitacion de esta unidad', 'Error rehabilitacion!' );
            }

            document.querySelector('.loader')?.classList.add('d-none');
           
          },
          (err) => {
            document.querySelector('.loader')?.classList.add('d-none');
            this.alerta.error('Error de conexion' + err, 'error conexion!');
          }
        );
    } else {
      document.querySelector('.loader')?.classList.add('d-none');
      this.alerta.warning(
        'Serial introducido no es igual al seleccionado',
        'Serial incorrecto!'
      );
    }
  }

  /**************************************************************************** */
  //datos de registro de vaterias, para registrar la venta al mismo distribuidor propietario
  filaRegistroVenta: any = [];
  datoFilaregistroVenta(datoRegistro: HTMLElement) {
    this.NofilaSeleccionada = datoRegistro.id;
    this.filaRegistroVenta.push(datoRegistro.dataset.serie);
    this.filaRegistroVenta.push(datoRegistro.dataset.articulo);
  }

  async registroVenta() {
    document.querySelector('.loader')?.classList.remove('d-none');
   // await this.datosCliente_cedula_nombre();

    this.reporte
      .registrar(
        this.cedula_rnc,
        this.nombreDistribuidor,
        this.filaRegistroVenta[0],
        this.codigoDistribuidor,
        this.filaRegistroVenta[1],
        this.localDistribuidor,
        this.numClaDistribuidor
      )
      .subscribe(
        (data) => {
          console.log(data);
          //confirmacion de la insercion  
          if(data == 1){
            this.reporteFinalBaterias_d[0].splice(this.NofilaSeleccionada, 1);
            this.NofilaSeleccionada = '';
            this.filaRegistroVenta = [];

              document.querySelector('.loader')?.classList.add('opacity-0');
              setTimeout(() => {
                document.querySelector('.loader')?.classList.add('d-none');
                document.querySelector('.loader')?.classList.remove('opacity-0');
              }, 700);

                this.alerta.success(
                  'Bateria registrada al vendendor exitosamente',
                  'Bateria Registrada!'
                );
          }else{
            this.alerta.warning('No se pudo registrar la venta', 'Fallo de registro!');
            this.NofilaSeleccionada = '';
            this.filaRegistroVenta = [];
          }

          document.querySelector('.loader')?.classList.add('d-none');

        },
        (err) => {
          document.querySelector('.loader')?.classList.add('d-none');
          this.alerta.error('Error de conexion' + err, 'error conexion!');
        }
      );
  }

  cancelar() {
    this.filaRotacion = [];
    this.inputSerialRotar = '';
    this.NofilaSeleccionada = '';
    this.inputSerialRehabilitar = '';
    this.filaRehabilitacion = [];
    this.inputObservacionRehabilitar = '';
    this.filaRegistroVenta = [];
    this.lista_temporar_comparar_seriales_tomados = [];
  }

  /**************************************************/
evitarPreguntaSalirPagina:boolean = false;
finalizarInv() {

    document.querySelector('.loader')?.classList.remove('d-none');

    this.reporte.finalizarReporte(this.id_inv_actual).subscribe(
      (data) => {
        console.log(data);
        if(data != null && data >= 1){  
            this.evitarPreguntaSalirPagina = true;
            setTimeout(() => {
              localStorage.removeItem('datos-inventario');
              document.location.assign('');
            }, 2000);

        }else{
          document.querySelector('.loader')?.classList.add('d-none');
          this.alerta.warning('No se pudo finalizar el inventario', 'error al finalizar!');
        }
   
      },
      (err) => {
        document.querySelector('.loader')?.classList.add('d-none');
        this.alerta.error('Error de conexion' + err, 'error conexion!');
      }
    );
}

  //quitar teclado para entrada scanner
  entrada(inputTeclado: HTMLInputElement) {
    inputTeclado.readOnly = true;

    setTimeout(() => {
      inputTeclado.readOnly = false;
    }, 100);
  }


  noEncontrados: boolean = false;
  reporte_a: boolean = false;
  reporte_b: boolean = false;//pendiente de eliminar
  reporte_c: boolean = false;
  reporte_d: boolean = false;
  sinFactura: boolean = false;//pendiendte de eliminar
  deBaja: boolean = false;


  estado_todo_bien:boolean = false; //pantalla que indica que todo esa perfecto
  error_carga_pantallaVacia:boolean = false;//pantalla si la carga falla
 
fecha:string = '';

  ngOnInit(): void {

    //paso todos los valores de la sesion actual al local storage en caso de que cierre bruscamente la pagina
    if(localStorage.getItem('datos-inventario') !== undefined && localStorage.getItem('datos-inventario')){
        let data_storage:any = localStorage.getItem('datos-inventario');
        let data_storage_json = JSON.parse(data_storage)

        this.localDistribuidor = data_storage_json.local_distri;
        this.codigoDistribuidor = data_storage_json.codigo_distri;
        this.cedula_rnc = data_storage_json.cedula_rnc_distri;
        this.nombreDistribuidor = data_storage_json.nombre_distri;
        this.numClaDistribuidor = data_storage_json.num_cla_distri;
        this.id_inv_actual = data_storage_json.idInv;
        this.codigo_de_empleado = data_storage_json.codigo_emple

    }


    document.querySelector('.loader')?.classList.remove('d-none');

        //limpio las tablas para luego llenarlas con los nuevos datos actualizados
  this.seriales_No_Encontrados = []; 
  this.seriales_sinFacturas = []; 
  this.seriales_dados_deBaja = []; 
  this.reporteFinalBaterias_a = [];
  this.reporteFinalBaterias_b = [];
  this.reporteFinalBaterias_c = [];
  this.reporteFinalBaterias_d = [];

  
 
  let hoy = Date.now() * 1;
  let fechaHoy = new Date(hoy);

        //proceso para calcular baterias en rotacion
        let fecha3Meses = new Date(hoy);
        //dias a restar
        let dias = 90;
        //nueva fecha restada
        fecha3Meses.setDate(fecha3Meses.getDate() - dias);
        //formato de salida para la fecha
        let resultadoRestaMeses = fecha3Meses

  this.fecha = fechaHoy.toLocaleDateString('en-GB');//fecha para mostrar en html de hoy

    this.reporte.serialesNoEncontrados(this.id_inv_actual).subscribe(
      (data) => {
        this.seriales_No_Encontrados=[data];
        console.log(data);
        if (data != null) {
          if (data.length > 0) {
            this.noEncontrados = true;
          }
        }

        this.error_carga_pantallaVacia = false;
      },
      (err) => {
        document.querySelector('.loader')?.classList.add('d-none');
        document.querySelector('.loaderInicio')?.classList.add('d-none');
        this.alerta.error('Error de conexion' + err, 'error conexion!');

        this.error_carga_pantallaVacia = true;//si falla la primera conexion las otras fallaran
      }
    );

    //verifico las baterias que no pertenecen al distribuidor seleccionado si aplica
    this.reporte
      .reporteSeccion_A(this.codigoDistribuidor, this.id_inv_actual)
      .subscribe(
        (data) => {
          this.reporteFinalBaterias_a.push(data);
          console.log(data);
          if (data != null) {
            if (data.length > 0) {
              this.reporte_a = true;
            }
          }
    
        },
        (err) => {
          document.querySelector('.loader')?.classList.add('d-none');
          this.alerta.error('Error de conexion' + err, 'error conexion!');
        }
      );

    this.reporte
      .reporteSeccion_B(this.codigoDistribuidor, this.id_inv_actual)
      .subscribe(
        (data) => {
          if (data != null) {

            //hago substring a todas las fechas para poder calcular si pasa de los 3 meses
            for (let i = 0; i < data.length; i++) {

               let fechaOracle = data[i].FECHA;

               let diaOracle = parseInt(fechaOracle.substring(0,2));
               let mesOracle = parseInt(fechaOracle.substring(3,5)) - 1;//le resto uno porque al mes se le esta sumando un mes
               let anoOracle = parseInt(fechaOracle.substring(6,10));

               var fOracle = new Date(anoOracle,mesOracle,diaOracle); //2014, 10, 30
               var f2 = new Date(resultadoRestaMeses); //fecha restada

              //valido la fecha que sea menor a 3 meses para rotacion
              if (fOracle <= f2) {
                this.reporteFinalBaterias_b.push(data[i]);
                console.log( 'la fecha esta fuera de los tres meses de garantia');
              }

            }
          }
          if (data != null) {
            if (data.length > 0) {
              this.reporte_b = true;
            }
          }
        },
        (err) => {
          document.querySelector('.loader')?.classList.add('d-none');
          this.alerta.error('Error de conexion' + err, 'error conexion!');
        }
      );

    //comparo si algunas de esta baterias estan vendidas
    this.reporte.reporteSeccion_C(this.id_inv_actual).subscribe(
      (data) => {
        this.reporteFinalBaterias_c.push(data);
        if (data != null) {
          if (data.length > 0) {
            this.reporte_c = true;
          }
        }
      },
      (err) => {
        document.querySelector('.loader')?.classList.add('d-none');
        this.alerta.error('Error de conexion' + err, 'error conexion!');
      }
    );

    //muestro las baterias que no estan fisicas y no estan vendidas
    this.reporte
      .reporteSeccion_D(this.codigoDistribuidor, this.id_inv_actual)
      .subscribe(
        (data) => {
          console.log(data);
          this.reporteFinalBaterias_d.push(data);
          if (data != null) {
            if (data.length > 0) {
              this.reporte_d = true;
            }
          }
        },
        (err) => {
          document.querySelector('.loader')?.classList.add('d-none');
          this.alerta.error('Error de conexion' + err, 'error conexion!');
        }
      );

    this.reporte.serialesFisicosSinFacturaViamar(this.id_inv_actual).subscribe(
      (data) => {
        //this.seriales_sinFacturas.push(data); 
        this.seriales_sinFacturas = [data]
       
        if (data != null) {
          if(this.seriales_sinFacturas[0].length > 0){
            this.sinFactura = true;
          }
        }

      },
      (err) => {
        document.querySelector('.loader')?.classList.add('d-none');
        this.alerta.error('Error de conexion' + err, 'error conexion!');
      }
    );


    //baterias dadas de baja
    this.reporte.bateriasDeBaja(this.codigoDistribuidor).subscribe(
      (data) => {
        this.seriales_dados_deBaja.push(data);
        if (data != null) {
          if (data.length > 0) {
            this.deBaja = true;
          }
        }

        document.querySelector('.loader')?.classList.add('d-none');

                          document.querySelector('.loaderInicio')?.classList.add('opacity-0');
                          setTimeout(() => {
                            document.querySelector('.loaderInicio')?.classList.add('d-none');
                            document.querySelector('.loaderInicio')?.classList.remove('opacity-0');
                            this.scroll('target');//enfoco la pantalla inicial arriba
                          }, 700);
        
        if(this.noEncontrados == false && this.reporte_a == false && this.reporte_b == false && this.reporte_c == false && this.reporte_d == false && this.sinFactura == false && this.deBaja == false && this.id_inv_actual.length > 0){
          this.estado_todo_bien = true;
        }
        
      },
      (err) => {
        document.querySelector('.loader')?.classList.add('d-none');
        this.alerta.error('Error de conexion' + err, 'error conexion!');
      }
    );

          //valido que el local store este vacio para llenar los datos de la sesion en caso de cierre brusco
          if(localStorage.getItem('datos-inventario') !== undefined && localStorage.getItem('datos-inventario')){
            console.log('localStorage esta lleno, no guardare nada hasta que este vacio')
          }else{
            localStorage.setItem('datos-inventario', JSON.stringify(this.reporte_sesion))
          }
      
  }


}
