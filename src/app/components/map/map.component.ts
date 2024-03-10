//#region imports
import { AfterViewInit, Component, ElementRef, HostListener, Inject, TemplateRef, ViewChild } from '@angular/core';
import { parameters } from '../../config';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { fromLonLat, transform } from 'ol/proj';
import Point from 'ol/geom/Point';
import { Feature, Overlay } from 'ol';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import CircleStyle from 'ol/style/Circle'
import BingMaps from 'ol/source/BingMaps';
import OSM from 'ol/source/OSM';
import { HttpClient } from '@angular/common/http';
import XYZ from 'ol/source/XYZ';
import { DOCUMENT } from '@angular/common';
import Icon from 'ol/style/Icon';
import Text from 'ol/style/Text';
import { NbWindowService } from '@nebular/theme';
import LineString from 'ol/geom/LineString';
import * as polyline from '@mapbox/polyline';
import { v4 as uuidv4 } from 'uuid';
import { Geolocation } from 'ol';
//#endregion imports

interface pointOptions {
  color: string,
  name: string
}

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements AfterViewInit {

  //#region declares
  @ViewChild('mapElement', { static: false }) mapElement!: ElementRef;
  @ViewChild('debugText') debugText!: ElementRef;
  @ViewChild('placeWindow', { read: TemplateRef }) placeWindow!: TemplateRef<HTMLElement>;
  @ViewChild('photoView') photoView!: ElementRef;
  @ViewChild('roteFrom') roteFrom!: ElementRef;
  @ViewChild('roteTo') roteTo!: ElementRef;
  @ViewChild('driveMode') driveMode!: ElementRef;
  @ViewChild('avoideToll') avoideToll!: ElementRef;
  @ViewChild('avoideHighway') avoideHighway!: ElementRef;
  @ViewChild('avoideFerrie') avoideFerrie!: ElementRef;
  @ViewChild('vehicleType') vehicleType!: ElementRef;
  @ViewChild('roteZoom') roteZoom!: ElementRef;
  @ViewChild('memoryStatus') memoryStatus!: ElementRef;
  @ViewChild('iconWiFi') iconWiFi!: ElementRef;
  @ViewChild('iconGps') iconGps!: ElementRef;
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;

  map: Map = new Map({
    controls: []
  });
  isMapFullScreen: boolean = false;
  selectedLayer: string = 'Google';
  bingStyleMap: string = 'AerialWithLabelsOnDemand';
  googleStyleMap: string = 'http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}';
  mapZoon: number = 16;
  gpsData: any = [];
  trackingStatus: boolean = false;
  intervalId: any;
  debugWindow: boolean = true;
  routeToolbar: boolean = false;
  places: any[] = [];
  place: any;
  tooltipOverlay!: Overlay;
  routeFrom: any;
  routeTo: any;
  apiEndPoint = 'http://cruzmv.ddns.net:3000/';
  watchGeoId: any;
  myRote: any = {};
  radioPlaying: boolean = false;
  gpsStatus: boolean = true;
  location_icons = [
    { category: 'Fuel Station', src: 'assets/gas-pump.png' },
    { category: 'Showers', src: 'assets/shower.png' },
    { category: 'Sanitation Dump Station', src: 'assets/undercarriage.png' },
    { category: 'Wifi', src: 'assets/wifi-signal.png' },
    { category: 'Established Campground', src: 'assets/CAMPING.png' },
    { category: 'Wild Camping', src: 'assets/tent.png' },
    { category: 'Informal Campsite', src: 'assets/lamp.png' },
    { category: 'Water', src: 'assets/faucet.png' },
    { category: 'Tourist Attraction', src: 'assets/travel-and-tourism.png' },
    { category: 'PARKING LOT DAY/NIGHT', src: 'assets/PARKING_LOT_DAY_NIGHT.png' },
    { category: 'EXTRA SERVICES', src: 'assets/EXTRA_SERVICES.png' },
    { category: 'CAMPING', src: 'assets/CAMPING.png' },
    { category: 'PRIVATE CAR PARK FOR CAMPERS', src: 'assets/PAYING_MOTORHOME_AREA.png' },
    { category: 'PAYING MOTORHOME AREA', src: 'assets/PAYING_MOTORHOME_AREA.png' },
    { category: 'ON THE FARM', src: 'assets/ON_THE_FARM.png' },
    { category: 'SURROUNDED BY NATURE', src: 'assets/SURROUNDED_BY_NATURE.png' },
    { category: 'DAILY PARKING LOT ONLY', src: 'assets/DAILY_PARKING_LOT_ONLY.png' },  //'assets/location.png'  //'assets/DAILY_PARKING_LOT_ONLY.png'
    { category: 'PICNIC AREA', src: 'assets/PICNIC_AREA.png' },
    { category: 'OFF-ROAD', src: 'assets/jeep.png' },
    { category: 'REST AREA', src: 'assets/restaurant.png' },
    { category: 'HOMESTAYS ACCOMMODATION', src: 'assets/homestay.png' },
    { category: 'CRUISER', src: 'assets/dick.png' },
  ];
  //#endregion declares

  constructor(private httpClient: HttpClient,
              @Inject(DOCUMENT) private document: any,
              private windowService: NbWindowService) { }

  //#region publics
  @HostListener('window:offline', ['$event'])
  onOffline(event: any) {
    this.logDebug('You are offline!');
  }

  @HostListener('window:online', ['$event'])
  onOnline(event: any) {
    this.logDebug('You are online!');
  }

  ngAfterViewInit(): void {
    this.photoView.nativeElement.hidden = true;
    this.initializeMap();
    //this.centerToCurrentPosition();

    const places = localStorage.getItem('places');
    if (places != null){
      this.places = JSON.parse(places)
      setTimeout(() => {
        this.addMarkers();
      }, 500);
    }

    const event = {
      currentTarget: {
        id: "googleselect",
        value: "Hybrid"
      }
    }
    this.mapSelect(event);

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', this.handleOrientation.bind(this), true);
      this.logDebug(`window.DeviceOrientationEvent exists`);
    } else {
      this.logDebug('Device orientation not supported');
    }

    setInterval( ()=>{
      if (window.performance && (window.performance as any).memory) {
        this.memoryStatus.nativeElement.innerHTML = `jsHeapSizeLimit: ${ (window.performance as any).memory.jsHeapSizeLimit.toLocaleString('en-US') } <br/>
                                                     totalJSHeapSize: ${ (window.performance as any).memory.totalJSHeapSize.toLocaleString('en-US') } <br/>
                                                     usedJSHeapSize: ${ (window.performance as any).memory.usedJSHeapSize.toLocaleString('en-US') }`
        this.iconWiFi.nativeElement.src=`assets/${navigator.onLine ? 'wifi-outline' : 'wifi-off-outline'}.svg`;
        this.iconGps.nativeElement.src=`assets/${this.gpsStatus ? 'compass-outline' : 'compass-off-outline'}.svg`;
      }
    }, 5000)

    // Fetch the off line icons because when internet is off, it will not manage to fetch, so fetch it in advanced
    fetch('assets/wifi-off-outline.svg');

    // Request screen aways awake
    navigator.wakeLock.request('screen').then(result =>{
      this.logDebug(`wakeLock ${result.released}`);
    })


    // Get the Geolocation API
    const geolocation = new Geolocation({
      trackingOptions: {
        enableHighAccuracy: true // Enable high accuracy tracking
      },
      projection: this.map.getView().getProjection() // Use map projection
    });

    // Continuously update the map rotation based on device heading
    geolocation.on('change', () => {
      const heading = geolocation.getHeading(); // Get device heading
      if (heading !== undefined) {
        const rotation = (360 - heading) * Math.PI / 180; // Convert heading to radians
        this.map.getView().setRotation(rotation); // Set map rotation
      }
    });

    // Start tracking the device's position
    geolocation.setTracking(true);

  }

  playRadio(){
    this.radioPlaying = !this.radioPlaying;
    if (this.radioPlaying) {
      this.audioPlayer.nativeElement.play();
    } else {
      this.audioPlayer.nativeElement.pause();
    }
  }

  toggleFullScreenMap() {
    this.isMapFullScreen = !this.isMapFullScreen;
    if (this.isMapFullScreen) {
      this.mapElement.nativeElement.classList.add('fullscreen-map');
      if (this.document.documentElement.requestFullscreen){
        this.document.documentElement.requestFullscreen();
      }

    } else {
      this.mapElement.nativeElement.classList.remove('fullscreen-map');
      if (this.document.documentElement.exitFullscreen){
        this.document.documentElement.exitFullscreen();
      }

    }
  }

  mapSelect(event: any){
    if (event.currentTarget.id == "mapselect"){
      this.selectedLayer = event.currentTarget.value;
    } else if (event.currentTarget.id == "bingselect"){
      this.bingStyleMap = event.currentTarget.value;
    } else if (event.currentTarget.id == "googleselect"){
      let googleMapUrl = 'http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}';
      if (event.currentTarget.value == 'Roadmap'){
        googleMapUrl = 'http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}';
      } else if (event.currentTarget.value == 'Terrain') {
        googleMapUrl = 'http://mt0.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}';
      } else if (event.currentTarget.value == 'Altered roadmap') {
        googleMapUrl = 'http://mt0.google.com/vt/lyrs=r&hl=en&x={x}&y={y}&z={z}';
      } else if (event.currentTarget.value == 'Satellite only') {
        googleMapUrl = 'http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}';
      } else if (event.currentTarget.value == 'Terrain only') {
        googleMapUrl = 'http://mt0.google.com/vt/lyrs=t&hl=en&x={x}&y={y}&z={z}';
      } else if (event.currentTarget.value == 'Hybrid') {
        googleMapUrl = 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}';
      }
      this.googleStyleMap = googleMapUrl;
    }

    this.updateMapLayer();

    setTimeout(() => {
        this.addMarkers();
    }, 1000);

  }

  updateTrackingStatus(){
    this.trackingStatus = !this.trackingStatus;
    if (this.trackingStatus){
      this.startWatchingPosition();
    } else {
      this.stopWatchingPosition();
    }
  }

  windowDebug(){
    this.debugWindow = !this.debugWindow;
  }

  fetchCruiser(latFromPar: any = undefined,longFromPar: any = undefined){
    let centerCoordinates: any[] = [];
    if (latFromPar != undefined && longFromPar != undefined ){
      centerCoordinates[0] = latFromPar;
      centerCoordinates[1] = longFromPar;
    } else {
      centerCoordinates = this.map.getView().getCenter() as any;
    }
    const [long, lat] = this.bing2GooglePosition(centerCoordinates[0], centerCoordinates[1]);
    this.logDebug(`Cruiser at coordinates: ${JSON.stringify([long, lat])}`);

    const apiUrl = `${this.apiEndPoint}get_cruiser_list`;
    const queryParams = { lat: lat.toString(), long: long.toString() };

    this.httpClient.get(apiUrl, { params: queryParams }).subscribe((response: any) => {

      response.data.forEach((place:any) => {
        this.places.push({
          place_category: "CRUISER",
          place_distance_km: place.place_distance_km,
          place_id: uuidv4(),
          place_latitude: place.latitude,
          place_longitude: place.longitude,
          place_name: `${place.title_place} ${place.place_place}`,
          place_resume: place.description_place,
          is_center: place.is_center,
          parking_price: "CRUISER",
          service_price: "",
          place_link: place.more_place
        })
      });

      localStorage.setItem("places",JSON.stringify(this.places));
      this.logDebug(`${response.data.length} fetched, total: ${response.data.length}`);
      this.addMarkers();
    },
      (error) => {
        this.logDebug(`Error fetching cruiser places: ${JSON.stringify(error)}`);
      }
    );


  }

  fetchPlaces(latFromPar: any = undefined,longFromPar: any = undefined){
    let centerCoordinates: any[] = [];
    if (latFromPar != undefined && longFromPar != undefined ){
      centerCoordinates[0] = latFromPar;
      centerCoordinates[1] = longFromPar;
    } else {
      centerCoordinates = this.map.getView().getCenter() as any;
    }
    const [long, lat] = this.bing2GooglePosition(centerCoordinates[0], centerCoordinates[1]);
    this.logDebug(`Places at coordinates: ${JSON.stringify([long, lat])}`);

    const apiUrl = `${this.apiEndPoint}get_place_list`;
    const queryParams = { lat: lat.toString(), long: long.toString() };

    this.httpClient.get(apiUrl, { params: queryParams }).subscribe((response: any) => {
      this.places = this.places.concat(response.data);
      localStorage.setItem("places",JSON.stringify(this.places));
      this.logDebug(`${response.data.length} fetched, total: ${this.places.length}`);
      this.addMarkers();
    },
      (error) => {
        this.logDebug(`Error fetching places: ${JSON.stringify(error)}`);
      }
    );
  }

  updatePlaces(){
    const centerCoordinates: any = this.map.getView().getCenter();
    this.logDebug(`Bing coordinates: ${JSON.stringify(centerCoordinates)}`);
    this.updatePlacesWithCoordinate(centerCoordinates[0],centerCoordinates[1])
  }

  openFullImage(url: any){
    const index = this.place.photos.findIndex((x: any) => x.link_large == url);
    if (index >= 0){
      this.photoView.nativeElement.children[1].children.main_foto.src = this.place.photos[index].link_large;


      const thumbPhotoDiv = this.photoView.nativeElement.querySelector('.thumb_photo');
      thumbPhotoDiv.innerHTML = '';
      this.place.photos.forEach((photo: any) => {
        const thumbImage = document.createElement('img');
        thumbImage.src = photo.link_thumb;
        thumbImage.style.maxWidth = "150px";
        thumbImage.style.maxHeight = "150px";

        const thumbPhotoItem = document.createElement('div');
        thumbPhotoItem.style.cursor = "pointer";

        thumbImage.addEventListener('click', () => {
          this.photoView.nativeElement.children[1].children.main_foto.src = photo.link_thumb;
        });

        thumbPhotoItem.appendChild(thumbImage);

        thumbPhotoDiv.appendChild(thumbPhotoItem);
      });

      this.photoView.nativeElement.hidden = false;
    }
  }

  closePhotos(){
    this.photoView.nativeElement.hidden = true;
  }

  cleanMap() {
    this.clearVectorLayer();
  }

  cleanCache(){
    localStorage.removeItem('places');
    this.cleanMap();
  }

  startDrive() {
    this.routeToolbar = !this.routeToolbar;
    this.map.getView().setZoom(this.roteZoom.nativeElement.value);
    this.updateTrackingStatus();
  }

  cacheRote(){

    if (this.selectedLayer !== 'Google'){
      alert('Only Google');
      return;
    }

    // Define the bounding box coordinates
    const boundingBox = this.myRote.rote.bbox;

    // Define the zoom level
    const zoomLevel = Math.round(this.roteZoom.nativeElement.value);

    // Define the number of steps to divide the bounding box
    const numSteps = 10; // You can adjust this value according to your requirements

    // Calculate latitude and longitude step increments
    const latStep = (boundingBox[3] - boundingBox[1]) / numSteps;
    const lngStep = (boundingBox[2] - boundingBox[0]) / numSteps;
    const latlong: any = [];

    // Iterate through the bounding box and calculate coordinates
    for (let lat = boundingBox[1]; lat <= boundingBox[3]; lat += latStep) {
      for (let lng = boundingBox[0]; lng <= boundingBox[2]; lng += lngStep) {
        const tileUrl = this.getMapTile(lat, lng, zoomLevel);
        console.log(tileUrl);
        fetch(tileUrl);
      }
    }
  }

  async drawRote() {
    const geoFrom: [number,number] = this.roteFrom.nativeElement.value.split(',').map(Number);
    const geoTo: [number,number] = this.roteTo.nativeElement.value.split(',').map(Number);
    const driveMode = this.driveMode.nativeElement.value;
    const avoideToll = this.avoideToll.nativeElement.checked;
    const avoideHighway = this.avoideHighway.nativeElement.checked;
    const avoideFerrie = this.avoideFerrie.nativeElement.checked;
    const vehicleType = this.vehicleType.nativeElement.value;
    const roteZoom = this.roteZoom.nativeElement.value;

    this.drawRoteOption([geoFrom,geoTo], driveMode, {toll: avoideToll, highway: avoideHighway, ferrie: avoideFerrie},vehicleType, roteZoom);

  }

  async addRoute() {

    this.routeToolbar = !this.routeToolbar;
    const from_geometry: any = await this.locateFeature("dotFeature");
    const from_coordinates = from_geometry.getCoordinates();
    const from_coordinates_google: any = this.bing2GooglePosition(from_coordinates[0],from_coordinates[1]);

    const to_geometry: any = await this.locateFeature("pinpoint");
    const to_coordinates = to_geometry.getCoordinates();
    const to_coordinates_google: any = this.bing2GooglePosition(to_coordinates[0],to_coordinates[1]);

    setTimeout(() => {

      this.roteFrom.nativeElement.value = from_coordinates_google;
      this.roteTo.nativeElement.value = to_coordinates_google;

    }, 500);


    this.calculateRoute(from_coordinates_google,to_coordinates_google);

    this.routeFrom = undefined;
    this.routeTo = undefined;




    // const from_geometry: any = await this.locateFeature("dotFeature");
    // const from_coordinates = from_geometry.getCoordinates();
    // const from_coordinates_google: any = this.bing2GooglePosition(from_coordinates[0],from_coordinates[1]);

    //await this.cacheMapTiles(from_coordinates_google[0], from_coordinates_google[1], 0.02);
    //this.cacheMapTiles(from_coordinates_google[0], from_coordinates_google[1], 16);
//    this.cacheMapTiles(48.858, 2.295, 12);
    //this.cacheMapTiles(40.131376696001155 , -7.503030225953948, 16);

    // const tileUrl = this.getMapTile(from_coordinates_google[1],from_coordinates_google[0], this.mapZoon);
    // console.log(tileUrl);

    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.goto('https://www.gays-cruising.com/en/portugal');
    // await page.waitForFunction('typeof gcMaps !== "undefined"');
    // const latlng = await page.evaluate(`gcMaps.parametros.markers[0][4]._latlng`);


    /*
    const from_geometry: any = await this.locateFeature("dotFeature");
    const from_coordinates = from_geometry.getCoordinates();
    const from_coordinates_google: any = this.bing2GooglePosition(from_coordinates[0],from_coordinates[1]);

    const to_geometry: any = await this.locateFeature("pinpoint");
    const to_coordinates = to_geometry.getCoordinates();
    const to_coordinates_google: any = this.bing2GooglePosition(to_coordinates[0],to_coordinates[1]);


    this.calculateRoute(from_coordinates_google,to_coordinates_google);
    //this.calculateRoute(this.routeFrom,this.routeTo);

    this.routeFrom = undefined;
    this.routeTo = undefined;
    */
  }
  //#endregion publics


  //#region privates
  private initializeMap(): void {
    this.map.setTarget(this.mapElement.nativeElement);
    this.updateMapLayer();

    // const vectorLayer = new VectorLayer({
    //   source: new VectorSource(),
    // });

    this.map.addLayer(this.createBingLayer());

    const viewr = new View({
      center: transform([0, 0], 'EPSG:4326', 'EPSG:3857')
    })

    this.map.setView(viewr)

    viewr.on('change:resolution', () => {
      const zoomLevel = viewr.getZoom();
      if (zoomLevel){
        this.mapZoon = zoomLevel
        this.logDebug(`zoom: ${this.mapZoon}`);
      }
    });

    setTimeout(() => {
      const options = {
        enableHighAccuracy: true,
        timeout: 1000,  // Timeout in milliseconds
        maximumAge: 0   // No maximum age for cached positions
      };

      const watchGeoId = navigator.geolocation.watchPosition(
        (position) => {
          const coordinates: any = [position.coords.longitude, position.coords.latitude];
          this.recordGeoPosition(coordinates);
          this.centerAndZoomToLocation(coordinates); // Change zoom level as needed
          navigator.geolocation.clearWatch(watchGeoId);
          this.gpsStatus = true;
        },
        (error) => {
          this.logDebug(`GetPosition Error: ${JSON.stringify(error)}`);
          this.gpsStatus = false;
        },
        options
      );
    }, 1000);

    // Create and add an overlay to the map for displaying tooltips
    this.tooltipOverlay = new Overlay({
      element: document.createElement('div'),
      offset: [10, 0], // Adjust the offset as needed
      positioning: 'bottom-left',
    });
    this.map.addOverlay(this.tooltipOverlay);

    // On mouse over
    this.map.on('pointermove', (event: any) => {
      const pixel = this.map.getEventPixel(event.originalEvent);
      const hit = this.map.hasFeatureAtPixel(pixel);

      this.tooltipOverlay.getElement()!.style.display = 'none';
      if (hit) {
        // Get the feature at the pixel
        const feature = this.map.forEachFeatureAtPixel(pixel, (feature) => feature);
        if (feature && feature.getProperties()['name']) {
          this.logDebug(`mouseon: ${feature.getProperties()['name']}`);

          const place = this.places.find((p) => p.place_id === feature.getProperties()['id']);
          let tooltipContent = '';
          if (place){

            if (place.parking_price) {
              tooltipContent += " " + place.parking_price;
            }

            if (place.service_price) {
              tooltipContent += " " + place.service_price
            }
          }

          this.tooltipOverlay.getElement()!.innerHTML = tooltipContent;
          this.tooltipOverlay.getElement()!.style.fontSize = '18px';
          this.tooltipOverlay.getElement()!.style.color = 'black';
          this.tooltipOverlay.getElement()!.style.fontWeight = 'bold';
          this.tooltipOverlay.getElement()!.style.backgroundColor = 'gray';
          this.tooltipOverlay.setPosition(event.coordinate);

          // Show the tooltip overlay
          this.tooltipOverlay.getElement()!.style.display = 'block';

        } else {
          // Hide the tooltip overlay
          this.tooltipOverlay.getElement()!.style.display = 'none';
        }
      }

      // Set the cursor
      this.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    // Get the clicked features at the clicked pixel
    this.map.on('click', (event: any) => {
      this.photoView.nativeElement.hidden = true;
      const features = this.map.getFeaturesAtPixel(event.pixel);
      if (features && features.length > 0) {
        // Handle the click on the features (icons)
        const clickedFeature = features[0];
        this.place = this.places.find(p => p.place_id === clickedFeature.get('id'));

        if (this.place) {

          this.windowService.open(
            this.placeWindow,
            //{ title: this.place.place_name, hasBackdrop: false, closeOnEsc: false },
            { title: this.place.place_name, hasBackdrop: true },
          );

        }
      } else {
        this.clearVectorLayer("pinpoint");
        this.drawPoint(event.coordinate,{name: "pinpoint", color: "red"});
      }

      // const coordinates: any = this.map.getView().getCenter();
      // this.logDebug(`bing: ${JSON.stringify(coordinates)}`);
      // this.logDebug(`google: ${JSON.stringify(this.bing2GooglePosition(coordinates[0],coordinates[1]))}`);
      // this.logDebug(`coords: ${transform(coordinates, 'EPSG:3857', 'EPSG:4326')}`)
      const coordinates: any = this.bing2GooglePosition(event.coordinate[0],event.coordinate[1]);
      if (this.roteTo !== undefined){
        this.roteTo.nativeElement.value = coordinates;
      }

      this.logDebug(`bing: ${ event.coordinate  }`);
      this.logDebug(`google: ${ coordinates  }`);


      if (this.routeFrom == undefined){
        this.routeFrom = coordinates
        this.routeTo = undefined
      } else {
        this.routeTo = coordinates
      }

    });

  }

  private startWatchingPosition() {
    if ('geolocation' in navigator) {
      const options = {
        enableHighAccuracy: true,
        timeout: 1000,  // Timeout in milliseconds
        maximumAge: 0   // No maximum age for cached positions
      };

      this.watchGeoId = navigator.geolocation.watchPosition(
        (position) => {
          const coordinates: any = [position.coords.longitude, position.coords.latitude];
          this.recordGeoPosition(coordinates);
          this.centerAndZoomToLocation(coordinates); // Change zoom level as needed
          this.gpsStatus = true;
        },
        (error) => {
          this.logDebug(`GetPosition Error: ${JSON.stringify(error)}`);
          this.gpsStatus = false;
        },
        options
      );
    } else {
      this.logDebug('Geolocation is not supported in this browser.');
    }
  }

  private stopWatchingPosition() {
    if (this.watchGeoId) {
      navigator.geolocation.clearWatch(this.watchGeoId);
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

    this.logDebug(JSON.stringify(geoData));
    this.httpClient.post(`${this.apiEndPoint}log_geo`, geoData).subscribe((response: any) => {
      //this.logDebug(JSON.stringify(response));
    },error => {
      this.logDebug(JSON.stringify(error));
    });

  }

  private logDebug(value: string){
    if (this.debugWindow != undefined){
      const now = new Date();
      const datetimeString = String(now.getFullYear())+String(now.getMonth()+1).padStart(2, '0')+String(now.getDate()).padStart(2, '0')+'T'+String(now.getHours()).padStart(2, '0')+String(now.getMinutes()).padStart(2, '0')+String(now.getSeconds()).padStart(2, '0')
      const logString = `[${datetimeString}] ${value} \n`;

      try {
        this.debugText.nativeElement.value += logString;
        this.debugText.nativeElement.scrollTop = this.debugText.nativeElement.scrollHeight;
        console.log(logString);
      } catch (error) {

      }
    }
  }

  private centerAndZoomToLocation(coordinates: [number, number]): void {
    const bingCoordinates = this.google2BingPosition(coordinates[1], coordinates[0]);
    this.map.getView().setCenter(bingCoordinates);
    this.map.getView().setZoom(this.mapZoon);
    this.clearVectorLayer("dotFeature");
    this.drawPoint(bingCoordinates,{name: "dotFeature", color: "#3083e3"});
  }

  private clearVectorLayer(identifier: string|undefined = undefined): void {
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

  private async locateFeature(name: string){
    let geometry = undefined;
    const layers = this.map.getLayers().getArray();
    await layers.forEach(async layer => {
      if (layer instanceof VectorLayer) {
        const source = layer.getSource();
        if (source instanceof VectorSource) {
          const features = source.getFeatures();
          await features.forEach(feature => {
            if (name == undefined || feature.get("identifier") === name) {
                geometry = feature.getGeometry();
            }
          });
        }
      }
    });
    return geometry;
  }

  private bing2GooglePosition(bingLat: number, bingLong: number) {
    return transform([bingLat, bingLong], 'EPSG:3857', 'EPSG:4326');
  }

  private google2BingPosition(googleLat: number, googleLong: number) {
    return transform([googleLong, googleLat], 'EPSG:4326', 'EPSG:3857');
  }

  private updateMapLayer() {
    this.map.getLayers().clear(); // Clear existing layers
    let layer: any = null;
    let vectorSource: VectorSource | null = null;

    if (this.selectedLayer === 'Bing'){
        // Create BingMaps source
        layer = this.createBingLayer();
        vectorSource = new VectorSource();
    } else if(this.selectedLayer == 'OSM') {
        // Create OSM source
        layer = this.createOSMLayer();
        vectorSource = new VectorSource();
    } else if (this.selectedLayer == 'Google'){
        // Create Google source
        layer = new TileLayer({
            preload: Infinity,
            source: new XYZ({
                url: this.googleStyleMap
            })
        });
        vectorSource = new VectorSource();
    }

    if (vectorSource) {
        // Create VectorLayer with the vectorSource
        const vectorLayer = new VectorLayer({
            source: vectorSource
        });

        this.map.addLayer(layer); // Add the selected layer to the map
        this.map.addLayer(vectorLayer); // Add the VectorLayer to the map
    } else {
        console.error('Failed to create VectorLayer: No vector source.');
    }
  }

  private createBingLayer() {
    return new TileLayer({
      preload: Infinity,
      source: new BingMaps({
        key: parameters.bingKey,
        imagerySet: this.bingStyleMap,
      }),
    });
  }

  private createOSMLayer() {
    return new TileLayer({
      preload: Infinity,
      source: new OSM()
    });
  }

  private addMarkers(): void {
    const vectorLayer = this.map.getLayers().getArray().find((layer) => layer instanceof VectorLayer) as VectorLayer<VectorSource>;
    //const vectores = this.map.getLayers().getArray().filter((layer) => layer instanceof VectorLayer);
    //const vectorLayer = vectores[0] as VectorLayer<VectorSource>;

    if (vectorLayer) {
      const vectorSource = vectorLayer.getSource();

      if (vectorSource) {
        // Define a custom style for the features (larger point with a pin-like symbol)

        this.places.forEach((place) => {
          const feature = new Feature({
            geometry: new Point(fromLonLat([place.place_longitude, place.place_latitude])),
            name: place.place_name,
            id: place.place_id
          });

          let icon_src = 'assets/maps-and-flags.png';
          if (place.place_category) {
            const category_icon = this.location_icons.find(x => x.category == place.place_category);
            if (category_icon) {
              icon_src = category_icon.src;
            }
          }

          // Apply the custom style to the feature
          const iconStyle = new Style({
            image: new Icon({
              anchor: [0.5, 1], // Anchor point at the bottom center
              anchorXUnits: 'fraction',
              anchorYUnits: 'fraction',
              src: icon_src, // Provide the path to your pin icon
              scale: 1.5, // Adjust the scale to make the icon larger
            }),
            text: new Text({
              text: `${place.parking_price ? place.parking_price : ''}|${place.service_price ? place.service_price: ''}${place.parking_price || place.service_price ? '' : place.place_name }`,
              font: 'bold 12px Arial',
              offsetY: 5,
              fill: new Fill({color: 'rgb(0,0,0)'}),
              stroke: new Stroke({color: 'rgb(255,255,255)', width: 1})
            })

          });

          feature.setStyle(iconStyle);
          vectorSource.addFeature(feature);


          // Check if the location is the center
          if (place.is_center) {
            // Convert's the coordinate to bing patter
            //const bingCoordinates = transform([place.place_longitude, place.place_latitude],'EPSG:4326','EPSG:3857');
            const bingCoordinates = this.google2BingPosition(place.place_latitude, place.place_longitude);

            // Zoom to the center location
            this.map.getView().setCenter(bingCoordinates);
            this.map.getView().setZoom(10);

          }
        });
      } else {
        this.logDebug('VectorSource is undefined.');
      }
    } else {
      this.logDebug('VectorLayer not found in map layers.');
    }
  }

  private updatePlacesWithCoordinate(bingLat: number, bingLong: number): void {
    //const [long, lat] = transform([bingLat, bingLong],'EPSG:3857','EPSG:4326');
    const [long, lat] = this.bing2GooglePosition(bingLat, bingLong);
    const apiUrl = `${this.apiEndPoint}update_place_coordinate`;
    const requestBody = { lat: lat, long: long };

    this.httpClient.post(apiUrl, requestBody).subscribe((response: any) => {
      this.logDebug(`Finished update region ${JSON.stringify(requestBody)}`);
      this.fetchPlaces(bingLat, bingLong);
    },
    error=>{
      this.logDebug(`updatePlacesWithCoordinate ${JSON.stringify(error)}`)
    });
  }

  private getMapTile(latitude: number, longitude: number, zoom: number) {
    const baseUrl = this.googleStyleMap;   //'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}';
    const z = Math.round(zoom);
    const lon2tile = (lon:any,zoom:any) => (Math.floor((lon+180)/360*Math.pow(2,zoom)));
    const lat2tile = (lat:any,zoom:any) => (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
    let x = lon2tile(longitude, z),
        y = lat2tile(latitude, z);

    return baseUrl.replace('{z}', z.toString())
                  .replace('{x}', x.toString())
                  .replace('{y}', y.toString())
  }


  private handleOrientation(event: DeviceOrientationEvent) {
    if (event.alpha !== null) {
      const compassHeading = event.alpha;
      const bearingToNorth = 360 - compassHeading;

      this.logDebug(`North: ${bearingToNorth}`)

      //const map = document.getElementById('map') as any;
      //map.setRotation(bearingToNorth);
      this.map.getView().setRotation(bearingToNorth);
    } else {
      this.logDebug(`no event.alpha`);
    }
  }

  private drawRoteOption(geoRote: [[number,number],[number,number]], driveMode: string, avoide: any,vehicleType: string, roteZoom: string) {

    const postUrl = `https://api.openrouteservice.org/v2/directions/${driveMode}`;
    const header = {
      Authorization: "5b3ce3597851110001cf6248822f7a9d64924aa5bb3fb8ace99891d2"
    };

    const avoidFeatures = []
    if (avoide.toll)
      avoidFeatures.push("tollways");
    if (avoide.highway)
      avoidFeatures.push("highways");
    if (avoide.ferrie)
      avoidFeatures.push("ferries");

    const options: any = {
      "avoid_features": avoidFeatures,
    }
    if (vehicleType !== 'unknown'){
      options.vehicle_type = vehicleType
    }

    const body = {
      "coordinates":[
        geoRote[0],
        geoRote[1]
      ],
      "options": options
    }

    this.myRote.from = geoRote[0];
    this.myRote.to = geoRote[1];
    this.myRote.vehicleYype = vehicleType;
    this.myRote.driveMode = driveMode;
    this.myRote.avoidFeatures = avoidFeatures;

    this.httpClient.post(postUrl, body, {headers: header} ).subscribe((response: any)=>{
      this.myRote.rote = response;
      const polylineString = response.routes[0].geometry;
      const routeCoordinates = polyline.decode(polylineString).map(coords => [coords[1], coords[0]]);
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
      this.clearVectorLayer("routeFeature");
      routeFeature.setStyle(routeStyle);

      const vectorLayer = this.map.getLayers().getArray().find((layer) => layer instanceof VectorLayer) as VectorLayer<VectorSource>;
      const vectorSource: any = vectorLayer.getSource();
      vectorSource.addFeature(routeFeature);
    }, (error: any) => {
      this.logDebug(error.error.error.message);
    })
  }

  private calculateRoute(start: [number, number], end: [number, number]) {

    const postUrl = `https://api.openrouteservice.org/v2/directions/driving-car`;
    const header = {
      Authorization: "5b3ce3597851110001cf6248822f7a9d64924aa5bb3fb8ace99891d2"
    };
    const body = {
      "coordinates":[
        start,
        end
      ],
      "options":{
        "avoid_features":[
          "tollways"
        ]
      }
    }



    this.httpClient.post(postUrl, body, {headers: header} ).subscribe((response: any)=>{

      const polylineString = response.routes[0].geometry;
      const routeCoordinates = polyline.decode(polylineString).map(coords => [coords[1], coords[0]]);
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
      this.clearVectorLayer("routeFeature");
      routeFeature.setStyle(routeStyle);

      const vectorLayer = this.map.getLayers().getArray().find((layer) => layer instanceof VectorLayer) as VectorLayer<VectorSource>;
      const vectorSource: any = vectorLayer.getSource();
      vectorSource.addFeature(routeFeature);
    })





    /*
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=5b3ce3597851110001cf6248822f7a9d64924aa5bb3fb8ace99891d2&start=${start[0]},${start[1]}&end=${end[0]},${end[1]}`;
    this.httpClient.get(url).subscribe((response: any) => {
      const coordinates = response.features[0].geometry.coordinates;
      const routeCoords = coordinates.map((coord: any) => fromLonLat(coord));

      this.logDebug(`summary: ${JSON.stringify(response.features[0].properties.summary)}`)

      this.clearVectorLayer("routeFeature");

      const routeStyle = new Style({
        stroke: new Stroke({
          color: '#1F80E7',
          width: 6
        })
      });
      const routeFeature: any = new Feature({
        geometry: new LineString(routeCoords),
        identifier: 'routeFeature'
      });
      routeFeature.setStyle(routeStyle);

      const vectorLayer = this.map.getLayers().getArray().find((layer) => layer instanceof VectorLayer) as VectorLayer<VectorSource>;
      const vectorSource: any = vectorLayer.getSource();
      vectorSource.addFeature(routeFeature);
      // Fit the map view to the route extent
      //this.map.getView().fit(routeFeature.getGeometry().getExtent());
    });
    */
  }

  private drawPoint(coordinates: any, options: pointOptions){
    const pointGeometry = new Point(coordinates);
    const pointFeature = new Feature({
      geometry: pointGeometry,
      identifier: options.name
    });

    const pointStyle = new Style({
      image: new CircleStyle({
        radius: 6,
        fill: new Fill({ color: options.color }), // Set the fill color to blue
        stroke: new Stroke({ color: 'white', width: 1 }) // Set the border color and width
      })
    });

    pointFeature.setStyle(pointStyle);

    const vectorSource = new VectorSource({
      features: [pointFeature]
    });
    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });
    this.map.addLayer(vectorLayer);
  }

  //#endregion privates

}
