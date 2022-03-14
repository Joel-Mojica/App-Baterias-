import { Component, OnInit } from '@angular/core';
import { TraerCertificadoService } from '../traer-certificado.service';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit {

  constructor(private servicioReporte: TraerCertificadoService) { }

  id_inv:number = 0; 

  ngOnInit(): void {
    setInterval(() => {
      this.id_inv = this.servicioReporte.numInvActual;
    }, 500);

    
  }

}
