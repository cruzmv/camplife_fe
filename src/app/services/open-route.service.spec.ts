import { TestBed } from '@angular/core/testing';

import { OpenRouteService } from './open-route.service';

describe('OpenRouteService', () => {
  let service: OpenRouteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpenRouteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
