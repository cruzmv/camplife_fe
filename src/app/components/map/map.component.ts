//#region imports
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, Inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { YouTubePlayer } from '@angular/youtube-player';
import { emulate_rote } from './emulate';
//#endregion imports

//declare var YT: any;

interface pointOptions {
  color: string,
  name: string
}

// interface Video {
//   title: string;
//   link: string;
// }

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss'
})
export class MapComponent implements AfterViewInit, OnInit {

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
  @ViewChild('btnTrack') btnTrack!: ElementRef;
  @ViewChild('btnRadio') btnRadio!: ElementRef;
  @ViewChild('btnDebug') btnDebug!: ElementRef;
  @ViewChild('btnRote') btnRote!: ElementRef;
  @ViewChild('btnYouTube') btnYouTube!: ElementRef;
  @ViewChild('btnUpdPlace') btnUpdPlace!: ElementRef;
  @ViewChild('btnShowCamping') btnShowCamping!: ElementRef;
  @ViewChild('btnShowCruiser') btnShowCruiser!: ElementRef;
  @ViewChild('youtubeInput') youtubeInput!: ElementRef;
  @ViewChild('my_youtubePlayer') my_youtubePlayer!: YouTubePlayer;
  @ViewChild('emulateCheckElement') emulateCheckElement!: ElementRef;

  map: Map = new Map({
    controls: []
  });
  openRotesApiKey = '5b3ce3597851110001cf6248822f7a9d64924aa5bb3fb8ace99891d2'
  isMapFullScreen: boolean = false;
  selectedLayer: string = 'Google';
  bingStyleMap: string = 'AerialWithLabelsOnDemand';
  googleStyleMap: string = 'http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}';
  mapZoon: number = 16;
  gpsData: any = [];
  trackingStatus: boolean = false;
  intervalId: any;
  debugWindow: boolean = false;
  routeToolbar: boolean = false;
  places: any[] = [];
  place: any;
  tooltipOverlay!: Overlay;
  apiEndPoint = 'http://cruzmv.ddns.net:3000/';   //'http://localhost:3000/';
  watchGeoId: any;
  myRote: any = {};
  radioPlaying: boolean = false;
  gpsStatus: boolean = true;
  geolocation: any;
  dateTimeDisplay: string = '';
  youtubeWindow: boolean = false;
  youtubeVideoId: string = '8xDdlfdWLI8';
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
    { category: 'PRIVATE CAR PARK', src: 'assets/PAYING_MOTORHOME_AREA.png' },
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

  search_options = [
    { label: '', value: '' },
  ];
  selectedSearchOption: string = '';
  rigthToolbarStatus: boolean = true;
  topMenuBarStatus: boolean = true;
  rotateOption: boolean = true;
  driving: boolean = false;
  roteGuideText: string = '';
  routeDistanceText: string = '';
  testRoute: any = emulate_rote;
  // testRoute = [
  //   [-7.502703988935648,40.13576765094939],
  //   [-7.502428241321606,40.135778753881254],
  //   [-7.502199661107832,40.135792632600754],
  //   [-7.502130724092209,40.13574128133587],
  //   [-7.502203831925979,40.135658551955714],
  //   [-7.5022927612269825,40.13554020373189],
  //   [-7.502414595126816,40.135385050751125],
  //   [ -7.502513727054246,40.13527042258943],
  //   [-7.502519780826257,40.13515810986874],
  //   [-7.502512636440126,40.135015836732094],
  //   [-7.502533347711295,40.13482253878826],
  //   [-7.502603992780819,40.13470860473117],
  //   [-7.502707372019121,40.13470614850098],
  //   [-7.50294037517497,40.134770992431555],
  //   [-7.5030585228834425,40.13481962531864],
  //   [-7.503192723191775,40.134872188081346],
  //   [-7.503368018401236,40.134956190195766],
  //   [-7.503487450398117,40.13502250759072],
  //   [-7.503619724432557,40.13512370286597],
  //   [-7.503782819642846,40.13523914389046],
  //   [-7.503911483163234,40.13534252159221],
  //   [-7.50400202025816,40.135444698880434],
  //   [-7.50400651505596,40.13555178840957],
  //   [-7.5039301043399105,40.13561810520309],
  //   [-7.504023209852929,40.13569866773551],
  //   [-7.504186947154516,40.13560975418429],
  //   [-7.504285972348208,40.13551631175858],
  //   [-7.504332204059068,40.13545245104888],
  //   [-7.504495299163541,40.135408239718856],
  //   [-7.505440900488386,40.13529330095383],
  //   [-7.506441917120752,40.13485547728172],
  //   [-7.506292540580832,40.134063457728956],
  //   [-7.5072571037787466,40.133279656138114],
  //   [-7.50910439580145,40.13243556512228],
  //   [-7.509832184415669,40.13295621749586],
  //   [-7.510559846075176,40.13433252021423],
  //   [-7.512442526854603,40.13193129104579],
  //   [-7.513746199617997,40.1305611100579],
  //   [-7.515407686872976,40.1293056969719],
  //   [-7.515978615729875,40.12887415678688],
  //   [-7.522227348363116,40.12863776238834],
  //   [-7.523685067166183,40.12750906906771],
  //   [-7.527133727244376,40.12656086412758 ],
  //   [-7.5293839609090005,40.12618760333831],
  //   [-7.53319789407066,40.126023319141154],
  //   [-7.5355598555376755,40.126032221193896 ],
  //   [-7.537782642845269,40.12494734441157],
  //   [-7.539431410881245,40.123289145919244],
  //   [-7.540772997844409,40.121811193599825 ],
  //   [-7.546872521521018,40.12195191206084 ],
  //   [-7.548117959412486,40.12398032654755 ],
  //   [-7.552999072363106,40.1220472968769 ],
  //   [-7.557255260335714,40.12292770573481 ],
  //   [-7.561224788305771,40.12205209067139 ],
  //   [-7.562870292560363,40.12185140766451 ],
  //   [-7.563486759248497,40.12226572026648],
  //   [-7.563541750439173,40.122618531255256 ],
  //   [-7.563968989662996,40.1226314783662 ],
  //   [-7.564265095538097,40.12297781406875 ],
  //   [-7.565276086543435,40.12370608404569 ],
  //   [-7.570162477575229,40.12434509845403],
  //   [-7.572341424733875,40.125923902265896 ],
  //   [-7.575001743589653,40.12663066686008 ],
  //   [-7.576592256392158,40.126122518865344 ],
  //   [-7.57780629187427,40.12562084034258 ],
  //   [-7.577937021876058,40.12533807035891 ],
  //   [-7.577994883758389,40.12492658813528],
  //   [-7.578083378715396,40.124520312136724 ],
  //   [-7.578194781238632,40.12445235070015],
  //   [-7.578223389239698,40.124336820584034],
  //   [-7.578096919257642,40.12397958793494 ],
  //   [-7.578132352691337,40.12362041886047 ],
  //   [-7.5780559841366655,40.1235547717867 ],
  //   [-7.578007841693404,40.123539433139854],
  //   [-7.577911183477084,40.12353244968975 ]
  // ]
  testRouteIndex = 0;
  emulateCheck: boolean = false;
  autoZoomCheck: boolean = true;
  private stepsState: any[] = [];
  private timeoutsEmula: NodeJS.Timeout[] = [];
  private distanceCheckTime = 0;


