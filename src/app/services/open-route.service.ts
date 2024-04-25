import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { parameters } from '../config';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpenRouteService {
  apiKey = parameters.openRoteKey
  driveMode: any[] = [
    'driving-car',
    'driving-hgv',
    'cycling-regular',
    'cycling-road',
    'cycling-mountain',
    'cycling-electric',
    'foot-walk',
    'foot-hiking',
    'wheel-chair'
  ]

  avoidDrive = [
    'tollways',
    'highways',
    'ferries'
  ]

  vehicleType = [
    'unknown',
    'hgv',
    'bus',
    'agricultural',
    'delivery',
    'forestry',
    'goods'
  ]

  constructor(private httpClient: HttpClient) { }

  /**
   * Get the address and properties around of provided lat/long
   * @param lat 
   * @param long 
   * @returns 
   */
  public reverseGeoCode(lat: number, long: number):  Observable<any> {
    const url = 'https://api.openrouteservice.org/geocode/reverse';
    const queryParams = {
      api_key: this.apiKey,
      'point.lon': long,
      'point.lat': lat
    }
    return this.httpClient.get(url, { params: queryParams });    
  }

  /**
   * Get a route from the info provided
   * @param coords 
   * @param driveMode 
   * @param avoidFeatures 
   * @returns 
   */
  public drawRote(coords: any[], driveMode: string, avoidFeatures: string[], vehicleType: string): Observable<any> {
    const postUrl = `https://api.openrouteservice.org/v2/directions/${driveMode}/json`;
    const header = {
      Authorization: this.apiKey
    };
    const options: any = {
      "avoid_features": avoidFeatures,
    }
    const body = {
      "coordinates":coords,
      "options": options
    }
    return this.httpClient.post(postUrl, body, {headers: header} );
  }


}
