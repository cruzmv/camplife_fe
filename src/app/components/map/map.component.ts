import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { parameters } from '../../config';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { transform } from 'ol/proj';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import CircleStyle from 'ol/style/Circle'
import BingMaps from 'ol/source/BingMaps';
import OSM from 'ol/source/OSM';
import { HttpClient } from '@angular/common/http';


@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements AfterViewInit {
  @ViewChild('mapElement', { static: false }) mapElement!: ElementRef;
  map: Map = new Map({
    controls: []
  });
  isMapFullScreen: boolean = false;
  selectedLayer: string = 'Bing';
  bingStyleMap: string = 'AerialWithLabelsOnDemand';
  mapZoon: number = 18;
  gpsData: any = [];
  trackingStatus: boolean = true;
  intervalId: any;

  constructor(private httpClient: HttpClient) { }

  ngAfterViewInit(): void {
    this.initializeMap();
    this.centerToCurrentPosition();
  }

  toggleFullScreenMap() {
    this.isMapFullScreen = !this.isMapFullScreen;
    if (this.isMapFullScreen) {
      this.mapElement.nativeElement.classList.add('fullscreen-map');
    } else {
      this.mapElement.nativeElement.classList.remove('fullscreen-map');
    }
  }

  mapSelect(event: any){
    if (event.currentTarget.id == "mapselect"){
      this.selectedLayer = event.currentTarget.value;
    } else if (event.currentTarget.id == "bingselect"){
      this.bingStyleMap = event.currentTarget.value;
    }

    this.updateMapLayer();
    this.centerToCurrentPosition();
  }

  updateTrackingStatus(){
    this.trackingStatus = !this.trackingStatus;
    if (this.trackingStatus){
      this.intervalId = setInterval(() => {
        this.centerToCurrentPosition();
      }, 1000);
      this.centerToCurrentPosition();
    } else {
      clearInterval(this.intervalId)
    }
  }

  //#region privates
  private initializeMap(): void {
    this.map.setTarget(this.mapElement.nativeElement);
    this.updateMapLayer();
    const vectorLayer = new VectorLayer({
      source: new VectorSource(),
    });
    this.map.addLayer(vectorLayer);

    const viewr = new View({
      center: transform([0, 0], 'EPSG:4326', 'EPSG:3857')
    })

    this.map.setView(viewr)

    viewr.on('change:resolution', () => {
      const zoomLevel = viewr.getZoom();
      if (zoomLevel)
        this.mapZoon = zoomLevel
    });

    this.intervalId = setInterval(() => {
      this.centerToCurrentPosition();
    }, 1000);

  }

  private centerToCurrentPosition() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates: any = [position.coords.longitude, position.coords.latitude];
          this.recordGeoPosition(coordinates);
          this.centerAndZoomToLocation(coordinates); // Change zoom level as needed
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    } else {
      console.warn('Geolocation is not supported in this browser.');
    }
  }

  private recordGeoPosition(coordinates: any){
    const dateTime: any = new Date();
    let timeLaps = null;
    if (this.gpsData.length > 0){
      const lastItem = this.gpsData[this.gpsData.length-1]
      timeLaps = dateTime - lastItem.datetime
    }
    const geoData = {
      lat: coordinates[0],
      long: coordinates[1],
      datetime: dateTime,
      elapstime: timeLaps
    }
    this.gpsData.push(geoData)

    this.httpClient.post("http://192.168.1.67:3000/log_geo", geoData).subscribe((response: any) => {
      //console.log(response);
    });

  }


  private centerAndZoomToLocation(coordinates: [number, number]): void {
    const bingCoordinates = this.google2BingPosition(coordinates[1], coordinates[0]);
    this.map.getView().setCenter(bingCoordinates);
    this.map.getView().setZoom(this.mapZoon);

    const pointGeometry = new Point(bingCoordinates);
    const pointFeature = new Feature({
      geometry: pointGeometry
    });

    const pointStyle = new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: '#3083e3' }), // Set the fill color to blue
        stroke: new Stroke({ color: 'white', width: 1 }) // Set the border color and width
      })
    });

    pointFeature.setStyle(pointStyle);

    const vectorSource = new VectorSource({
      features: [pointFeature]
    });
    const vectorLayer = new VectorLayer({
      source: vectorSource
    });
    this.map.addLayer(vectorLayer);


  }

  private google2BingPosition(googleLat: number, googleLong: number) {
    return transform([googleLong, googleLat], 'EPSG:4326', 'EPSG:3857');
  }

  private updateMapLayer() {
    this.map.getLayers().clear(); // Clear existing layers
    const layer = this.selectedLayer === 'Bing' ? this.createBingLayer() : this.createOSMLayer();
    this.map.addLayer(layer); // Add selected layer to map
  }

  private createBingLayer() {
    return new TileLayer({
      source: new BingMaps({
        key: parameters.bingKey,
        imagerySet: this.bingStyleMap,
      }),
    });
  }

  private createOSMLayer() {
    return new TileLayer({
      source: new OSM()
    });
  }
  //#endregion privates

}
