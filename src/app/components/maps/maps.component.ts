import { AfterViewInit, Component, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { OpenLayersService } from '../../services/open-layers.service';
import { OpenRouteService } from '../../services/open-route.service';
import { Park4nightService } from '../../services/park4night.service';
import { Subject } from 'rxjs';
import { Overlay } from 'ol';


interface geolocationCoordinates {
  accuracy: number | null | undefined,
  altitude: number | null | undefined,
  altitudeAccuracy: number | null | undefined,
  heading: number | null | undefined,
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  speed: number | null | undefined
}

interface geolocationPosition {
  coords: geolocationCoordinates | null | undefined,
  timestamp: number | null | undefined
}

@Component({
  selector: 'app-maps',
  templateUrl: './maps.component.html',
  styleUrl: './maps.component.scss'
})
export class MapsComponent implements AfterViewInit {

  // The map
  @ViewChild('mapElement', { static: false }) mapElement!: ElementRef;
  map: any;

  // Controllers visibility
  rightToolsIsActive: boolean = false;
  layersBarIsActive: boolean = false;
  routeBarIsActive: boolean = false;
  campingBarIsActive: boolean = false;
  campingFiltering: boolean = false;

  // Maps options
  mapLayerCompany: string = 'Google';
  mapLayerOption: string = 'Hybrid';
  mapLayerOptionsAvailiable: string[] = [];
  mapZoomValue: number = 14;
  mapPois: any[] = [];

  // Route Options
  @ViewChild('routePois') routePois!: ElementRef;
  driveMode: string[] = [];
  avoidDrive: string[] = [];
  vehicleType: string[] = [];
  choosedDriveMode: string = 'driving-car';
  choosedAvoids: string[] = [
    'tollways'
  ]
  choosedTypeVehicle: string = 'unknown';

  // Campings options
  campings: any[] = [];
  campingsIcons = [
    { category: 'Fuel Station'                , src: 'assets/gas-pump.png'              ,'selected': false },
    { category: 'Showers'                     , src: 'assets/shower.png'                ,'selected': false },
    { category: 'Sanitation Dump Station'     , src: 'assets/undercarriage.png'         ,'selected': false },
    { category: 'Wifi'                        , src: 'assets/wifi-signal.png'           ,'selected': false },
    { category: 'Established Campground'      , src: 'assets/CAMPING.png'               ,'selected': false },
    { category: 'Wild Camping'                , src: 'assets/tent.png'                  ,'selected': false },
    { category: 'Informal Campsite'           , src: 'assets/lamp.png'                  ,'selected': false },
    { category: 'Water'                       , src: 'assets/faucet.png'                ,'selected': false },
    { category: 'Tourist Attraction'          , src: 'assets/travel-and-tourism.png'    ,'selected': false },
    { category: 'PARKING LOT DAY/NIGHT'       , src: 'assets/PARKING_LOT_DAY_NIGHT.png' ,'selected': true },
    { category: 'EXTRA SERVICES'              , src: 'assets/EXTRA_SERVICES.png'        ,'selected': false },
    { category: 'CAMPING'                     , src: 'assets/CAMPING.png'               ,'selected': false },
    { category: 'PRIVATE CAR PARK FOR CAMPERS', src: 'assets/MOTORHOME_AREA.png'        ,'selected': false },
    { category: 'PAYING MOTORHOME AREA'       , src: 'assets/paying_motorhome_area.png' ,'selected': false },
    { category: 'ON THE FARM'                 , src: 'assets/ON_THE_FARM.png'           ,'selected': false },
    { category: 'SURROUNDED BY NATURE'        , src: 'assets/SURROUNDED_BY_NATURE.png'  ,'selected': false },
    { category: 'DAILY PARKING LOT ONLY'      , src: 'assets/DAILY_PARKING_LOT_ONLY.png','selected': false },
    { category: 'PICNIC AREA'                 , src: 'assets/PICNIC_AREA.png'           ,'selected': false },
    { category: 'OFF-ROAD'                    , src: 'assets/jeep.png'                  ,'selected': false },
    { category: 'REST AREA'                   , src: 'assets/restaurant.png'            ,'selected': false },
    { category: 'HOMESTAYS ACCOMMODATION'     , src: 'assets/homestay.png'              ,'selected': false },
    //{ category: 'CRUISER', src: 'assets/dick.png','selected': false },
  ];
  campingOverlay!: Overlay;
  campingServices = [
    {title: 'tap-water'        , key: 'point_eau'  , src: 'assets/tap-water.svg'        , selected: false},
    {title: 'black-water'      , key: 'eau_noire'  , src: 'assets/black-water.svg'      , selected: false},
    {title: 'gray-water'       , key: 'eau_usee'   , src: 'assets/gray-water.svg'       , selected: false},
    {title: 'public-toilet'    , key: 'wc_public'  , src: 'assets/public-toilet.svg'    , selected: false},
    {title: 'shower'           , key: 'douche'     , src: 'assets/shower.svg'           , selected: false},
    {title: 'electricity'      , key: 'electricite', src: 'assets/electricity.svg'      , selected: false},
    {title: 'wifi'             , key: 'wifi'       , src: 'assets/wifi.svg'             , selected: false},
    {title: 'laudry'           , key: 'laverie'    , src: 'assets/laudry.svg'           , selected: false},
    {title: 'pet_allowed'      , key: 'animaux'    , src: 'assets/pet_allowed.svg'      , selected: false},
    {title: 'bin'              , key: 'poubelle'   , src: 'assets/bin.svg'              , selected: false},
    {title: 'bakery'           , key: 'boulangerie', src: 'assets/bakery.svg'           , selected: false},
    {title: 'pool'             , key: 'piscine'    , src: 'assets/pool.svg'             , selected: false},
    {title: 'winter-caravaning', key: 'caravaneige', src: 'assets/winter-caravaning.svg', selected: false}
  ]

  // The current lat/long position
  private currentGeoLocation$: Subject<geolocationPosition | undefined> = new Subject();
  currentGeoLocation: geolocationPosition | undefined = undefined;
  showCurrentLocationInMap: boolean = true;

  constructor(private openLayers: OpenLayersService,
              private openRoute: OpenRouteService,
              private park4Night: Park4nightService,
              private cdRef: ChangeDetectorRef){
    this.map = this.openLayers.map;
    this.driveMode = this.openRoute.driveMode;
    this.avoidDrive = this.openRoute.avoidDrive;
    this.vehicleType = this.openRoute.vehicleType;
  }

  ngAfterViewInit(): void {
    this.initializeMap();
    this.scree_aways_awake();
  }

  setMapCompany(company: string) {
    this.mapLayerCompany = company;
    this.mapLayerOptionsAvailiable = this.openLayers.getCompanyLayers(company);
  }

  setMapLayerOption(layerOption: string) {
    this.mapLayerOption = layerOption;
    this.openLayers.setMapLayer(this.mapLayerCompany,this.mapLayerOption);
  }

  setAvoid(avoid: string) {
    const index = this.choosedAvoids.indexOf(avoid);
    if (index < 0){
      this.choosedAvoids.push(avoid);
    } else {
      this.choosedAvoids.splice(index)
    }
  }

  routeBar() {
    if (this.routeBarIsActive && this.routePois && this.routePois.nativeElement.children.length > 1) {
      for(let i = 0; i < this.routePois.nativeElement.children.length; i++) {
        if (i > 0) {
          this.openLayers.removeFeature(this.routePois.nativeElement.children[i].id);
        }
      }
    }
    this.routeBarIsActive = !this.routeBarIsActive
  }

  showCamping() {
    if (this.campingBarIsActive) {
      const centerCoordinates = this.openLayers.coords_4326(this.map.getView().getCenter())
      this.park4Night.getCampings(centerCoordinates).subscribe((places: any) => {
        const newCampings = places.filter((place: any) => !this.campings.some((camping) => camping.id === place.id));
        this.campings.push(...newCampings);      
        this.drawCampings();
      });
    }
  }

  cleanMemory() {
    this.campings = [];
  }

  /**
   * Inicialize the openlayer map
   * Start the GeoData location
   * Center and zoom at it's location
   */
  private initializeMap(): void {
    this.map.setTarget(this.mapElement.nativeElement);
    this.openLayers.setMapLayer(this.mapLayerCompany,this.mapLayerOption);
    this.map.setView(this.openLayers.newView());
    this.start_geo_track();
    this.onGotGeoLocationZoonOnIt();

    // On map zoom in/out
    this.map.getView().on('change:resolution', () => {
      this.mapZoomValue = this.map.getView().getZoom();
      this.cdRef.detectChanges();
    })

    // On map click
    this.map.on('click', (event: any) => {
      const features = this.map.getFeaturesAtPixel(event.pixel);
      if (features && features.length > 0) {
        // if clicked on a feature
        //const camping = this.campings.find(x => x.id = features[0].values_.id);
        if (features[0].values_.id) {
          const url = `https://park4night.com/en/place/${features[0].values_.id}`;
          window.open(url, '_blank'); 

          // TODO: Criar a janela com as info do camping and feedbacks
          // this.park4Night.getFeedbacks(features[0].values_.id).subscribe(feedbacks =>{
          //   console.log(feedbacks);
          // });

        }
      } else {
        // if clicked out of features add a poi
        const name = `poi_${this.mapPois.length+1}`;
        const poiData = {
          name: name,
          coord: event.coordinate
        }
        this.mapPois.push(poiData)
        this.openLayers.addIconInTheMap(this.openLayers.coords_4326(event.coordinate),name,'assets/map-marker.png');

        if (!this.rightToolsIsActive || !this.routeBarIsActive) {
          this.rightToolsIsActive = true;
          this.routeBarIsActive = true;
          this.cdRef.detectChanges();
        }
        this.addPoisToRoute(poiData);
      }
    });

    // Create and add an camping overlay to the map
    this.campingOverlay = new Overlay({
      element: document.createElement('div'),
      offset: [10, 0], // Adjust the offset as needed
      positioning: 'bottom-left',
    });
    this.map.addOverlay(this.campingOverlay);

    // On mouse move
    this.map.on('pointermove', (event: any) => {
      const pixel = this.map.getEventPixel(event.originalEvent);
      const hasFeature = this.map.hasFeatureAtPixel(pixel);
      this.campingOverlay.getElement()!.style.display = 'none';
      if (hasFeature) {
        const feature = this.map.forEachFeatureAtPixel(pixel, (feature: any) => feature);
        if (feature && feature.values_.id) {
          this.showCampingOverlay(feature.values_.id,event.coordinate);
        } else {
          this.campingOverlay.getElement()!.style.display = 'none';
        }
      }
      this.map.getTargetElement().style.cursor = hasFeature ? 'pointer' : '';
    });
  }

  /**
   * Start the geo location reading and keep it avaliable into this.currentGeoLocation
   */
  private start_geo_track() {
    const options = {
      enableHighAccuracy: true,
      timeout: 1000,  // Timeout in milliseconds
      maximumAge: 0   // No maximum age for cached positions
    };

    navigator.geolocation.watchPosition(
      (geoLocation: geolocationPosition) => {
        this.currentGeoLocation = geoLocation;
        this.showCurrentPositionInMap();
        this.currentGeoLocation$.next(this.currentGeoLocation);
      },
      (error) => {
        console.log(`GetPosition Error: ${JSON.stringify(error)}`);
      },
      options
    );
  }

  /**
   * Show the current position on the map
   */
  private showCurrentPositionInMap() {
    if (this.currentGeoLocation && this.showCurrentLocationInMap) {
      const coords = [this.currentGeoLocation.coords?.longitude, this.currentGeoLocation.coords?.latitude];
      this.openLayers.drawCurrentLocation(coords)
    }
  }

  /**
   *  Request to keep screen wake all time the map is running
   */
  private scree_aways_awake() {
    const retryIn = 5000;
    if (document.visibilityState === 'visible'){
      navigator.wakeLock.request('screen').then(result =>{
        console.log(`wakeLock released: ${result.released}`);
      }).catch(error => {
        console.log(`Wake Lock request fail: ${JSON.stringify(error)}`);
      })
    } else {
      console.log(`Wake Lock request fail because the app is not visible. Will try again in ${retryIn/1000} secounds`);
      setTimeout(() => {
        this.scree_aways_awake();
      }, retryIn);
    }
  }

  /**
   * When the geolocation is avaliable, then execute the zoon
   */
  private onGotGeoLocationZoonOnIt(): void {
    const checkForGeoData = new Subject<string>();

    // Subscribe to changes in currentGeoLocation$
    this.currentGeoLocation$.subscribe(geoLocation => {
      if (geoLocation !== undefined) {
        checkForGeoData.next('YES');
        checkForGeoData.complete();
      } else {
        checkForGeoData.next('NO');
      }
    });

    // When there is a geolocation data, then zoom at it
    checkForGeoData.subscribe(() => {
      const coord: any[] = [this.currentGeoLocation?.coords?.longitude,this.currentGeoLocation?.coords?.latitude];
      this.openLayers.zoomToGeoLocation(coord, this.mapZoomValue);
    });
  }

  /**
   * Populate the route fields with the this.mapPois
   */
  private addPoisToRoute(poiData: any) {
    const poiDiv = document.createElement('div');
    poiDiv.id = poiData.name;
    poiDiv.style.display = 'flex';
    poiDiv.style.flexDirection = 'row';
    poiDiv.style.flexWrap = 'nowrap';
    poiDiv.style.alignContent = 'center';
    poiDiv.style.justifyContent = 'space-evenly';
    poiDiv.style.alignItems = 'stretch';

    const input = document.createElement('input');
    input.type = 'text';
    input.value = poiData.coord;
    input.style.display = 'flex';
    input.style.flexDirection = 'row';
    input.style.flexWrap = 'nowrap';
    input.style.alignContent = 'center';
    input.style.justifyContent = 'space-around';
    input.style.alignItems = 'stretch';
    input.style.width = '93%';
    input.style.height = '35px';
    input.style.borderRadius = '5px';
    input.style.fontSize = 'x-large';
    input.style.fontWeight = '600';

    const button = document.createElement('button');
    button.innerText = 'x';
    button.style.borderStyle = 'none';
    button.style.borderRadius = '5px';
    button.style.height = '27px';
    button.style.alignSelf = 'center';

    button.addEventListener('click', () => {
      for(let i=0; i<=this.routePois.nativeElement.children.length; i++) {
        if (this.routePois.nativeElement.children[i].id == poiData.name) {
          this.routePois.nativeElement.removeChild(  this.routePois.nativeElement.children[i] );
          break;
        }
      }
      this.openLayers.removeFeature(poiData.name);
    } );

    poiDiv.appendChild(input);
    poiDiv.appendChild(button);

    this.routePois.nativeElement.appendChild(poiDiv);

    const coods = this.openLayers.coords_4326(poiData.coord);
    this.openRoute.reverseGeoCode(coods[1],coods[0]).subscribe(result => {
      //TODO:
      console.log('reverseGeoCode',result);
    });

    const coords = [
      [this.currentGeoLocation?.coords?.longitude,this.currentGeoLocation?.coords?.latitude]
    ];
    for (let i = 0; i < this.mapPois.length; i++) {
      coords.push(this.openLayers.coords_4326(this.mapPois[i].coord));
    }

    // TODO:
    this.openRoute.drawRote(coords, this.choosedDriveMode, this.choosedAvoids, this.choosedTypeVehicle).subscribe(response => {
      console.log('drawRote',response);
    })
  }

  /**
   * Add the campings icons to the map
   */
  private drawCampings() {
    
    let counter = 0;
    this.campings.forEach((camping: any) => {
      
      this.openLayers.removeFeature(camping.name);
      
      const categoriesSelected = this.campingsIcons.filter(x => x.selected);
      const servicesSelected = this.campingServices.filter(x => x.selected);
      if (categoriesSelected.some((category) => category.category === camping.category.name) ) {

        let servicesOk = true;
        for(let i = 0; i < servicesSelected.length; i++) {
          if (parseInt(camping[servicesSelected[i].key]) <= 0){
            servicesOk = false;
            break;
          }
        }

        if (servicesOk) {
          const coords = [camping.location.longitude,camping.location.latitude];
          let iconPath = 'assets/maps-and-flags.png';
          const iconCategory: any = this.campingsIcons.find(x => x.category == camping.category.name);
          if (iconCategory) {
            iconPath = iconCategory.src;
          }
          this.openLayers.addIconInTheMap(coords, camping.name, iconPath, camping.id, camping.name);
        }
      }
      counter++
      if (counter >= this.campings.length){
        this.campingFiltering = false;
      } else {
        this.campingFiltering = true;
      }
      this.cdRef.detectChanges();
    });

  }

  /**
   * Show the camping ofloating window tooltip
   * @param id 
   * @param coords 
   */
  private showCampingOverlay(id: any, coords: any) {
    const camping = this.campings.find((p) => p.id === id);
    if (camping) {
      let photos = [];
      if (camping.photos && camping.photos.length > 0) {
        photos = camping.photos;
      }
      let description = '';
      if (camping.description_en) {
        description = camping.description_en;
      }

      let icons = '';
      if (camping.point_eau && parseInt(camping.point_eau)>0)
        icons+="<img src='assets/tap-water.svg' width='24px'> ";

      if (camping.eau_noire && parseInt(camping.eau_noire) > 0)
        icons+="<img src='assets/black-water.svg' width='24px'> ";

      if (camping.eau_usee && parseInt(camping.eau_usee) > 0)
        icons+="<img src='assets/gray-water.svg' width='24px'> ";

      if (camping.wc_public && parseInt(camping.wc_public) > 0)
        icons+="<img src='assets/public-toilet.svg' width='24px'> ";

      if (camping.douche && parseInt(camping.douche) > 0)
        icons+="<img src='assets/shower.svg' width='24px'> ";

      if (camping.electricite && parseInt(camping.electricite) > 0)
        icons+="<img src='assets/electricity.svg' width='24px'> ";

      if (camping.wifi && parseInt(camping.wifi) > 0)
        icons+="<img src='assets/wifi.svg' width='24px'> ";

      if (camping.laverie && parseInt(camping.laverie) > 0)
        icons+="<img src='assets/laudry.svg' width='24px'> ";

      if (camping.animaux && parseInt(camping.animaux) > 0)
        icons+="<img src='assets/pet_allowed.svg' width='24px'> ";

      if (camping.poubelle && parseInt(camping.poubelle) > 0)
        icons+="<img src='assets/bin.svg' width='24px'> ";

      if (camping.boulangerie && parseInt(camping.boulangerie) > 0)
        icons+="<img src='assets/bakery.svg' width='24px'> ";

      if (camping.piscine && parseInt(camping.piscine) > 0)
        icons+="<img src='assets/pool.svg' width='24px'> ";

      if (camping.caravaneige && parseInt(camping.caravaneige) > 0)
        icons+="<img src='assets/winter-caravaning.svg' width='24px'> ";

      let html = '';
      html += '<div>';
      html += '<div class="camping-header">';
      html += `Parking: ${camping.prix_stationnement} - service: ${camping.prix_services}`;
      html += '</div>';
      html += '<div class="camping-image"> ';
      for (let i = 0; i < photos.length; i++) {
        if (photos[i].link_thumb){
          html += `<img src="${photos[i].link_thumb}" width="180px"> `;
        }
      }
      html += '</div> ';
      html += '<div class="camping-description"> ';
      html += description;
      html += '</div> ';
      html += '<div class="camping-icons"> ';
      html += icons;
      html += '</div> ';
      html += '</div>'

      this.campingOverlay.getElement()!.innerHTML = html;


      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const overlayHeight = 450;
      let top = coords.y - scrollTop;
      if (top < 0) {
        top = 0;
      }
      if (top + overlayHeight > windowHeight) {
        top = windowHeight - overlayHeight;
      }

      this.campingOverlay.getElement()!.style.position = 'absolute';
      this.campingOverlay.getElement()!.style.top = `${top}px`;
      this.campingOverlay.getElement()!.style.left = `${coords.x}px`;

      this.campingOverlay.getElement()!.style.display = 'flex';
      this.campingOverlay.getElement()!.style.width = '500px';
      this.campingOverlay.getElement()!.style.height = '450px';
      this.campingOverlay.getElement()!.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
      this.campingOverlay.getElement()!.style.borderStyle = 'solid';
      this.campingOverlay.getElement()!.style.borderWidth = '2px';
      this.campingOverlay.getElement()!.style.borderRadius = '7px';
      this.campingOverlay.getElement()!.style.flexDirection = 'column';
      this.campingOverlay.getElement()!.style.flexWrap = 'nowrap';
      this.campingOverlay.getElement()!.style.alignContent = 'flex-start';
      this.campingOverlay.getElement()!.style.justifyContent = 'flex-start';
      this.campingOverlay.getElement()!.style.alignItems = 'stretch';

      const campingOverlayElem = this.campingOverlay.getElement()!;

      const campingHeader = campingOverlayElem.querySelector('.camping-header') as HTMLElement;
      campingHeader.style.width = '100%';
      campingHeader.style.minHeight = '25px';
      campingHeader.style.color = 'black';
      campingHeader.style.fontWeight = 'bold';
      campingHeader.style.fontSize = 'large';
      campingHeader.style.textAlign = 'center';

      const campingImage = campingOverlayElem.querySelector('.camping-image') as HTMLElement;
      campingImage.style.display = 'flex';
      campingImage.style.textAlign = 'center';
      campingImage.style.width = '100%';
      campingImage.style.height = '285px';
      campingImage.style.flexFlow = 'wrap';
      campingImage.style.placeContent = 'lex-end space-around';
      campingImage.style.flexDirection = 'column';
      campingImage.style.flexWrap = 'wrap';
      campingImage.style.alignContent = 'center';
      campingImage.style.justifyContent = 'flex-start';
      campingImage.style.alignItems = 'stretch';

      const campingDescription = campingOverlayElem.querySelector('.camping-description') as HTMLElement;
      campingDescription.style.width = '100%';
      campingDescription.style.height = '100px';
      campingDescription.style.overflowY = 'auto';
      campingDescription.style.color = 'black';
      campingDescription.style.fontSize = 'medium';
      campingDescription.style.fontWeight = 'bold';

      const campingIcons = campingOverlayElem.querySelector('.camping-icons') as HTMLElement;
      campingIcons.style.width = '100%';
      campingIcons.style.height = '25px';

      this.campingOverlay.setPosition(coords);
    }
  }


}