  //apiLoaded = false;

  //#endregion declares

  constructor(private httpClient: HttpClient,
              @Inject(DOCUMENT) private document: any,
              private windowService: NbWindowService,
              private cdr: ChangeDetectorRef) { }

  //#region publics
  @HostListener('window:offline', ['$event'])
  onOffline(event: any) {
    this.logDebug('You are offline!');
  }

  @HostListener('window:online', ['$event'])
  onOnline(event: any) {
    this.logDebug('You are online!');
  }

  ngOnInit(): void {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.body.appendChild(tag);
  }

  ngAfterViewInit(): void {
    this.photoView.nativeElement.hidden = true;
    this.initializeMap();

    const places = localStorage.getItem('places');
    if (places != null){
      this.places = JSON.parse(places)
      setTimeout(() => {
        this.addMarkers();
      }, 500);
    }

    const emulate: any = localStorage.getItem("emulate");
    if (emulate) {
      this.emulateCheck = JSON.parse(emulate);
      this.emulateCheckElement.nativeElement.checked = this.emulateCheck;
    }

    const event = {
      currentTarget: {
        id: "googleselect",
        value: "Hybrid"
      }
    }
    this.mapSelect(event);

    // if (window.DeviceOrientationEvent) {
    //   window.addEventListener('deviceorientation', this.handleOrientation.bind(this), true);
    //   this.logDebug(`window.DeviceOrientationEvent exists`);
    // } else {
    //   this.logDebug('Device orientation not supported');
    // }

    setInterval( ()=>{
      if (window.performance && (window.performance as any).memory && this.memoryStatus) {
        this.memoryStatus.nativeElement.innerHTML = `jsHeapSizeLimit: ${ (window.performance as any).memory.jsHeapSizeLimit.toLocaleString('en-US') } <br/>
                                                     totalJSHeapSize: ${ (window.performance as any).memory.totalJSHeapSize.toLocaleString('en-US') } <br/>
                                                     usedJSHeapSize: ${ (window.performance as any).memory.usedJSHeapSize.toLocaleString('en-US') }`
        this.iconWiFi.nativeElement.src=`assets/${navigator.onLine ? 'wifi-outline' : 'wifi-off-outline'}.svg`;
        this.iconGps.nativeElement.src=`assets/${this.gpsStatus ? 'compass-outline' : 'compass-off-outline'}.svg`;
      }
      const now = new Date()
      this.dateTimeDisplay = `${now.toDateString()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
      this.cdr.detectChanges();

      if (this.driving){
        const coords: any = this.map.getView().getCenter();
        let coordinates: any = this.bing2GooglePosition(coords[0],coords[1]);
        this.checkDistanceToSteps(coordinates);
      }

    }, 1000)

    // Fetch the off line icons because when internet is off, it will not manage to fetch, so fetch it in advanced
    fetch('assets/wifi-off-outline.svg');

    // Request screen aways awake
    navigator.wakeLock.request('screen').then(result =>{
      this.logDebug(`wakeLock ${result.released}`);
    })


    // Get the Geolocation API
    this.geolocation = new Geolocation({
      trackingOptions: {
        enableHighAccuracy: true // Enable high accuracy tracking
      },
      projection: this.map.getView().getProjection() // Use map projection
    });

    // Continuously update the map rotation based on device heading
    this.geolocation.on('change', () => {
      const heading = this.geolocation.getHeading(); // Get device heading
      if (heading !== undefined) {
        const rotation = (360 - heading) * Math.PI / 180; // Convert heading to radians
        this.logDebug(`geolocation.rotate, heading: ${heading}, rotation: ${rotation}`);
        this.map.getView().setRotation(rotation); // Set map rotation
      }
    });

    this.btnTrack.nativeElement.style.backgroundColor = this.trackingStatus ? '#a8f29b' : '#e38178';
    this.btnRadio.nativeElement.style.backgroundColor = this.radioPlaying ? '#a8f29b' : '#e38178';
    this.btnDebug.nativeElement.style.backgroundColor = this.debugWindow ? '#a8f29b' : '#e38178';
    this.btnRote.nativeElement.style.backgroundColor = this.routeToolbar ? '#a8f29b' : '#e38178';
    this.btnYouTube.nativeElement.style.backgroundColor = this.youtubeWindow ? '#a8f29b' : '#e38178';


    // const apiKey = 'AIzaSyD2uIOIolOd0J23d-4VAo1uRdioG9T3VWA';
    // const playlistId = 'PLUzvkcJZ1D2MEI0tLhoCjHPvaLyzanYUC';
    // const maxResults = 10;
    // fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${apiKey}&maxResults=${maxResults}`)
    //     works:   https://youtube.googleapis.com/youtube/v3/playlists?id=PLUzvkcJZ1D2MEI0tLhoCjHPvaLyzanYUC&key=AIzaSyD2uIOIolOd0J23d-4VAo1uRdioG9T3VWA
    // .then(response => response.json())
    // .then(data => {
    //     console.log('Videos:', data.items);
    // })
    // .catch(error => console.error('Error:', error));


  }

  playYouTube(){
    //https://www.angularjswiki.com/angular/how-to-embed-youtube-videos-in-angular-apps/
    this.youtubeWindow = !this.youtubeWindow;
  }

  updateYoutube(event: any){
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = event.srcElement.value.match(regex);
    if (match && match[1]) {
      this.youtubeVideoId = match[1]
    }
  }

  playRadio(){
    this.radioPlaying = !this.radioPlaying;
    if (this.radioPlaying) {
      this.audioPlayer.nativeElement.play();
    } else {
      this.audioPlayer.nativeElement.pause();
    }
    this.btnRadio.nativeElement.style.backgroundColor = this.radioPlaying ? '#a8f29b' : '#e38178';
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
      this.geolocation.setTracking(true);
    } else {
      this.stopWatchingPosition();
      this.geolocation.setTracking(false);
    }

    this.btnTrack.nativeElement.style.backgroundColor = this.trackingStatus ? '#a8f29b' : '#e38178';

  }

