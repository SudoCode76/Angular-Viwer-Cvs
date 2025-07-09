import { TestBed } from '@angular/core/testing';

import { CsvSharedService } from './csv-shared-service';

describe('CsvSharedService', () => {
  let service: CsvSharedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CsvSharedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
