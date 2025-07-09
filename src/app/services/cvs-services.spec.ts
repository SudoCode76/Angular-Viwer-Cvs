import { TestBed } from '@angular/core/testing';

import { CvsServices } from './cvs-services';

describe('CvsServices', () => {
  let service: CvsServices;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CvsServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
