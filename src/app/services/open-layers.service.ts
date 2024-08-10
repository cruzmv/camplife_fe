import { Injectable } from '@angular/core';
import { parameters } from '../config';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import BingMaps from 'ol/source/BingMaps';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import { Feature, View } from 'ol';
import { LineString, Point } from 'ol/geom';
import Text from 'ol/style/Text';
import Style from 'ol/style/Style';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { fromLonLat, transform } from 'ol/proj';
import Icon from 'ol/style/Icon';
import polyline from '@mapbox/polyline';

@Injectable({
  providedIn: 'root'
})
export class OpenLayersService {
  public map: Map = new Map({
    controls: []
  });

  private googleLayersUrl = [
    {'Roadmap'        : 'http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}'},
    {'Terrain'        : 'http://mt0.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}'},
    {'Altered Roadmap': 'http://mt0.google.com/vt/lyrs=r&hl=en&x={x}&y={y}&z={z}'},
    {'Satellite only' : 'http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}'},
    {'Terrain only'   : 'http://mt0.google.com/vt/lyrs=t&hl=en&x={x}&y={y}&z={z}'},
    {'Hybrid'         : 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}'}
  ];

  private bingLayersImagery = [
    'RoadOnDemand',
    'Aerial',
    'AerialWithLabelsOnDemand',
    'CanvasDark',
    'OrdnanceSurvey'
  ]

  constructor() { }

  /**
   * Create's a new map
   * @returns 
   */
  public newMap() {
    return new Map({
      controls: []
    });
  }

  /**
   * Create's a new view
   * @returns 
   */
  public newView() {
    return new View({ 
      center: [0, 0], 
      zoom: 2 
    });
  }

  /**
   * Set the map layer to be used.
   * @param map 
   * @param company 
   * @param option 
   */
  public setMapLayer(company: string, option: string) {
    this.map.getLayers().clear();
    this.map.addLayer(  company == 'Google' ? this.googleLayer(option) : company == 'Bing' ? this.bingLayer(option) : this.osmLayer() )
  }

  /**
   * Return's the companyes layers bing, google or OSM
   * @param company 
   * @returns 
   */
  public getCompanyLayers(company: string): any {
    if (company == 'Google') {
      return this.googleLayersUrl.map(obj => Object.keys(obj)[0]);
    } else if (company == 'Bing') {
      return this.bingLayersImagery;
    } else if (company == 'OSM') {
      return ['Default'];
    }
  }

  /**
   * Create a google layer
   * @param url String < Roadmap || Terrain || Altered Roadmap || Satellite only || Terrain only || Hybrid >
   * @returns 
   */
  public googleLayer(layerName: string) {
    const layerUrl: any = this.googleLayersUrl.find((x: any) => x[layerName]);
    if (layerUrl) {
      return new TileLayer({
        preload: Infinity,
        source: new XYZ({
            url: layerUrl[layerName]
        })
      });
    } else {
      return new TileLayer();
    }
  }

  /*
   * Create a OSM layer
   * @returns void
  */
  public osmLayer() {
    return new TileLayer({
      preload: Infinity,
      source: new OSM()
    });
  }

  /**
   * Create a bing layer
   * @param imagerySet String <RoadOnDemand || Aerial || AerialWithLabelsOnDemand || CanvasDark || OrdnanceSurvey>
   * @returns 
  */
  public bingLayer(imagerySet: string) {
    return new TileLayer({
      preload: Infinity,
      source: new BingMaps({
        key: parameters.bingKey,
        imagerySet: imagerySet,
      }),
    });
  }

  /**
   * Draw the current geo location point in the map
   * @param coordinates 
   */
  public drawCurrentLocation(coordinates: any){
    const name = 'currentGeoLocation';
    const pointGeometry = new Point(this.coords_3857(coordinates));
    const pointFeature = new Feature({
      geometry: pointGeometry,
      identifier: name,
      name: name,
    });

    const pointStyle = new Style({
      image: new CircleStyle({
        radius: (12),
        fill: new Fill({ color: 'blue' }), // Set the fill color to blue
        stroke: new Stroke({ 
          color: 'rgba(255, 255, 255, 0.7)',  // Set the border color to white with 70% opacity
          width: (10) // Set the border width
        })
      })
    });

    pointFeature.setStyle(pointStyle);

    const vectorSource = new VectorSource({
      features: [pointFeature]
    });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

    this.removeFeature(name);
    this.map.addLayer(vectorLayer);
  }