  windowDebug(){
    this.debugWindow = !this.debugWindow;
    this.btnDebug.nativeElement.style.backgroundColor = this.debugWindow ? '#a8f29b' : '#e38178';
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

    this.btnShowCruiser.nativeElement.disabled = true;
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
      this.btnShowCruiser.nativeElement.disabled = false;
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

    this.btnShowCamping.nativeElement.disabled = true;
    this.httpClient.get(apiUrl, { params: queryParams }).subscribe((response: any) => {
      this.places = this.places.concat(response.data);
      localStorage.setItem("places",JSON.stringify(this.places));
      this.logDebug(`${response.data.length} fetched, total: ${this.places.length}`);
      this.addMarkers();
      this.btnShowCamping.nativeElement.disabled = false;
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
          this.photoView.nativeElement.children[1].children.main_foto.src = photo.link_large;
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
    if (this.roteZoom)
      this.map.getView().setZoom(this.roteZoom.nativeElement.value);

    this.updateTrackingStatus();
    this.driving = true;

    // Clear previous timeouts
    this.clearTimeoutsEmu();

    if (this.emulateCheck) {
        let someElapsTime = 0;


        this.testRoute.filter((x:any) => x.drove == undefined).forEach((geo: any) => {
            if (geo.elapstime) {
                someElapsTime += parseInt(geo.elapstime);
              }
              const timeout = setTimeout(() => this.handleInterval(geo), someElapsTime);
              this.timeoutsEmula.push(timeout);
        });
    }
  }

  /*
  startDrive() {
    this.routeToolbar = !this.routeToolbar;
    this.map.getView().setZoom(this.roteZoom.nativeElement.value);
    this.updateTrackingStatus();
    this.driving = true;

    if (this.emulateCheck) {
      let someElapsTime = 0
      this.testRoute.forEach((geo:any) => {
        if (geo.elapstime) {
          someElapsTime += parseInt(geo.elapstime);
        }
        setTimeout(() => this.handleInterval(geo), someElapsTime);
      });
    }
  }
  */

  cacheRote(){

    if (this.selectedLayer == 'Bing'){
      alert('Feature not avalible for Bing. Yet.');
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

    if (this.routeToolbar) {
      try {
        const from_geometry: any = await this.locateFeature("dotFeature");
        const from_coordinates = from_geometry.getCoordinates();
        const from_coordinates_google: any = this.bing2GooglePosition(from_coordinates[0],from_coordinates[1]);

        const to_geometry: any = await this.locateFeature("pinpoint");
        const to_coordinates = to_geometry.getCoordinates();
        const to_coordinates_google: any = this.bing2GooglePosition(to_coordinates[0],to_coordinates[1]);

        setTimeout(() => {

          if (this.roteFrom)
            this.roteFrom.nativeElement.value = from_coordinates_google;
            this.roteTo.nativeElement.value = to_coordinates_google;

        }, 500);
        this.calculateRoute(from_coordinates_google,to_coordinates_google);
      } catch(error: any){
        this.logDebug(`Error creating rote: ${JSON.stringify(error)}`);
      }
    }

    this.btnRote.nativeElement.style.backgroundColor = this.routeToolbar ? '#a8f29b' : '#e38178';

  }

  search_place(event: any){
    if (event.srcElement.value.length >= 5 ){
      if ((event.keyCode >= 65 && event.keyCode <= 90) || // A-Z
          (event.keyCode >= 48 && event.keyCode <= 57) || // 0-9
          (event.keyCode >= 96 && event.keyCode <= 105) || // Numpad 0-9
           event.keyCode == 8 || event.keyCode == 46 ) {
          const url = `https://api.openrouteservice.org/geocode/autocomplete?api_key=${this.openRotesApiKey}&text=${event.srcElement.value}`;
          this.httpClient.get(url).subscribe((response: any)=>{
            this.search_options = [];
            response.features.forEach((feature: any) => {
              this.search_options.push({
                label: `${feature.properties.street != undefined ? feature.properties.street : feature.properties.name} ${feature.properties.region}`,
                value: `${feature.properties.localadmin != undefined ? feature.properties.localadmin : feature.properties.locality} ${feature.properties.country}`
              })
            });

            const url = `https://api.openrouteservice.org/geocode/search?api_key=${this.openRotesApiKey}&text=${event.srcElement.value}`;
            this.httpClient.get(url).subscribe((response: any)=>{
              response.features.forEach((feature: any) => {
                this.search_options.push({
                  label: `${feature.properties.street != undefined ? feature.properties.street : feature.properties.name} ${feature.properties.region}`,
                  value: `${feature.properties.localadmin != undefined ? feature.properties.localadmin : feature.properties.locality} ${feature.properties.country}`
                })
              });  
            })

          })
      } else if (event.keyCode == 13){
        this.executeSearch(event.srcElement.value);
      }
    }
  }

  searchOptionSelected(event: any){
    this.executeSearch(event.srcElement.value);
  }

  rightToolBar(){
    this.rigthToolbarStatus = !this.rigthToolbarStatus;
  }
  
  topMenu(){
    this.topMenuBarStatus = !this.topMenuBarStatus;
  }
  
  emulate(){
    this.emulateCheck = !this.emulateCheck;
    localStorage.setItem("emulate",JSON.stringify(this.emulateCheck))
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

      if (this.emulateCheck) {
        // simulate a move every 5 secounds
        const coordinates: any = [this.testRoute[this.testRouteIndex]['lat'],this.testRoute[this.testRouteIndex]['long']];
        this.recordGeoPosition(coordinates);
        this.centerAndZoomToLocation(coordinates); // Change zoom level as needed
        this.gpsStatus = true;

        // let someElapsTime = 0
        // this.testRoute.forEach((geo:any) => {
        //   if (geo.elapstime) {
        //     someElapsTime += parseInt(geo.elapstime);
        //   }
        //   setTimeout(() => this.handleInterval(geo), someElapsTime);
        // });


        // this.testRoute((geo: any) => {
        //   setTimeout( this.handleInterval(geo) ,geo.elapstime)          
        // });



        /*
        setInterval(()=>{
          if (this.driving) {
            const coordinates: any = [this.testRoute[this.testRouteIndex]['lat'],this.testRoute[this.testRouteIndex]['long']];
            this.recordGeoPosition(coordinates);
            this.centerAndZoomToLocation(coordinates); // Change zoom level as needed
            this.gpsStatus = true;
            this.testRouteIndex++;  
            if (this.testRouteIndex >= this.testRoute.length){
              this.testRouteIndex = 0;
            }
          }
        },2500);
        */
        /*
        setInterval(() => {
          if (this.driving) {
              // const coordinates: any = [this.testRoute[this.testRouteIndex]['lat'], this.testRoute[this.testRouteIndex]['long']];
              // this.recordGeoPosition(coordinates);
              // this.centerAndZoomToLocation(coordinates); // Change zoom level as needed
              // this.gpsStatus = true;
              // this.testRouteIndex++;
      
              // // Reset the index if it exceeds the length of the testRoute array
              // if (this.testRouteIndex >= this.testRoute.length) {
              //     this.testRouteIndex = 0;
              // }
      
              // Calculate the interval time based on the elapstime value
              const elapstime = this.testRoute[this.testRouteIndex]['elapstime'];
              const intervalTime = elapstime ? parseInt(elapstime) : 1000; // Convert elapstime to milliseconds
      
              // Clear the previous interval and set a new one with the calculated interval time
              clearInterval(this.intervalId);
              this.intervalId = setInterval(() => {
                  this.handleInterval();
              }, intervalTime);
          }
        }, 1000);   
        */    

      } else {
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
      }
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
            if (place.water_point && parseInt(place.water_point) > 0)
              tooltipContent+="<img src='assets/tap-water.svg' width='24px'> ";

            if (place.black_water && parseInt(place.black_water) > 0)
              tooltipContent+="<img src='assets/black-water.svg' width='24px'> ";

            if (place.gray_water && parseInt(place.gray_water) > 0)
              tooltipContent+="<img src='assets/gray-water.svg' width='24px'> ";

            if (place.public_toilet && parseInt(place.public_toilet) > 0)
              tooltipContent+="<img src='assets/public-toilet.svg' width='24px'> ";

            if (place.shower && parseInt(place.shower) > 0)
              tooltipContent+="<img src='assets/shower.svg' width='24px'> ";

            if (place.electricity && parseInt(place.electricity) > 0)
              tooltipContent+="<img src='assets/electricity.svg' width='24px'> ";

            if (place.has_wifi && parseInt(place.has_wifi) > 0)
              tooltipContent+="<img src='assets/wifi.svg' width='24px'> ";

            if (place.laudry && parseInt(place.laudry) > 0)
              tooltipContent+="<img src='assets/laudry.svg' width='24px'>";
          }

          if (tooltipContent == ''){
            tooltipContent = `<label>${place.place_resume}</label>`;
          }

          if (place.number_places && parseInt(place.number_places) > 0)
            tooltipContent+=` [${place.number_places} places]`;

          this.tooltipOverlay.getElement()!.innerHTML = tooltipContent;
          this.tooltipOverlay.getElement()!.style.fontSize = '18px';
          this.tooltipOverlay.getElement()!.style.color = 'black';
          this.tooltipOverlay.getElement()!.style.fontWeight = 'bold';
          this.tooltipOverlay.getElement()!.style.backgroundColor = 'gray';
          this.tooltipOverlay.getElement()!.style.maxWidth = '250px';
          this.tooltipOverlay.getElement()!.style.wordWrap = 'break-word';
          this.tooltipOverlay.getElement()!.style.overflowWrap = 'break-word';

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

    });

  }

