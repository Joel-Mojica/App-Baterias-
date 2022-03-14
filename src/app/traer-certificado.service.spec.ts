import { TestBed } from '@angular/core/testing';

import { TraerCertificadoService } from './traer-certificado.service';

describe('TraerCertificadoService', () => {
  let service: TraerCertificadoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TraerCertificadoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
