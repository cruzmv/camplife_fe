import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import BingMaps from 'ol/source/BingMaps';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { transform } from 'ol/proj';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import CircleStyle from 'ol/style/Circle'

@Component({
  selector: 'app-maps2',
  templateUrl: './maps2.component.html',
  styleUrl: './maps2.component.scss'
})
export class Maps2Component implements AfterViewInit{
  @ViewChild('mapElement', { static: false }) mapElement!: ElementRef;
  map: Map = new Map(); // Initialize here

  ngAfterViewInit(): void {
    this.initializeMap();

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates: any = [position.coords.longitude, position.coords.latitude];
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

  private initializeMap(): void {
    this.map.setTarget(this.mapElement.nativeElement);

    this.map.addLayer(
      new TileLayer({
        source: new BingMaps({
          key: 'Ak58h4YF2UZVGY4CyQqucF-NAFGyBUCwngZmRoZiBKqmWDPjSrTGvFDfOqgtAvTw',
          imagerySet: 'AerialWithLabelsOnDemand',
        }),
      })
    )

    const vectorLayer = new VectorLayer({
      source: new VectorSource(),
    });
    this.map.addLayer(vectorLayer);

    this.map.setView(
      new View({
        center: [0, 0],
        zoom: 5
      })
    )

    //this.map.on('click', (event) => this.onMapClick(event));
  }





  private centerAndZoomToLocation(coordinates: [number, number]): void {
    const bingCoordinates = this.google2BingPosition(coordinates[1], coordinates[0]);
    this.map.getView().setCenter(bingCoordinates);
    this.map.getView().setZoom(16);

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




}