  public drawRoute(geometry: any) {
    const routeCoordinates = polyline.decode(geometry).map(coords => [coords[1], coords[0]]);
    const routeFeature: any = new Feature({
      geometry: new LineString(routeCoordinates).transform('EPSG:4326', 'EPSG:3857'),
      identifier: 'routeFeature'
    });
    const routeStyle = new Style({
      stroke: new Stroke({
        color: '#1F80E7',
        width: 6
      })
    });
    this.removeVectorLayer("routeFeature");
    routeFeature.setStyle(routeStyle);
    const vectorLayer = this.map.getLayers().getArray().find((layer) => layer instanceof VectorLayer) as VectorLayer<VectorSource>;
    const vectorSource: any = vectorLayer.getSource();
    vectorSource.addFeature(routeFeature);
  }

  /**
   * Add's an icon feature to the map
   * @param coords 
   * @param name 
   */

  public addIconInTheMap(
    coords: any,
    name: string,
    iconPath: string | undefined = 'assets/map-marker.png',
    id: any = undefined,
    text: string | undefined = undefined,
    maxWidth: number = 200, // Maximum width in pixels
    maxHeight: number = 100,  // Maximum height in pixels
    scale: number = 1.5 // Scale factor for the icon
  ) {
    const vectorLayer = this.map.getLayers().getArray().find(
      (layer) => layer instanceof VectorLayer
    ) as VectorLayer<VectorSource>;
  
    if (vectorLayer) {
      const vectorSource = vectorLayer.getSource();
      if (vectorSource) {
        const feature = new Feature({
          geometry: new Point(fromLonLat(coords)),
          name: name,
          id: id ? id : name,
        });
  
        const iconStyle = new Style({
          image: new Icon({
            anchor: [0.5, 1], // Anchor point at the bottom center
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: iconPath, // Provide the path to your pin icon
            scale: scale, // Adjust the scale to make the icon larger
          }),
        });
  
        if (text) {
          const wrappedText = this.wrapText(text, maxWidth, 'bold 12px Arial');
          const lineHeight = 14; // Adjust this value as needed
          const initialOffset = 20; // Adjust this value to place text below the icon
  
          const textStyles = wrappedText.map((line, index) => new Style({
            text: new Text({
              text: line,
              font: 'bold 12px Arial',
              offsetY: initialOffset + index * lineHeight, // Adjust position of each line below the icon
              textAlign: 'center', // Center align the text
              textBaseline: 'top', // Align text from the top
              fill: new Fill({ color: 'rgb(255,255,255)' }),
              stroke: new Stroke({ color: 'rgb(0,0,0)', width: 3 }),
            }),
          }));
  
          // Apply the styles
          feature.setStyle([
            iconStyle, // First the icon
            ...textStyles, // Then the lines of text
          ]);
        } else {
          feature.setStyle(iconStyle);
        }
  
        vectorSource.addFeature(feature);
      }
    }
  }
  