  private handleInterval(geo: any) {
    const coordinates: any = [geo.lat,geo.long];   //[this.testRoute[this.testRouteIndex]['lat'], this.testRoute[this.testRouteIndex]['long']];
    this.recordGeoPosition(coordinates);
    this.centerAndZoomToLocation(coordinates);
    this.gpsStatus = true;
    this.testRouteIndex++;

    console.log(geo.elapstime);

    // Reset the index if it exceeds the length of the testRoute array
    if (this.testRouteIndex >= this.testRoute.length) {
        this.testRouteIndex = 0;
    }
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
          if (!this.emulateCheck) {
            this.centerAndZoomToLocation(coordinates); // Change zoom level as needed
          }

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

    //this.logDebug(JSON.stringify(geoData));
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

  private clearTimeoutsEmu() {
    this.timeoutsEmula.forEach(timeout => clearTimeout(timeout));
    this.timeoutsEmula = [];
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
              fill: new Fill({color: 'rgb(255,255,255)'}),
              stroke: new Stroke({color: 'rgb(0,0,0)', width: 5})
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

    this.btnUpdPlace.nativeElement.disabled = true;
    this.httpClient.post(apiUrl, requestBody).subscribe((response: any) => {
      this.logDebug(`Finished update region ${JSON.stringify(requestBody)}`);
      this.btnUpdPlace.nativeElement.disabled = false;
      this.fetchPlaces(bingLat, bingLong);
    },
    error=>{
      this.logDebug(`updatePlacesWithCoordinate ${JSON.stringify(error)}`)
    });
  }

  private getMapTile(latitude: number, longitude: number, zoom: number) {

    let baseUrl = '';
    if (this.selectedLayer == 'Google'){
      baseUrl = this.googleStyleMap;
    } else if (this.selectedLayer == 'OSM') {
      baseUrl = 'https://tile.openstreetmap.org/x/y/z.png'
    }
    //# TODO: bing = 'https://t0.ssl.ak.dynamic.tiles.virtualearth.net/comp/ch/0?mkt=en-US&it=G,L&shading=hill&og=2431&n=z'




    const z = Math.round(zoom);
    const lon2tile = (lon:any,zoom:any) => (Math.floor((lon+180)/360*Math.pow(2,zoom)));
    const lat2tile = (lat:any,zoom:any) => (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom)));
    let x = lon2tile(longitude, z),
        y = lat2tile(latitude, z);

