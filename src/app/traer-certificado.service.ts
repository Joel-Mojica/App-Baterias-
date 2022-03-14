import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TraerCertificadoService {

  constructor(private http: HttpClient) { }

  conApi:string = 'https://grupoviamar.com/api/Soap/Soap2.php';


  postValidaDistrib(codigo: string): Observable<any>{
    const opcion = {
      query: ` 
      SELECT inv.num_cliente,
      c.nombre,
      c.num_cla,
      (select count(*) from inv_bateria_distribuidor where estatus = 'D') AS NUM_BATERIAS
    FROM INV_BATERIA_DISTRIBUIDOR inv, clientes c
            where inv.num_cliente = c.num_cliente
            and inv.local = c.local
            and inv.NUM_CLA = c.num_cla
            and inv.num_cliente ='${codigo}'
            --and inv.estatus = 'D'
            and c.estado = 'S'
            and c.TIPO_CLIENTE = 'N'
            and rownum < 2
      `,
      mode: '0',
      asesor: '',
      local: ''
    }

   return this.http.post(this.conApi,opcion)
  }

  //variables estaticas o globales!
  tablaReporteFinal:any =[] = [];
  
  localDistribuidor: any = '';
  codigoDistribuidor:string = '';
  cedulaRncDistribuidor: any = '';
  nombreDistribuidor:string = '';
  numClaDistribuidor:any = '';

  bateriasStock:string = '';

  codigoEmpleado: string = '';
  nombreEmpleado: string = '';
  numInvActual: any = '';
  


  //no usar en el front-end
  guardarReporteGeneral(codigoDistribuidor:any,serial:any,id_inv:any,codEmpleado:any,locEmpleado:any,latitude:any,longitude:any): Observable<any>{
    const opcion = {
      //insercion a la tabla de reporte de inventario     
      query: `
           insert into hist_inv_bateria_distribuidor (local,
                                                      id_inv,
                                                      num_empleado,
                                                      fecha_inicio,
                                                      num_cli_distribuidor,
                                                      serial,
                                                      estado_inv,
                                                      geolocalización) values ('${locEmpleado}',
                                                                          ${id_inv},
                                                                          ${codEmpleado},
                                                                          SYSDATE,
                                                                          ${codigoDistribuidor},
                                                                          ${serial},
                                                                          'A',
                                                                          '${latitude},${longitude}')
            `,
      mode: '1',
      asesor: '',
      local: ''
    }
   return  this.http.post(this.conApi, opcion)
  }

  //seriales que no existen en viamar o estan mal digitados
  serialesNoEncontrados(id:any): Observable<any>{
    const opcion = {
      query: `
            select serial from hist_inv_bateria_distribuidor
                where id_inv = ${id}
                and estado_inv = 'A'
                and serial not in (select serie from existencia_serie_baterias)
            `,
      mode: '0',
      asesor: '',
      local: ''
    }
   return  this.http.post(this.conApi, opcion)
  }

  reporteSeccion_A(codigoDistri:any,id:any): Observable<any>{
   let opcion = {  
          query: `
           select h.serial,
                  a.descripcion || ' ' || a.codigo as descripcion
           from hist_inv_bateria_distribuidor h, existencia_serie_baterias e, articulos a
        where h.serial = e.serie
          and e.local = a.local
          and e.articulo = a.articulo
          and id_inv = ${id}
          and e.estatus in ('F','FR')
          and h.estado_inv = 'A'
          and h.serial not in(select serial from inv_bateria_distribuidor 
                                  where num_cliente = ${codigoDistri})
            `,
          mode: '0',
          asesor: '',
          local: ''
        }
       return  this.http.post(this.conApi, opcion)
  }

  reporteSeccion_B(codigo:any,id:any): Observable<any>{

    const opcion = {
      //query principal para el reporte b  
      //falta poner filtro de id_inv  
      query: `
   SELECT inv.num_cliente,
          inv.no_docu,
          inv.LOCAL,
          ex.SERIE,
          inv.articulo,
          a.DESCRIPCION,
          c.nombre,
          to_char(inv.FECHA, 'dd/mm/yyyy') as fecha,
          ex.local as localBate,
          ex.num_alm
  FROM INV_BATERIA_DISTRIBUIDOR inv, existencia_serie_baterias ex,clientes c, articulos a
        where inv.articulo = ex.articulo
        and ex.articulo = a.articulo
        and inv.serial = ex.serie
        and ex.local = a.local 
        and a.local = c.local
        and inv.num_cliente = c.num_cliente
        and inv.NUM_CLA = c.num_cla
        and inv.num_cliente ='${codigo}'
        and inv.estatus = 'D'
        and inv.serial in (select serial from hist_inv_bateria_distribuidor where estado_inv = 'A' and id_inv = ${id})
        order by inv.num_cliente
            `,
      mode: '0',
      asesor: '',
      local: ''
    }
   return  this.http.post(this.conApi, opcion)
  }

  reporteSeccion_C(id:any): Observable<any>{
    const opcion = {
      //QUERY A USAR PARA IDENTIFICAR LAS BATERIAS VENDIDAS PERO NO FISICAR!  
      //este query estara abierto para traer todos los seriales consultados sean o no del distribuidor auditado
      //la medida se toma para que si este caso aparece se rehabilite el serial para el vendedor que tiene dicha bateria asignada  
      query: `
      select r.no_serial,
       a.descripcion,
       c.nombre,
       TO_CHAR(r.fecha_factura,'dd/mm/yyyy') AS fecha_factura  
    from registro_venta_baterias r, existencia_serie_baterias ex , articulos a, clientes c
       where ex.articulo = a.articulo
       and r.num_cliente = c.num_cliente
       and r.no_serial = ex.serie
       and ex.local = a.local
       and a.local = c.local
       and c.num_cla = r.num_cla
       and r.fecha_devolucion is null
       and r.estatus = 'E'
       and r.no_serial in (select serial from hist_inv_bateria_distribuidor where estado_inv = 'A' and id_inv = ${id})
            
            `,
      mode: '0',
      asesor: '',
      local: ''
    }
   return  this.http.post(this.conApi, opcion)

  
  }

  reporteSeccion_D(codigoDist:string, id:any): Observable<any>{

              const opcion = {
                //!    
                query: `
               select inv.serial,
                      a.descripcion,
                      inv.no_docu,
                      TO_CHAR(inv.fecha,'dd/mm/yyyy') as fecha,
                      inv.articulo
             from inv_bateria_distribuidor inv,articulos a
                where inv.articulo = a.articulo
                and inv.local = a.local
                and inv.estatus = 'D' 
                and inv.num_cliente = '${codigoDist}'
                and serial not in(select serial from hist_inv_bateria_distribuidor where estado_inv = 'A' and id_inv = ${id})
                      `,
                mode: '0',
                asesor: '',
                local: ''
              }
             return  this.http.post(this.conApi, opcion)
          
  }

  serialesFisicosSinFacturaViamar(id:any){//seriales en grupo viamar sin factura
    const opcion = {
      query: `
          select * from hist_inv_bateria_distribuidor
                where id_inv = ${id}
                and estado_inv = 'A'
                and serial in (select serie from existencia_serie_baterias where estatus <> 'F' and estatus <> 'FR')
            `,
      mode: '0',
      asesor: '',
      local: ''
    }
   return  this.http.post(this.conApi, opcion)
  }


  //procesos de inventario bateria pda
//*********************************************************************** */
//este inserta el encabezado de la rotacion 
rotar1(codigoDistri:any,maxNum:any,tablaDato:any): Observable<any>{

  const option = {
    query: `

    insert into enc_sol_bateria (id_sol,
            secuencial,
            local,
            num_cla,
            num_cliente,
            fecha,
            usuario,
            estatus,
            NUM_ALM) values ('FRB${maxNum}',${maxNum},'${tablaDato.LOCALBATE}','30',${codigoDistri},SYSDATE,'WEB','S','${tablaDato.NUM_ALM}')
    `,
    mode: '1',
    asesor: '',
    local: ''
  }

  return this.http.post('https://grupoviamar.com/api/Soap/Soap2.php',option)
  
  
   
}

//este inserta el detalle de rotacion
rotar2(codigoDistri:any,serial:any,maxNum:any,tablaDato:any): Observable<any>{
  const option = {
    query: `insert into det_sol_bateria (id_sol, 
                                       articulo,  
                                       serie, 
                                       cantidad, 
                                       factura, 
                                       local,   
                                       estado) values('FRB${maxNum}','${tablaDato.ARTICULO}',${serial},1,'${tablaDato.NO_DOCU}','${tablaDato.LOCALBATE}', 'S' )
    `,
    mode: '1',
    asesor: '',
    local: ''
  }

  return this.http.post('https://grupoviamar.com/api/Soap/Soap2.php',option)
}

//rotar multiples vaterias a la vez
rotarSeleccionados(seriales: any,maxNum:any,codigoDistri:any): Observable<any>{
       const option = {
        query: `insert into det_sol_bateria (id_sol, 
                                              articulo,  
                                              serie, 
                                              cantidad, 
                                              factura, 
                                              local,   
                                              estado)
        SELECT 'FRB${maxNum}' AS ID_SOL,
                inv.articulo,
                ex.SERIE,
                '1' AS CANTIDAD,
                inv.no_docu,
                inv.LOCAL,
                'S' AS ESTADO
        FROM INV_BATERIA_DISTRIBUIDOR inv, existencia_serie_baterias ex,clientes c, articulos a
                where inv.articulo = ex.articulo
                and ex.articulo = a.articulo
                and inv.serial = ex.serie
                and ex.local = a.local 
                and a.local = c.local
                and inv.num_cliente = c.num_cliente
                and inv.NUM_CLA = c.num_cla
                and inv.num_cliente ='${codigoDistri}'
                and inv.estatus = 'D'
                and inv.serial in (${seriales})
 `,
        mode: '1',
        asesor: '',
        local: ''
      }
    
      return this.http.post('https://grupoviamar.com/api/Soap/Soap2.php',option)  


}


//inhabilita bateria para rotaciones futuras
dar_baja_bateriaRotacion(serial:any,comentario:any){
  const option = {
    query: `
            update inv_bateria_distribuidor set estatus = 'F',comentario = '${comentario}'
                where serial = ${serial}
            `,
    mode: '1',
    asesor: '',
    local: ''
  }

  return this.http.post('https://grupoviamar.com/api/Soap/Soap2.php',option)
}


bateriasDeBaja(codigo:any): Observable<any>{//descompuesta que nunca se usaran
  const option = {
    query: `
     SELECT inv.no_docu,
            ex.SERIE,
            inv.comentario
FROM INV_BATERIA_DISTRIBUIDOR inv, existencia_serie_baterias ex,clientes c, articulos a
    where inv.articulo = ex.articulo
        and ex.articulo = a.articulo
        and inv.serial = ex.serie
        and ex.local = a.local 
        and a.local = c.local
        and inv.num_cliente = c.num_cliente
        and inv.NUM_CLA = c.num_cla
        and inv.num_cliente ='${codigo}'
        and inv.estatus = 'F'
        and inv.serial in (select serial from hist_inv_bateria_distribuidor where estado_inv = 'A')
        order by inv.num_cliente
            `,
    mode: '0',
    asesor: '',
    local: ''
  }

  return this.http.post('https://grupoviamar.com/api/Soap/Soap2.php',option)
}


/******************************************************************************* */

rehabilitar(serial:any,observacion:any): Observable<any>{
  const option = {
    query: `
          update registro_venta_baterias 
          set fecha_devolucion = sysdate, 
              estatus = 'C',
              OBSERVACION_WEB = '${observacion}'
        where no_serial = '${serial}'
          and estatus = 'E'
      `,
    mode: '1',
    asesor: '',
    local: ''
  }

  return this.http.post('https://grupoviamar.com/api/Soap/Soap2.php',option)

}


/*********************************************************************************** */


registrar(cedula:string,nombre:string,serial:any,numCliente:any,articulo:any,local:any,numCla:any): Observable<any>{
  const option = {
    query: `
    insert into registro_venta_baterias (local,
                                        cedula_rnc,
                                        nombre,
                                        numero_factura,
                                        fecha_factura,
                                        no_serial,
                                        num_cliente,
                                        fecha_registro,
                                        articulo,
                                        estatus,
                                        tipo_uso_comentario,
                                        num_cla,
                                        tipo_uso           ) values ('${local}',
                                                                    '${cedula}',
                                                                    '${nombre}',
                                                                    'FT99999',
                                                                      sysdate,
                                                                      '${serial}',
                                                                      '${numCliente}',
                                                                      sysdate,
                                                                      '${articulo}',
                                                                      'E',
                                                                      'Registrada por inventario web',
                                                                      ${numCla},
                                                                      'OTROS')
`,
    mode: '1',
    asesor: '',
    local: ''
  }

  return this.http.post('https://grupoviamar.com/api/Soap/Soap2.php',option)
}


/*********************************************************************************** */


finalizarReporte(id:any):Observable<any>{
  const option = {
    query: `
          update hist_inv_bateria_distribuidor set estado_inv = 'C', fecha_finaliza = sysdate
            where id_inv = '${id}'
          `,
    mode: '1',
    asesor: '',
    local: ''
  }

  return this.http.post('https://grupoviamar.com/api/Soap/Soap2.php',option)
}



getPosition(): Promise<any> {
  return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resp => {
              resolve({lng: resp.coords.longitude, lat: resp.coords.latitude});
          },
          err => {
              reject(err);
        });
  });
}

}
