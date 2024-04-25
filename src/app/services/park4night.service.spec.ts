import { TestBed } from '@angular/core/testing';

import { Park4nightService } from './park4night.service';

describe('Park4nightService', () => {
  let service: Park4nightService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Park4nightService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