  /**
   * Wraps text to fit within the specified maximum width.
   * 
   * @param text The original text to be wrapped.
   * @param maxWidth The maximum width in pixels for each line.
   * @param font The font used for measuring text width.
   * @returns An array of text lines.
   */
  private wrapText(text: string, maxWidth: number, font: string): string[] {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return [text];
    
    context.font = font;
    const lines: string[] = [];
    const words = text.split(' ');
    let currentLine = '';
  
    words.forEach((word) => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
  
    if (currentLine) lines.push(currentLine);
    
    return lines;
  }
    
  
  
  
  /*
  public addIconInTheMap(coords: any, name: string, iconPath: string | undefined, id: any = undefined, text: string | undefined = undefined){
    if (iconPath == null || iconPath == undefined) {
      iconPath = 'assets/map-marker.png';
    }
    const vectorLayer = this.map.getLayers().getArray().find((layer) => layer instanceof VectorLayer) as VectorLayer<VectorSource>;
    if (vectorLayer) {
      const vectorSource = vectorLayer.getSource();
      if (vectorSource) {
        const feature = new Feature({
          //geometry: new Point(fromLonLat( this.coords_4326(coords))),
          geometry: new Point(fromLonLat( coords )),
          name: name,
          id: id ? id : name
        });

        const iconStyle = new Style({
          image: new Icon({
            anchor: [0.5, 1], // Anchor point at the bottom center
            anchorXUnits: 'fraction',
            anchorYUnits: 'fraction',
            src: iconPath, // Provide the path to your pin icon
            scale: 1.5, // Adjust the scale to make the icon larger
          }),
          text: new Text({
            text: text ? text : '',
            font: 'bold 12px Arial',
            offsetY: 5,
            fill: new Fill({color: 'rgb(255,255,255)'}),
            stroke: new Stroke({color: 'rgb(0,0,0)', width: 5})
          })
        });
        feature.setStyle(iconStyle);
        vectorSource.addFeature(feature);
      }
    }
  }
  */

  /*
   * Remove an feature from the map by it's name 
   * @param name 
   */
  public removeFeature(name: string) {
    const layers = this.map.getLayers().getArray();
    layers.forEach(layer => {
      if (layer instanceof VectorLayer) {
        const source = layer.getSource();
        if (source instanceof VectorSource) {
          const features = source.getFeatures();
          features.forEach(feature => {
            //if (feature.get("identifier") === name) {
            if (feature.values_.name === name) {
              source.removeFeature(feature);
            }
          });
        }
      }
    });
  }

  public removeVectorLayer(identifier: string|undefined = undefined): void {
    // Get all layers in the map
    const layers = this.map.getLayers().getArray();

    // Iterate through the layers and remove the vector layer if it exists
    layers.forEach(layer => {
        if (layer instanceof VectorLayer) {
          const source = layer.getSource();
          if (source instanceof VectorSource) {
            const features = source.getFeatures();
            features.forEach(feature => {
              if (identifier == undefined || feature.get("identifier") === identifier) {
                source.removeFeature(feature);
              }
            });
          }
        }
    });
  }


  /**
   * Zoom at the given coords
   * @param coords 
   * @param zoom 
   */
  public zoomToGeoLocation(coords: any[], zoom: number): void {
    const view = this.map.getView();
    view.setCenter(this.coords_3857(coords));
    view.setZoom(zoom);
  }


  public decodePolyline(polyline: string): number[][] {
    const coordinates: number[][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < polyline.length) {
        let shift = 0;
        let result = 0;
        let byte;

        // Decode latitude
        do {
            byte = polyline.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += deltaLat;

        shift = 0;
        result = 0;

        // Decode longitude
        do {
            byte = polyline.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const deltaLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += deltaLng;

        coordinates.push([lng * 1e-5, lat * 1e-5]);
    }

    return coordinates;
  }

  public calculateDistance(point1: any, point2: any) {
    const lat1 = point1[1];
    const lon1 = point1[0];
    const lat2 = point2[1];
    const lon2 = point2[0];

    const R = 6371; // Radius of the Earth in km

    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;

    return distance * 1000; // Distance in meters
  }


  /*
  public checkOffRoute(currentPosition: any, geometry: string): boolean {
    const routeCoordinates: any[] = this.decodePolyline(geometry);
    const threshold = 25;
    for (const coord of routeCoordinates) {
        const distance = this.calculateDistance(currentPosition, coord);
        if (distance < threshold) {
            return false;
        }
    }
    return true;
  }
  */

  public checkOffRoute(currentPosition: any, geometry: string): boolean {
    const routeCoordinates: any[] = this.decodePolyline(geometry);
    const threshold = 125;
    
    // Find the closest point on the route to the current position
    const closestPoint = this.findClosestPoint(currentPosition, routeCoordinates);
    
    // Calculate the distance from the closest point to the current position
    const distance = this.calculateDistance(currentPosition, closestPoint);
  
    // Return true if the distance exceeds the threshold
    return distance > threshold;
  }
  
  private findClosestPoint(currentPosition: any, routeCoordinates: any[]): any {
    let closestPoint = null;
    let minDistance = Infinity;
  
    for (const coord of routeCoordinates) {
      const distance = this.calculateDistance(currentPosition, coord);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = coord;
      }
    }
  
    return closestPoint;
  }
  






  /**
   * Converts into 3857 coords
   * @param coords 
   * @returns 
   */
  public coords_3857(coords: any) {
    return transform(coords, 'EPSG:4326', 'EPSG:3857');
  }

  /**
   * Converts into 4326 coords
   * @param coords 
   * @returns 
   */
  public coords_4326(coords: any) {
    return transform(coords, 'EPSG:3857', 'EPSG:4326');
  }

}