    return baseUrl.replace('{z}', z.toString())
                  .replace('{x}', x.toString())
                  .replace('{y}', y.toString())
  }

  // private handleOrientation(event: DeviceOrientationEvent) {
  //   if (event.alpha !== null) {
  //     const compassHeading = event.alpha;
  //     const bearingToNorth = 360 - compassHeading;

  //     this.logDebug(`North: ${bearingToNorth}`)

  //     //const map = document.getElementById('map') as any;
  //     //map.setRotation(bearingToNorth);
  //     this.map.getView().setRotation(bearingToNorth);
  //   } else {
  //     this.logDebug(`no event.alpha`);
  //   }
  // }

  private decodePolyline(polyline: string): number[][] {
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

  private calculateDistance(point1: any, point2: any) {
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

  private checkDistanceToSteps(currentPosition: any) {
    if (this.stepsState.length === 0) {
      this.initializeStepsState();
    }
    const stepIndex = this.stepsState.findIndex(step => step.status === 'TODO' || step.status === 'DOING');
    if (stepIndex === -1) {
      // All steps are DONE
      return;
    }
    this.updateStepState(stepIndex, currentPosition);
    // if (this.checkForRouteDeviation(currentPosition, stepIndex)) {
    //   //this.reRoute(); // Trigger re-route method
    //   this.logDebug(`RE-ROUTE>.......`);
    // }
    this.roteGuideText = `[${Math.round(this.stepsState[stepIndex].lastDistance)} meters] ${this.myRote.rote.routes[0].segments[0].steps[stepIndex].instruction}`;
  }

  private speak(text: string) {
    if ('speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const desiredVoice = voices.find(voice => voice.name === 'English United Kingdom');
        if (desiredVoice){
          msg.voice = desiredVoice;
        }
        msg.lang = 'en-US';
        window.speechSynthesis.speak(msg);
    } else {
        console.error('Speech synthesis is not supported by your browser.');
    }
  }

  private drawRoteOption(geoRote: [[number,number],[number,number]], driveMode: string, avoide: any,vehicleType: string, roteZoom: string) {

    const postUrl = `https://api.openrouteservice.org/v2/directions/${driveMode}`;
    const header = {
      Authorization: this.openRotesApiKey
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

      this.updateRouteDistanceText();
      // this.routeDistanceText = `Distance: ${this.myRote.rote.routes[0].summary.distance.toFixed(2)} ` +
      // ` Duration: ${String(Math.floor(this.myRote.rote.routes[0].summary.distance / 60)).padStart(2,'0')}:${String(parseInt((this.myRote.rote.routes[0].summary.distance % 60 as any)) ).padStart(2,'0')} `;

      // this.roteGuideText = `[${Math.round(this.myRote.rote.routes[0].segments[0].steps[0].distance)} meters] ${this.myRote.rote.routes[0].segments[0].steps[0].instruction}`;

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

  private updateRouteDistanceText() {

    this.routeDistanceText = `Distance: ${this.myRote.rote.routes[0].summary.distance.toFixed(2)} ` +
    ` Duration: ${String(Math.floor(this.myRote.rote.routes[0].summary.distance / 60)).padStart(2,'0')}:${String(parseInt((this.myRote.rote.routes[0].summary.distance % 60 as any)) ).padStart(2,'0')} `;

    this.roteGuideText = `[${Math.round(this.myRote.rote.routes[0].segments[0].steps[0].distance)} meters] ${this.myRote.rote.routes[0].segments[0].steps[0].instruction}`;


    // const totalDuration = this.myRote.rote.routes[0].summary.duration;
    // const totalHours = Math.floor(totalDuration / 60);
    // const totalMinutes: any = totalDuration % 60;
    // const now = new Date();
    // const currentHours = now.getHours();
    // const currentMinutes = now.getMinutes();
    
    // let etaHours = currentHours + totalHours;
    // let etaMinutes = currentMinutes + totalMinutes;
    
    // // Adjust ETA if it exceeds 60 minutes
    // if (etaMinutes >= 60) {
    //   etaMinutes -= 60;
    //   etaHours++;
    // }
    
    // // Adjust ETA if it exceeds 24 hours
    // if (etaHours >= 24) {
    //   etaHours -= 24;
    // }
    // const etaString = `${String(etaHours).padStart(2, '0')}:${String(etaMinutes).padStart(2, '0')}`;

    // this.routeDistanceText = `Distance: ${totalDuration.toFixed(2)} ` +
    // `Duration: ${String(totalHours).padStart(2, '0')}:${String(parseInt((totalMinutes))).padStart(2, '0')} ` +
    // `ETA: ${etaString}`;

    // // this.routeDistanceText = `Distance: ${this.myRote.rote.routes[0].summary.distance.toFixed(2)} ` +
    // // ` Duration: ${String(Math.floor(this.myRote.rote.routes[0].summary.distance / 60)).padStart(2,'0')}:${String(parseInt((this.myRote.rote.routes[0].summary.distance % 60 as any)) ).padStart(2,'0')} `;
  }

  private calculateRoute(start: [number, number], end: [number, number]) {

    const postUrl = `https://api.openrouteservice.org/v2/directions/driving-car`;
    const header = {
      Authorization: this.openRotesApiKey
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
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${this.openRotesApiKey}&start=${start[0]},${start[1]}&end=${end[0]},${end[1]}`;
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
        radius: (options.name == 'dotFeature' ? 12 : 6),
        fill: new Fill({ color: options.color }), // Set the fill color to blue
        stroke: new Stroke({ 
          color: 'rgba(255, 255, 255, 0.7)',  // Set the border color to white with 70% opacity
          width: (options.name == 'dotFeature' ? 10 : 1) // Set the border width
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
    this.map.addLayer(vectorLayer);
  }

  private executeSearch(searchString: string){
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${this.openRotesApiKey}&text=${searchString}`;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;    
    this.httpClient.get(url).subscribe((response: any)=>{
      response.features.forEach((feature:any) => {
        const transformedCoordinates = fromLonLat(feature.geometry.coordinates);
        this.drawPoint(transformedCoordinates,{ 
          name: feature.properties.id,
          color: '#2403fc'
        } as pointOptions);        
        minX = Math.min(minX, transformedCoordinates[0]);
        minY = Math.min(minY, transformedCoordinates[1]);
        maxX = Math.max(maxX, transformedCoordinates[0]);
        maxY = Math.max(maxY, transformedCoordinates[1]);
      });

      const bbox = [minX, minY, maxX, maxY];
      this.map.getView().fit(bbox, {
        padding: [10, 10, 10, 10], // Optional padding
        duration: 1000 // Animation duration in milliseconds
      });

    })
  }


  private initializeStepsState() {
    if (this.myRote.rote) {
      const steps = this.myRote.rote.routes[0].segments[0].steps;
      this.stepsState = steps.map(() => ({
        status: 'TODO',
        lastWarn: false,
        secoundWarn: false,
        firstWarn: false,
        lastDistance: 0,
        distanceHistory: []
      }));
    }
  }

  private updateStepState(stepIndex: number, currentPosition: any) {
    const step = this.myRote.rote.routes[0].segments[0].steps[stepIndex];
    const currentDestinationPosition = this.decodePolyline(this.myRote.rote.routes[0].geometry)[step.way_points[0]];
    const currentDistanceToStep = this.calculateDistance(currentPosition, currentDestinationPosition);
    
    let distanceDone: any = 0;
    for (let i = 0; i < this.myRote.rote.routes[0].segments[0].steps.length; i++) { 
      const step: any = this.myRote.rote.routes[0].segments[0].steps[i];
      if (this.stepsState[i].status == 'DONE') {
        distanceDone += step.distance;
      }
    }
    const distanceTodo = this.myRote.rote.routes[0].summary.distance - distanceDone;

    this.routeDistanceText = `Distance: ${distanceTodo.toFixed(2)} ` +
                             ` Duration: ${String(Math.floor(distanceTodo / 60)).padStart(2,'0')}:${String(parseInt((distanceTodo % 60 as any)) ).padStart(2,'0')} `;




    //console.log(`stepIndex: ${stepIndex}, currentDistanceToStep: ${currentDistanceToStep}, currentPosition: ${currentPosition} checkStepCompletion: ${this.checkStepCompletion(stepIndex)}`);


    // if (this.stepsState[stepIndex].distanceHistory.indexOf(currentDistanceToStep) < 0 ) {
    //   console.log(`<0: ${this.stepsState[stepIndex].distanceHistory.indexOf(currentDistanceToStep)}`)
    //   this.stepsState[stepIndex].distanceHistory.push(currentDistanceToStep);
    // }
    this.stepsState[stepIndex].distanceHistory.push(currentDistanceToStep);
    
    this.testRoute[this.distanceCheckTime]['drove'] = true;

    // Off-route check
    if (this.checkOffRoute(currentPosition) && this.distanceCheckTime > 1) {
      //this.speak('You are off-route. Please return to the designated path.');
      //this.logDebug('Off-route detected');
      console.log('Off-route detected');
      this.driving = false;
      this.clearTimeoutsEmu();
      this.addRoute();
      this.drawRote();
      this.startDrive();

      return;
    }

    this.distanceCheckTime ++;

    if (this.checkStepCompletion(stepIndex)) {
      this.stepsState[stepIndex].status = 'DONE';
    } else if (this.stepsState[stepIndex].status === 'TODO' || this.stepsState[stepIndex].status === 'DOING') {
      this.stepsState[stepIndex].status = 'DOING';
      if (!this.stepsState[stepIndex].lastWarn && currentDistanceToStep <= 50) {
        this.speak(`${step.instruction}`);
        this.stepsState[stepIndex].lastWarn = true;
        this.logDebug(`Warn at 50mt`);
      } else if (!this.stepsState[stepIndex].lastWarn && !this.stepsState[stepIndex].secoundWarn && currentDistanceToStep <= 250) {
        this.speak(`${step.instruction} in ${Math.round(currentDistanceToStep)} meters`);
        this.stepsState[stepIndex].secoundWarn = true;
        this.logDebug(`Warn at 250mt`);
      } else if (!this.stepsState[stepIndex].lastWarn && !this.stepsState[stepIndex].secoundWarn && !this.stepsState[stepIndex].firstWarn && currentDistanceToStep <= 500) { 
        this.logDebug(`<500: ${currentDistanceToStep}`);
        this.speak(`${step.instruction} in ${Math.round(currentDistanceToStep)} meters`);
        this.stepsState[stepIndex].firstWarn = true;
        this.logDebug(`Warn at 500mt`);
      }
    }

    if (this.autoZoomCheck) {
      if (currentDistanceToStep > 1500) {
        this.map.getView().setZoom(14);
      } else if (currentDistanceToStep > 500) { 
        this.map.getView().setZoom(18);
      } else if (currentDistanceToStep < 250) {
        this.map.getView().setZoom(20);
      }
    }

    this.stepsState[stepIndex].lastDistance = currentDistanceToStep;


    /*

    if (this.stepsState[stepIndex].distanceHistory.indexOf(currentDistanceToStep) < 0 ) {
      console.log(`<0: ${this.stepsState[stepIndex].distanceHistory.indexOf(currentDistanceToStep)}`)
      this.stepsState[stepIndex].distanceHistory.push(currentDistanceToStep);
    }

    if (this.checkStepCompletion(stepIndex)) {
      this.stepsState[stepIndex].status = 'DONE';
    } else if (this.stepsState[stepIndex].status === 'TODO' || this.stepsState[stepIndex].status === 'DOING') {
      this.stepsState[stepIndex].status = 'DOING';
      
      if (!this.stepsState[stepIndex].lastWarn && currentDistanceToStep <= 50) {
        console.log(`<50: ${currentDistanceToStep}`);
        this.speak(`${step.instruction}`);
        this.stepsState[stepIndex].lastWarn = true;
      } else if (!this.stepsState[stepIndex].lastWarn && !this.stepsState[stepIndex].secoundWarn && currentDistanceToStep <= 250) {
        console.log(`<250: ${currentDistanceToStep}`);
        this.speak(`${step.instruction} in ${Math.round(currentDistanceToStep)} meters`);
        this.stepsState[stepIndex].secoundWarn = true;
      } else if (!this.stepsState[stepIndex].lastWarn && !this.stepsState[stepIndex].secoundWarn && !this.stepsState[stepIndex].firstWarn && currentDistanceToStep <= 500) {
        console.log(`<500: ${currentDistanceToStep}`);
        this.speak(`${step.instruction} in ${Math.round(currentDistanceToStep)} meters`);
        this.stepsState[stepIndex].firstWarn = true;
      } 
    }


    */
  }    

    /*
    this.myRote.rote.routes[0].segments[0].steps.forEach((step: any) => {
        if (step.done_1 == undefined || step.done_2 == undefined || step.done_3 == undefined){
          const startPointIndex = step.way_points[0];
          const endPointIndex = step.way_points[1];
  
          const startPoint = coordinates[startPointIndex];
          const endPoint = coordinates[endPointIndex];
  
          const distanceToStep = this.calculateDistance(currentPosition, startPoint);
          if (logFirstDistance){
            this.logDebug(`${step.instruction} in ${distanceToStep} meters`);
            logFirstDistance = false;
          }
  
          // Trigger warning message when the distance is less than a specified value (e.g., 20 meters)
          const warnMessage = `${step.instruction} in ${Math.round(distanceToStep)} meters`;

          if (step.done_3 == undefined && distanceToStep <= 60){
            this.speak(warnMessage);
            step.done_3 = true;
          } else if (step.done_2 == undefined && this.myRote.rote.routes[0].summary.distance > 250 && distanceToStep <= 250) {
            this.speak(warnMessage);
            step.done_2 = true;            
          } else if (step.done_1 == undefined && this.myRote.rote.routes[0].summary.distance > 500 && distanceToStep <= 500) {

          }



          if ( this.myRote.rote.routes[0].summary.distance > 500 && distanceToStep <= 500 && step.done_1 == undefined) {
            this.speak(warnMessage);
            step.done_1 = true;
            this.roteGuideText = warnMessage;
          }
          if ( this.myRote.rote.routes[0].summary.distance > 250 && distanceToStep <= 250 && step.done_2 == undefined) {
            this.speak(warnMessage);
            step.done_2 = true;
          }
          if (distanceToStep <= 65 && step.done_3 == undefined) {
            this.speak(warnMessage);
            step.done_3 = true;
          }
        }

    });
    */

    private checkOffRoute(currentPosition: any): boolean {
      const routeCoordinates: any[] = this.decodePolyline(this.myRote.rote.routes[0].geometry);
      
      // Threshold distance in meters
      const threshold = 25;
  
      for (const coord of routeCoordinates) {
          const distance = this.calculateDistance(currentPosition, coord);
          if (distance < threshold) {
              return false;
          }
      }
  
      return true;
  }

  private checkStepCompletion(stepIndex: number): boolean {
    const distances = this.stepsState[stepIndex].distanceHistory;
    let previousDistance: number | undefined = undefined;
    
    for (let i = 0; i < distances.length; i++) {
      if (previousDistance !== undefined) {
        this.logDebug(`floating distance: ${Math.round(previousDistance - distances[i])}`);
        if (Math.round(previousDistance - distances[i]) <= -7) {
          //console.log(`previousDistance: ${previousDistance} - distances[i] ${distances[i]} === ${Math.round(previousDistance - distances[i])}`);
          return true;
        }
      }
      previousDistance = distances[i];
    }
    return false;
  }

  private checkForRouteDeviation(currentPosition: any, stepIndex: number): boolean {
    const currentDestinationPosition = this.decodePolyline(this.myRote.rote.routes[0].geometry)[stepIndex > 0 ? this.myRote.rote.routes[0].segments[0].steps[stepIndex - 1].way_points[1] : 0];
    const currentDistanceToDestination = this.calculateDistance(currentPosition, currentDestinationPosition);
  
    return currentDistanceToDestination > this.stepsState[stepIndex].lastDistance * 2; // Deviation threshold
  }  
  //#endregion privates

}
