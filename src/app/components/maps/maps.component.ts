import { AfterViewInit, Component, ElementRef, ViewChild, ChangeDetectorRef, OnInit } from '@angular/core';
import { OpenLayersService } from '../../services/open-layers.service';
import { OpenRouteService } from '../../services/open-route.service';
import { Park4nightService } from '../../services/park4night.service';
import { Subject, throwError, of, Observable } from 'rxjs';
import { retryWhen, delay, mergeMap, timeout, startWith, map, catchError } from 'rxjs/operators';
import { Overlay, Tile } from 'ol';
import { FormControl } from '@angular/forms';
import { emulate_rote } from '../map/emulate';
import { HttpClient } from '@angular/common/http';
import { any } from 'video.js/dist/types/utils/events';


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

// Route interfaces
interface step {
  distance: number,
  duration: number,
  instruction: string,
  name: string,
  type: number,
  way_points: number[],
  status: string,
  lastDistance: number,
  warn_500: boolean,
  warn_250: boolean,
  warn_100: boolean
}

interface segment {
  distance: number,
  duration: number,
  steps: step[],
  status: string | undefined | null
}

interface route {
  bbox: number[],
  geometry: string,
  segments: segment[],
  summary: any,
  way_points: number[]
}

interface routes {
  bbox: number[],
  metadata: any,
  routes: route[],

}

@Component({
  selector: 'app-maps',
  templateUrl: './maps.component.html',
  styleUrl: './maps.component.scss'
})
export class MapsComponent implements AfterViewInit, OnInit {  //OnInit

  // The map
  @ViewChild('mapElement', { static: false }) mapElement!: ElementRef;
  map: any;

  // The map search
  @ViewChild('mapSearchInput') mapSearchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('openrouteSearch') openrouteSearch!: ElementRef<HTMLInputElement>;
  placeSearchOptions: any[] = [];
  mapSearchControl = new FormControl('');
  mapFilteredOptions: any[] = [];

  // Controllers visibility
  rightToolsIsActive: boolean = false;
  layersBarIsActive: boolean = false;
  routeBarIsActive: boolean = false;
  campingBarIsActive: boolean = false;
  campingFiltering: boolean = false;
  infoBar: boolean = false;

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
  driving: boolean = false;
  routeSteps: routes | undefined = undefined;
  simulateRote: any[] | undefined = undefined; //emulate_rote;  //undefined;
  reRouting: any = {to_route: false, did_reroute: false};
  textGuidance: string = '';
  iconGuidance: any[] = [
    {type: 0, path: 'assets/drive-guidance-left.png'},
    {type: 1, path: 'assets/drive-guidance-right.png'},
    {type: 2, path: 'assets/drive-guidance-sharp-left.png'},
    {type: 3, path: 'assets/drive-guidance-sharp-right.png'},
    {type: 4, path: 'assets/drive-guidance-slight-left.png'},
    {type: 5, path: 'assets/drive-guidance-slight-right.png'},
    {type: 6, path: 'assets/drive-guidance-straight.png'},
    {type: 7, path: 'assets/drive-guidance-enter-roundabout.png'},
    {type: 8, path: 'assets/drive-guidance-exit-roundabout.png'},
    {type: 9, path: 'assets/drive-guidance-u-turn.png'},
    {type: 10, path: 'assets/drive-guidance-goal.png'},
    {type: 11, path: 'assets/drive-guidance-depart.png'},
    {type: 12, path: 'assets/drive-guidance-keep-left.png'},
    {type: 13, path: 'assets/drive-guidance-keep-right.png'}
  ];
  iconGuidancePath: string = '';
  driveGuidanceData: any = {
    distance: '',
    duration: '',
    eta: ''
  }
  drivingSpeed: number = 0;

  // Campings options
  campings: any[] = [];

  campingsMenu = [
    {
      title: 'Parking',
      icon: 'assets/PARKING_LOT_DAY_NIGHT.png',
      selected: false
    },
    {
      title: 'Camping',
      icon: 'assets/CAMPING.png',
      selected: false
    },
    {
      title: 'ASA',
      icon: 'assets/campingcarportugal.png',
      selected: false
    },
    {
      title: 'Shopping',
      icon: 'assets/restaurant.png',
      selected: false
    },
    {
      title: 'Laundry',
      icon: 'assets/laudry.png',
      selected: false
    },
  ]

  campingsIcons = [
    // { category: 'Fuel Station'                , src: 'assets/gas-pump.png'              ,'selected': true  },
    // { category: 'Showers'                     , src: 'assets/shower.png'                ,'selected': true  },
    // { category: 'Sanitation Dump Station'     , src: 'assets/undercarriage.png'         ,'selected': true  },
    // { category: 'Wifi'                        , src: 'assets/wifi-signal.png'           ,'selected': true  },
    // { category: 'Established Campground'      , src: 'assets/CAMPING.png'               ,'selected': true  },
    // { category: 'Wild Camping'                , src: 'assets/tent.png'                  ,'selected': true  },
    // { category: 'Informal Campsite'           , src: 'assets/lamp.png'                  ,'selected': true  },
    // { category: 'Water'                       , src: 'assets/faucet.png'                ,'selected': true  },
    // { category: 'Tourist Attraction'          , src: 'assets/travel-and-tourism.png'    ,'selected': true  },
    { category: 'PARKING LOT DAY/NIGHT'       , src: 'assets/PARKING_LOT_DAY_NIGHT.png' ,'selected': true  },
    { category: 'EXTRA SERVICES'              , src: 'assets/EXTRA_SERVICES.png'        ,'selected': true  },
    { category: 'CAMPING'                     , src: 'assets/CAMPING.png'               ,'selected': true  },
    { category: 'PRIVATE CAR PARK FOR CAMPERS', src: 'assets/MOTORHOME_AREA.png'        ,'selected': true  },
    { category: 'PAYING MOTORHOME AREA'       , src: 'assets/paying_motorhome_area.png' ,'selected': true  },
    { category: 'ON THE FARM'                 , src: 'assets/ON_THE_FARM.png'           ,'selected': true  },
    { category: 'SURROUNDED BY NATURE'        , src: 'assets/SURROUNDED_BY_NATURE.png'  ,'selected': true  },
    { category: 'DAILY PARKING LOT ONLY'      , src: 'assets/DAILY_PARKING_LOT_ONLY.png','selected': true  },
    { category: 'PICNIC AREA'                 , src: 'assets/PICNIC_AREA.png'           ,'selected': true  },
    { category: 'OFF-ROAD'                    , src: 'assets/jeep.png'                  ,'selected': true  },
    { category: 'REST AREA'                   , src: 'assets/restaurant.png'            ,'selected': true  },
    { category: 'HOMESTAYS ACCOMMODATION'     , src: 'assets/homestay.png'              ,'selected': true  },
    { category: 'INTERMACHE'                  , src: 'assets/intermarche.png'           ,'selected': true  },
    { category: 'EUROSTOPS'                   , src: 'assets/eurostops.png'             ,'selected': true  },
    { category: 'CAMPINGCARPORTUGAL'          , src: 'assets/campingcarportugal.png'    ,'selected': true  },
    { category: 'AREASAC'                     , src: 'assets/areasac.ico'               ,'selected': true  },
    { category: 'CAMPINGCARPARK'              , src: 'assets/campingcarpark.ico'        ,'selected': true  },
    { category: 'AEAE'                        , src: 'assets/AEAE.png'                  ,'selected': true  },
    { category: 'CAMPERSTOP'                  , src: 'assets/CAMPERSTOP.png'            ,'selected': true  },
    { category: 'CAMPERCONTACT'               , src: 'assets/CAMPERCONTACT.ico'         ,'selected': true  },
    { category: 'REVOLUTION'                  , src: 'assets/REVOLUTION.ico'            ,'selected': true  },
    { category: 'BLOOMESTLAUNDRY'             , src: 'assets/BLOOMESTLAUNDRY.webp'      ,'selected': true  },
    { category: 'LAWASH'                      , src: 'assets/LAWASH.png'                ,'selected': true  },
    { category: 'openroute'                   , src: 'assets/map-marker.png'            ,'selected': true  }
  ];

  campingOverlay!: Overlay;
  campingServices = [
    {title: 'tap-water'        , key: 'point_eau'  , src: 'assets/tap-water.svg'        , selected: false },
    {title: 'black-water'      , key: 'eau_noire'  , src: 'assets/black-water.svg'      , selected: false },
    {title: 'gray-water'       , key: 'eau_usee'   , src: 'assets/gray-water.svg'       , selected: false },
    {title: 'public-toilet'    , key: 'wc_public'  , src: 'assets/public-toilet.svg'    , selected: false },
    {title: 'shower'           , key: 'douche'     , src: 'assets/shower.svg'           , selected: false },
    {title: 'electricity'      , key: 'electricite', src: 'assets/electricity.svg'      , selected: false },
    {title: 'wifi'             , key: 'wifi'       , src: 'assets/wifi.svg'             , selected: false },
    {title: 'laudry'           , key: 'laverie'    , src: 'assets/laudry.svg'           , selected: false },
    {title: 'pet_allowed'      , key: 'animaux'    , src: 'assets/pet_allowed.svg'      , selected: false },
    {title: 'bin'              , key: 'poubelle'   , src: 'assets/bin.svg'              , selected: false },
    {title: 'bakery'           , key: 'boulangerie', src: 'assets/bakery.svg'           , selected: false },
    {title: 'pool'             , key: 'piscine'    , src: 'assets/pool.svg'             , selected: false },
    {title: 'winter-caravaning', key: 'caravaneige', src: 'assets/winter-caravaning.svg', selected: false }
  ]

  // The current lat/long position
  private currentGeoLocation$: Subject<geolocationPosition | undefined> = new Subject();
  currentGeoLocation: geolocationPosition | undefined = undefined;
  showCurrentLocationInMap: boolean = true;
  watchPositionId: number = 0;

  constructor(private openLayers: OpenLayersService,
              private openRoute: OpenRouteService,
              private park4Night: Park4nightService,
              private cdRef: ChangeDetectorRef,
              private httpClient: HttpClient){
    this.map = this.openLayers.map;
    this.driveMode = this.openRoute.driveMode;
    this.avoidDrive = this.openRoute.avoidDrive;
    this.vehicleType = this.openRoute.vehicleType;
    this.mapFilteredOptions = this.placeSearchOptions.slice();
  }
  ngOnInit(): void {
    if (sessionStorage.getItem('cruising') == 'true') {
      this.campingsIcons.push({ category: 'cruising', src: 'assets/dick.png','selected': false });
    }
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
    this.layersBarIsActive = false;
    this.campingBarIsActive = false;
    if (!this.driving && this.routeBarIsActive && this.routePois && this.routePois.nativeElement.children.length > 1) {
      for(let i = 0; i < this.routePois.nativeElement.children.length; i++) {
        if (i > 0) {
          this.openLayers.removeFeature(this.routePois.nativeElement.children[i].id);
          this.mapPois.splice(this.mapPois.findIndex(x => x.name == this.routePois.nativeElement.children[i].id),1)
        }
      }
      this.openLayers.removeVectorLayer("routeFeature");
    }
    this.routeBarIsActive = !this.routeBarIsActive

    setTimeout(()=>{
      if (this.mapPois.length > 0 && this.routeBarIsActive) {
        this.mapPois.forEach(poi => {
          this.addPoisToRoute(poi);
        });
      }
    },250);

  }

  async showCamping() {
    if (this.campingBarIsActive) {
      this.layersBarIsActive = false;
      // if (this.routeBarIsActive){
      //   this.routeBar();
      //   this.campingBarIsActive = true;
      // }

      const centerCoordinates = this.openLayers.coords_4326(this.map.getView().getCenter())

      // park4Night
      const pk4n8 = [
        this.campingsIcons.find(x => x.category == 'PARKING LOT DAY/NIGHT'),
        this.campingsIcons.find(x => x.category == 'EXTRA SERVICES'),
        this.campingsIcons.find(x => x.category == 'PRIVATE CAR PARK FOR CAMPERS'),
        this.campingsIcons.find(x => x.category == 'PAYING MOTORHOME AREA'),
        this.campingsIcons.find(x => x.category == 'ON THE FARM'),
        this.campingsIcons.find(x => x.category == 'SURROUNDED BY NATURE'),
        this.campingsIcons.find(x => x.category == 'DAILY PARKING LOT ONLY'),
        this.campingsIcons.find(x => x.category == 'PICNIC AREA'),
        this.campingsIcons.find(x => x.category == 'OFF-ROAD'),
        this.campingsIcons.find(x => x.category == 'REST AREA'),
        this.campingsIcons.find(x => x.category == 'HOMESTAYS ACCOMMODATION'),
      ]
      if (pk4n8.filter((x: any) => x.selected).length > 0) {
        const places = await this.park4Night.getCampings(centerCoordinates)
                                            .pipe(
                                              timeout(10000),
                                              catchError(async (err: any) => {
                                                if (err.name === 'TimeoutError') {
                                                  // Handle the timeout error
                                                  console.error('Park4Night fail on request places');
                                                  const placesDB = await this.park4Night.getCampingsDB(centerCoordinates).toPromise();
                                                  console.log(`Park4Night places from DB ${placesDB.length}`);
                                                  return placesDB;
                                                }
                                                return throwError(err);  // Rethrow other errors
                                              })                                          )
                                            .toPromise();
        const newCampings = places.filter((place: any) => !this.campings.some((camping) => camping.id === place.id));
        this.campings.push(...newCampings);
      }

      // cruising
      const cruising: any = this.campingsIcons.find(x => x.category == 'cruising');
      if (cruising && cruising.selected) {
        const cruisingUrl = `http://cruzmv.ddns.net:3000/get_cruiser_list?lat=${centerCoordinates[1]}&long=${centerCoordinates[0]}`;

        const cruisingData: any  = await this.httpClient.get(cruisingUrl).toPromise();
        for (let i = 0; i < cruisingData.data.length; i++) {
          const place = cruisingData.data[i];
          this.campings.push({
            id: `${place.title_place} \n\n ${place.place_place} \n\n ${place.description_place}`,
            name: `${place.title_place} - ${place.place_place}`,
            note_moyenne: place.title_place,
            nb_commentaires: place.place_place,
            description_en: place.description_place,
            site_internet: place.more_place,
            category: {
              name: 'cruising'
            },
            location: {
              latitude: place.latitude,
              longitude: place.longitude
            }
          })
        }
      }

      // Intermache
      const intermarche: any = this.campingsIcons.find(x => x.category == 'INTERMACHE');
      if (intermarche && intermarche.selected) {
        const intermarchegUrl = `http://cruzmv.ddns.net:3000/get_intermache_list?lat=${centerCoordinates[1]}&long=${centerCoordinates[0]}`;
        const intermarcheData: any  = await this.httpClient.get(intermarchegUrl).toPromise();
        for (let i = 0; i < intermarcheData.data.length; i++) {
          const place = intermarcheData.data[i];

          this.campings.push({
            id: `${place.title} \n\n ${place.address} \n\n ${place.label}`,
            name: `${place.title} - ${place.label}`,
            note_moyenne: place.title,
            nb_commentaires: place.label,
            description_en: place.address,
            site_internet: place.url,
            category: {
              name: 'INTERMACHE'
            },
            location: {
              latitude: place.latitude,
              longitude: place.longitude
            }
          })
        }
      }

      // Eurostops
      const eurostops: any = this.campingsIcons.find(x => x.category == 'EUROSTOPS');
      if (eurostops && eurostops.selected) {
        const eurostopsgUrl = `http://cruzmv.ddns.net:3000/get_eurostops_list?lat=${centerCoordinates[1]}&long=${centerCoordinates[0]}`;
        const eurostopsData: any  = await this.httpClient.get(eurostopsgUrl).toPromise();
        for (let i = 0; i < eurostopsData.data.length; i++) {
          const place = eurostopsData.data[i];
          this.campings.push({
            id: `${place.eurostop_id}-${place.eurostop_name}}`,
            name: `${place.eurostop_name}`,
            address: `${place.eurostop_address} - ${place.eurostop_street}`,
            pays: `${place.eurostop_country}`,
            description_en: `${place.eurostop_description}`,
            nb_commentaires: `${place.eurostop_name}`,
            note_moyenne: `${place.eurostop_name}`,
            mail: `${place.eurostop_mail}`,
            site_internet: `https://eurostops.pt/pesquisa?q=${place.eurostop_street}`,   //`${place.eurostop_website}`,
            tel: `${place.eurostop_tel}`,
            code_postal: `${place.eurostop_postal_code}`,
            category: {
              name: 'EUROSTOPS'
            },
            location: {
              latitude: place.eurostop_latitude,
              longitude: place.eurostop_longitude
            },
            photos: place.photos ? place.photos.map((photo: any) => ({...photo, link_thumb: `https://autocaravanismo.pt/viewer/${photo.url}`})) : null
          })
        }
      }

      //campingcarportugal
      const campingcarportugal: any = this.campingsIcons.find(x => x.category == 'CAMPINGCARPORTUGAL');
      if (campingcarportugal && campingcarportugal.selected) {
        const campingcarportugalUrl = `http://cruzmv.ddns.net:3000/get_campingcarportugal_list?lat=${centerCoordinates[1]}&long=${centerCoordinates[0]}`;
        const campingcarportugalData: any  = await this.httpClient.get(campingcarportugalUrl).toPromise();
        for (let i = 0; i < campingcarportugalData.data.length; i++) {
          const place = campingcarportugalData.data[i];

          this.campings.push({
            id: `${place.nomeasmorada}-${place.distritocoordenadas}}`,
            name: `${place.nomeasmorada}`,
            note_moyenne: `${place.nomeasmorada}`,
            nb_commentaires: `${place.distritocoordenadas}`,
            category: {
              name: 'CAMPINGCARPORTUGAL'
            },
            location: {
              latitude: place.latitude,
              longitude: place.longitude
            },
            description_en: place.descricaodaarea,
            point_eau: place.aguatarifa,
            despaguascinz: place.despaguascinz,
            eau_usee: place.despaguascinz,
            eau_noire: place.despwcquim,
            electricite: place.tarifa220v,
            wc_public: place.wc,
            wifi: place.wifipreco
          })
        }
      }

      // areasac
      const areasac: any = this.campingsIcons.find(x => x.category == 'AREASAC');
      if (areasac && areasac.selected) {
        const areasacUrl = `http://cruzmv.ddns.net:3000/get_areasac_list?lat=${centerCoordinates[1]}&long=${centerCoordinates[0]}`;
        const areasacData: any  = await this.httpClient.get(areasacUrl).toPromise();
        for (let i = 0; i < areasacData.data.length; i++) {
          const place = areasacData.data[i];

          this.campings.push({
            id: `${place.title}-${place.type}}`,
            name: `${place.title}`,
            description_en: `${place.type}`,
            category: {
              name: 'AREASAC'
            },
            location: {
              latitude: place.latitude,
              longitude: place.longitude
            },
            site_internet: `https://www.areasac.es${place.link}`
          })
        }
      }

      // campingcarpark
      const campingcarpark: any = this.campingsIcons.find(x => x.category == 'CAMPINGCARPARK');
      if (campingcarpark && campingcarpark.selected) {
        const campingcarparkUrl = `http://cruzmv.ddns.net:3000/get_campingcarpark_list?lat=${centerCoordinates[1]}&long=${centerCoordinates[0]}`;
        const campingcarparkData: any  = await this.httpClient.get(campingcarparkUrl).toPromise();
        for (let i = 0; i < campingcarparkData.data.length; i++) {
          const place = campingcarparkData.data[i];
          const placeData = JSON.parse(place.data)

          this.campings.push({
            id: `${placeData.name}-${place.type}}`,
            name: `${placeData.name}`,
            note_moyenne: `${placeData.averageRating}`,
            description_en: `${placeData.name} - ${placeData.type} - status: ${placeData.status} - Price: ${placeData.currentPrice}`,
            category: {
              name: 'CAMPINGCARPARK'
            },
            location: {
              latitude: place.latitude,
              longitude: place.longitude
            },
            photos: [{link_thumb: placeData.image }],
            site_internet: `https://www.campingcarpark.com${placeData.slug}`
          })
        }
      }

      // AEAE
      const AEAE: any = this.campingsIcons.find(x => x.category == 'AEAE');
      if (AEAE && AEAE.selected) {
        const AEAEUrl = `http://cruzmv.ddns.net:3000/get_AEAE_list?lat=${centerCoordinates[1]}&long=${centerCoordinates[0]}`;
        const AEAEData: any  = await this.httpClient.get(AEAEUrl).toPromise();
        for (let i = 0; i < AEAEData.data.length; i++) {
          const place = AEAEData.data[i];

          this.campings.push({
            id: `${place.properties.name}-${place.type}}`,
            name: `${place.properties.name}`,
            description_en: `${place.properties.name} -${place.type}`,
            category: {
              name: 'AEAE'
            },
            location: {
              latitude: place.geometry.coordinates[1],
              longitude: place.geometry.coordinates[0]
            },
            site_internet: `https://www.google.com/maps?q=${place.geometry.coordinates[1]},${place.geometry.coordinates[0]}`
          })
        }
      }

      // CAMPERSTOP
      const CAMPERSTOP: any = this.campingsIcons.find(x => x.category == 'CAMPERSTOP');
      if (CAMPERSTOP && CAMPERSTOP.selected) {
        const CAMPERSTOPUrl = `http://cruzmv.ddns.net:3000/get_camperstop_list?lat=${centerCoordinates[1]}&long=${centerCoordinates[0]}`;
        const CAMPERSTOPData: any  = await this.httpClient.get(CAMPERSTOPUrl).toPromise();
        for (let i = 0; i < CAMPERSTOPData.data.length; i++) {
          const place = CAMPERSTOPData.data[i];

          const photos = [
            {
              link_thumb: place.data.imageurl
            }
          ];

          for (let j = 0; j < place.data.media.length; j++) {
            photos.push({
              link_thumb: place.data.media[j].url
            })
          }

          this.campings.push({
            id: `${place.id}`,
            name: `${place.name}`,
            description_en: `${place.name} Address: ${place.data.address} - Rate: ${place.data.camperRate} - distanceSupermarket: ${place.data.distanceSupermarket} - numberOfPlaces: ${place.data.numberOfPlaces}`,
            category: {
              name: 'CAMPERSTOP'
            },
            location: {
              latitude: place.latitude,
              longitude: place.longitude
            },
            site_internet: `https://camperstop.com/${place.data.websiteurl.replace('nl/','en/')}`,
            photos: photos,
            data: place.data
          })
        }
      }

      // CAMPERCONTACT
      const CAMPERCONTACT: any = this.campingsIcons.find(x => x.category == 'CAMPERCONTACT');
      if (CAMPERCONTACT && CAMPERCONTACT.selected) {
        const CAMPERCONTACTUrl = `http://cruzmv.ddns.net:3000/get_campercontact_list?lat=${centerCoordinates[1]}&long=${centerCoordinates[0]}`;
        const CAMPERCONTACTData: any  = await this.httpClient.get(CAMPERCONTACTUrl).toPromise();
        for (let i = 0; i < CAMPERCONTACTData.data.length; i++) {
          const place = CAMPERCONTACTData.data[i];

          this.campings.push({
            id: `${place.id}`,
            name: `${place.title}`,
            note_moyenne: place.data._source.filters.rating,
            description_en: `${place.name} ${place.data._source.subtitle}`,
            category: {
              name: 'CAMPERCONTACT'
            },
            location: {
              latitude: place.latitude,
              longitude: place.longitude
            },
            site_internet: `https://www.campercontact.com/en${place.data._source.permalink}`,
            photos: [{link_thumb: place.data._source.thumbnail}],
            data: place.data
          })
        }
      }


      //REVOLUTION
      const REVOLUTION: any = this.campingsIcons.find(x => x.category == 'REVOLUTION');
      if (REVOLUTION && REVOLUTION.selected) {
        const REVOLUTIONUrl = `http://cruzmv.ddns.net:3000/get_REVOLUTION_list?lat=${centerCoordinates[1]}&long=${centerCoordinates[0]}`;
        const REVOLUTIONData: any  = await this.httpClient.get(REVOLUTIONUrl).toPromise();
        for (let i = 0; i < REVOLUTIONData.data.data.length	; i++) {
          const place = REVOLUTIONData.data.data[i];

          this.campings.push({
            id: `${place.ID}`,
            name: `${place.location.name}`,
            description_en: `${place.location.openingHours} - ${place.location.address1}, ${place.location.address2}, ${place.location.address3} ${place.location.city} ${place.location.zip} ${place.location.country}`,
            category: {
              name: 'REVOLUTION'
            },
            location: {
              latitude: place.location.geoCoordinates.latitude,
              longitude: place.location.geoCoordinates.longitude
            },
            site_internet: `https://www.google.com/maps?q=${place.location.geoCoordinates.latitude},${place.location.geoCoordinates.longitude}`
          })
        }
      }

      //BLOOMESTLAUNDRY
      const BLOOMESTLAUNDRY: any = this.campingsIcons.find(x => x.category == 'BLOOMESTLAUNDRY');
      if (BLOOMESTLAUNDRY && BLOOMESTLAUNDRY.selected) {
        const BLOOMESTLAUNDRYUrl = `http://cruzmv.ddns.net:3000/get_BLOOMESTLAUNDRY_list?lat=${centerCoordinates[1]}&long=${centerCoordinates[0]}`;
        const BLOOMESTLAUNDRYData: any  = await this.httpClient.get(BLOOMESTLAUNDRYUrl).toPromise();
        for (let i = 0; i < BLOOMESTLAUNDRYData.data.objects.length; i++) {
          const place = BLOOMESTLAUNDRYData.data.objects[i];

          this.campings.push({
            id: `${place.object_id}`,
            name: `${place.title}`,
            description_en: `${place.title} - ${place.object_name} - ${place.author_name} - ${place.terms}`,
            category: {
              name: 'BLOOMESTLAUNDRY'
            },
            location: {
              latitude: place.lat,
              longitude: place.lng
            },
            site_internet: `https://www.google.com/maps?q=${place.lat},${place.lng}`
          })
        }
      }

      //LAWASH
      const LAWASH: any = this.campingsIcons.find(x => x.category == 'LAWASH');
      if (LAWASH && LAWASH.selected) {
        const LAWASHUrl = `http://cruzmv.ddns.net:3000/get_LAWASH_list?lat=${centerCoordinates[1]}&long=${centerCoordinates[0]}`;
        const LAWASHData: any  = await this.httpClient.get(LAWASHUrl).toPromise();
        for (let i = 0; i < LAWASHData.data.length; i++) {
          const place = LAWASHData.data[i];

          this.campings.push({
            id: `${place.address}`,
            name: `${place.address}`,
            description_en: `${place.address} - ${place.description} - ${JSON.stringify(place.details)}`,
            category: {
              name: 'LAWASH'
            },
            location: {
              latitude: place.latitude,
              longitude: place.longitude
            },
            site_internet: place.url,
            photos: [{link_thumb: place.photo}]
          })
        }
      }


      //openroute
      const openRoute: any = this.campingsIcons.find(x => x.category == 'openroute');
      if (openRoute && openRoute.selected && this.openrouteSearch.nativeElement.value.length > 0) {
        const openrouteUrl = `http://cruzmv.ddns.net:3000/search_openroute?lat=${centerCoordinates[1]}&long=${centerCoordinates[0]}&q=${this.openrouteSearch.nativeElement.value}`;
        const openrouteData: any  = await this.httpClient.get(openrouteUrl).toPromise();
        for (let i = 0; i < openrouteData.data.features.length; i++) {
          const place = openrouteData.data.features[i];
          let site = undefined;
          try{
            site = place.properties.addendum ? place.properties.addendum.osm.website : undefined;
          } catch (e) {
            console.error('Error on openroute', e);
          }

          this.campings.push({
            id: `${place.properties.id}`,
            name: `${place.properties.label}`,
            description_en: JSON.stringify(place),
            category: {
              name: 'openroute'
            },
            location: {
              latitude: place.geometry.coordinates[1],
              longitude: place.geometry.coordinates[0]
            },
            site_internet: site ? site : `https://www.google.com/maps?q=${place.geometry.coordinates[1]},${place.geometry.coordinates[0]}`
          })

        }
      }

      this.drawCampings();
    }
  }

  cleanCampings() {
    this.campings.forEach(element => {
      this.openLayers.removeFeature(element.name);
    });
    this.campings = [];
    this.campingsIcons.map(x => x.selected = false);
    this.campingServices.map(x => x.selected = false);
  }

  drawRoute() {
    this.drawTheRoute()
  }

  reCenter() {
    const coord: any[] = [this.currentGeoLocation?.coords?.longitude,this.currentGeoLocation?.coords?.latitude];
    this.openLayers.zoomToGeoLocation(coord, this.mapZoomValue);
  }

  onSearchEnterKey() {
    // const place: any = this.placeSearchOptions.find(x => x.value == event.target.value);
    // if (place){
    //   //this.openLayers.addIconInTheMap(place.data.geometry.coordinates,'testeagora','assets/map-marker.png');
    //   this.mapZoomValue = 19;
    //   this.openLayers.zoomToGeoLocation(place.data.geometry.coordinates, this.mapZoomValue);
    // }

  }

  // TODO: after clear up the quota......
  mapSearchFilter(selected: boolean): void {
    // const filterValue = this.mapSearchInput.nativeElement.value.toLowerCase();
    // this.mapFilteredOptions = this.placeSearchOptions.filter(o => o.label.toLowerCase().includes(filterValue));

    // may be have the observables all into a promisse and execute the this.mapFilteredOptions filter after all finhed
    const searchString = this.mapSearchInput.nativeElement.value;
    if (!selected && searchString.length > 3){
      const regex = /^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
      if (regex.test(searchString)) {

        this.mapZoomValue = 17;
        let coordinates = searchString.split(',').map(parseFloat);
        coordinates = this.openLayers.coords_4326(coordinates);
        this.openLayers.zoomToGeoLocation(coordinates, this.mapZoomValue);

      } else {
        const coords = this.openLayers.coords_4326(this.map.getView().getCenter());
        // First get the country og geo position
        this.openRoute.reverseGeoCode(coords[1],coords[0]).subscribe((geoResponse: any) => {
          if (geoResponse.features.length > 0) {
            const country = geoResponse.features[0].properties.country_a;
            // With the country, search on the autocompleate service
            this.openRoute.autoComplete(searchString,country).subscribe((response: any) => {
              response.features.forEach((place: any) => {
                if (this.placeSearchOptions.find((x: any) => x.label == place.properties.label && x.value == place.properties.localadmin) == undefined) {
                  this.placeSearchOptions.push({
                    label: place.properties.label,
                    value: place.properties.localadmin,
                    data: place
                  });
                }
              });

              // Then add the search service into the results
              this.openRoute.geoSearch(searchString,country).subscribe(response => {
                response.features.forEach((place: any) => {
                  if (this.placeSearchOptions.find(x => x.label == place.properties.label && x.value == place.properties.localadmin) == undefined) {
                    this.placeSearchOptions.push({
                      label: place.properties.label,
                      value: place.properties.localadmin,
                      data: place
                    });

                    console.log('this.placeSearchOptions', this.placeSearchOptions);
                    // TODO: double check on this filter, should remove the accents too
                    this.mapFilteredOptions = this.placeSearchOptions.filter(o => o.label.toLowerCase().includes(searchString.toLowerCase()));
                    console.log('this.mapFilteredOptions', this.mapFilteredOptions);

                  }
                });
              });
            })
          }
        });
      }
    }
  }

  /*
  searchPlace(event: any, selected: boolean = false) {
    if (event.srcElement.value.length >= 3 ) {
      if ((event.keyCode >= 65 && event.keyCode <= 90) || // A-Z
          (event.keyCode >= 48 && event.keyCode <= 57) || // 0-9
          (event.keyCode >= 96 && event.keyCode <= 105) || // Numpad 0-9
           event.keyCode == 8 || event.keyCode == 46 ) {

        const coords = this.openLayers.coords_4326(this.map.getView().getCenter());
        this.openRoute.reverseGeoCode(coords[1],coords[0]).subscribe((geoResponse: any) => {
          if (geoResponse.features.length > 0) {
            const country = geoResponse.features[0].properties.country_a;
            this.openRoute.autoComplete(event.srcElement.value,country).subscribe((response: any) => {

              response.features.forEach((place: any) => {
                if (this.placeSearchOptions.find((x: any) => x.label == place.properties.label && x.value == place.properties.localadmin) == undefined) {
                  this.placeSearchOptions.push({
                    label: place.properties.label,
                    value: place.properties.localadmin,
                    data: place
                  });
                }
              });

              this.openRoute.geoSearch(event.srcElement.value,country).subscribe(response => {
                response.features.forEach((place: any) => {
                  if (this.placeSearchOptions.find(x => x.label == place.properties.label && x.value == place.properties.localadmin) == undefined) {
                    this.placeSearchOptions.push({
                      label: place.properties.label,
                      value: place.properties.localadmin,
                      data: place
                    });
                  }
                });
              });

            })
          }
        });
      } else if (event.keyCode == 13 || selected){
        const place: any = this.placeSearchOptions.find(x => x.value == event.target.value);
        if (place){
          //this.openLayers.addIconInTheMap(place.data.geometry.coordinates,'testeagora','assets/map-marker.png');
          this.mapZoomValue = 19;
          this.openLayers.zoomToGeoLocation(place.data.geometry.coordinates, this.mapZoomValue);
        }
      }
    } else {
      this.placeSearchOptions = [];
    }
  }
  */

  startDrive() {
    this.routeBarIsActive = false;
    this.mapZoomValue = 19;
    const coord: any[] = [this.currentGeoLocation?.coords?.longitude,this.currentGeoLocation?.coords?.latitude];
    this.openLayers.zoomToGeoLocation(coord, this.mapZoomValue);
    this.driving = true;

    this.start_geo_track();
    this.onDriving();
  }


  campingMenuClick(menu: any){
    menu.selected = !menu.selected;
    this.updatePois();
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
        if (features[0].values_.id) {

          // Is it a POI ?
          const regex = /^poi_\d+$/;
          if (regex.test(features[0].values_.id)) {
            // do nothing
          } else {
            let url = `https://park4night.com/en/place/${features[0].values_.id}`;
            let place = this.campings.find(x => x.id === features[0].values_.id);
            if (place && (place.category.name == 'cruising' ||
                          place.category.name == 'INTERMACHE' ||
                          place.category.name == 'EUROSTOPS' ||
                          place.category.name == 'AREASAC' ||
                          place.category.name == 'CAMPINGCARPARK' ||
                          place.category.name == 'AEAE' ||
                          place.category.name == 'REVOLUTION' ||
                          place.category.name == 'BLOOMESTLAUNDRY' ||
                          place.category.name == 'LAWASH' ||
                          place.category.name == 'openroute' ||
                          place.category.name == 'CAMPERSTOP' ||
                          place.category.name == 'CAMPERCONTACT')) {
              url = place.site_internet;
            } else if (place.category.name == 'CAMPINGCARPORTUGAL') {
              //url = "https://www.campingcarportugal.com/areasac/LstAreasnv.php?language=PT&mode=2&distrito=0&concelho=0&nomearea=&tiparea=0&pernoita=-1&elect=-1&intern=-1";
              url = `https://www.google.com/maps?q=${place.location.latitude},${place.location.longitude}`;
            }
            console.log(place);
            console.log(`https://www.google.com/maps?q=${place.location.latitude},${place.location.longitude}`);
            window.open(url, '_blank');

            // TODO: Criar a janela com as info do camping and feedbacks
            // this.park4Night.getFeedbacks(features[0].values_.id).subscribe(feedbacks =>{
            //   console.log('feedbacks',feedbacks);
            // });
          }
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

        this.layersBarIsActive = false;
        this.campingBarIsActive = false;

        if (!this.rightToolsIsActive || !this.routeBarIsActive) {
          this.rightToolsIsActive = true;
          this.routeBarIsActive = true;
          this.cdRef.detectChanges();
        }
        this.addPoisToRoute(poiData);
        this.drawTheRoute();

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

    if (this.simulateRote && this.driving) {
      navigator.geolocation.clearWatch(this.watchPositionId);

      const emulate = this.simulateRote.filter(x => x.drove == undefined);

      let someElapsTime = 0;
      let lastTimeStamp: any = undefined;
      emulate.forEach((geo: any) =>{
        if (lastTimeStamp != undefined) {
          const date1 = new Date(lastTimeStamp);
          const date2 = new Date(geo.timestamp);
          const elapstime: any = date2.getTime() - date1.getTime();
          someElapsTime += parseInt(elapstime);
          setTimeout(() => {
            this.currentGeoLocation = geo;
            const coords = [this.currentGeoLocation?.coords?.longitude, this.currentGeoLocation?.coords?.latitude];
            this.showCurrentPositionInMap();
            this.openLayers.zoomToGeoLocation(coords, this.mapZoomValue);
            this.onDriving();
          }, someElapsTime);
        }
        lastTimeStamp = geo.timestamp;
      })

      /*
      let someElapsTime = 0;
      emulate.forEach((geo: any) =>{

        if (geo.elapstime) {
          someElapsTime += parseInt(geo.elapstime);
        }

        setTimeout(() => {
          this.currentGeoLocation = {
            coords: {
              accuracy: 0,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              latitude: geo.long,
              longitude: geo.lat,
              speed: null
            },
            timestamp: 0
          };
          const coords = [this.currentGeoLocation.coords?.longitude, this.currentGeoLocation.coords?.latitude];
          this.showCurrentPositionInMap();
          this.openLayers.zoomToGeoLocation(coords, this.mapZoomValue);
          this.onDriving();
        }, someElapsTime);
      });
      */
    } else {
      const options = {
        enableHighAccuracy: true,
        timeout: 1000,  // Timeout in milliseconds
        maximumAge: 0   // No maximum age for cached positions
      };

      this.watchPositionId = navigator.geolocation.watchPosition(
        (geoLocation: geolocationPosition) => {
          this.currentGeoLocation = geoLocation;
          this.showCurrentPositionInMap();
          this.currentGeoLocation$.next(this.currentGeoLocation);
          if (this.driving) {
            // Re-center the map
            const coord: any[] = [this.currentGeoLocation?.coords?.longitude,this.currentGeoLocation?.coords?.latitude];
            this.openLayers.zoomToGeoLocation(coord, this.mapZoomValue);
            // check on drive rotines.
            this.onDriving();
          }

          const logData = {
            coords: {
              accuracy: this.currentGeoLocation?.coords?.accuracy,
              altitude: this.currentGeoLocation?.coords?.altitude,
              altitudeAccuracy: this.currentGeoLocation?.coords?.altitudeAccuracy,
              heading: this.currentGeoLocation?.coords?.heading,
              latitude: this.currentGeoLocation?.coords?.latitude,
              longitude: this.currentGeoLocation?.coords?.longitude,
              speed: this.currentGeoLocation?.coords?.speed,
            },
            timestamp: this.currentGeoLocation.timestamp
          }

          // Log's the postion
          this.httpClient.post(`http://cruzmv.ddns.net:3000/log_geo`, logData).subscribe(() => {
            // Do nothing
          },error => {
            console.log(JSON.stringify(error));
          });

        },
        (error) => {
          console.log(`GetPosition Error: ${JSON.stringify(error)}`);
        },
        options
      );
    }

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
      this.removePoi(poiData.name);
    } );

    poiDiv.appendChild(input);
    poiDiv.appendChild(button);

    this.routePois.nativeElement.appendChild(poiDiv);
  }

  /**
   * Draw the route to the map
   */
  private drawTheRoute(reRoute: boolean = false) {
    const coords = [
      [this.currentGeoLocation?.coords?.longitude,this.currentGeoLocation?.coords?.latitude]
    ];
    for (let i = 0; i < this.mapPois.length; i++) {
      coords.push(this.openLayers.coords_4326(this.mapPois[i].coord));
    }

    if (coords.length <= 1){
      this.openLayers.removeVectorLayer("routeFeature");
    } else {
      let retryAttempts = reRoute ? 12 : 6;
      this.openRoute.getRoute(coords, this.choosedDriveMode, this.choosedAvoids, this.choosedTypeVehicle).pipe(
        retryWhen(errors => errors.pipe(
          mergeMap((error,index) =>{
            // Check if the error status is 503 and retryAttempts is greater than 0
            if (error.status === 503 && retryAttempts > 0) {
              retryAttempts--; // Decrement retryAttempts
              console.log(`Retrying due to error: ${error.message}. Remaining attempts: ${retryAttempts}`);
              return of(error).pipe(delay(1000)); // Retry after a delay of 1000ms
            } else {
              retryAttempts = 0;
            }
            // If error status is not 503 or retryAttempts is 0, throw the error
            return throwError(error);
          })
        ))
      ).subscribe(routes_data => {
        this.reRouting.to_route = false;
        if (routes_data.routes.length > 0) {
          this.routeSteps = routes_data;

          console.log(this.routeSteps);

          this.updateDriveGuidance();
          this.cdRef.detectChanges();
          this.openLayers.drawRoute(routes_data.routes[0].geometry);
        } else {
          console.log(`No route for ${coords}`);
        }
      },error => {
        console.log(`Routing error ${error.message}`);
        // Check if retryAttempts reached 0
        if (retryAttempts === 0 ) {
          console.log('Retry attempts exhausted');
          this.reRouting.to_route = false;
          if (!reRoute){
            alert('Could not create this route, please try again.');
            this.removePoi(this.mapPois[this.mapPois.length-1].name);
          }
        }
      });
    }
  }

  /**
   * Remove a poi from the map
   * @param poiName
   */
  private removePoi(poiName: string) {
    const input = Array.from(this.routePois.nativeElement.children).filter((element: any) => element.id === poiName)
    if (input.length > 0) {
      this.routePois.nativeElement.removeChild(input[0]);
      this.openLayers.removeFeature(poiName);
      this.mapPois.splice(this.mapPois.findIndex(x => x.name == poiName),1);
      this.drawTheRoute();
      if (poiName === 'poi_1') {
        this.routeSteps = undefined;
        this.cdRef.detectChanges();
      }
    }
  }

  /**
   * Add the campings icons to the map
   */
  private drawCampings() {

    let counter = 0;
    this.campings.forEach((camping: any) => {

      console.log(camping.category.name);

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

          let scale = 1.5;
          if (iconPath == 'assets/REVOLUTION.ico' || iconPath == 'assets/CAMPERSTOP.png' || iconPath == 'assets/CAMPERCONTACT.ico') {
            scale = 0.5;
          }
          this.openLayers.addIconInTheMap(coords, camping.name, iconPath, camping.id, camping.name,undefined,undefined,scale);
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
      html += `${camping.note_moyenne} (${camping.nb_commentaires}) - Parking: ${camping.prix_stationnement} - service: ${camping.prix_services}`;
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

  /**
   * On Driving rotines
   */
  private async onDriving() {

    if (this.routeSteps && this.routeSteps.routes.length > 0) {
      const geometry = this.routeSteps.routes[0].geometry;
      const currentPosition: number[] = [this.currentGeoLocation?.coords?.longitude as number, this.currentGeoLocation?.coords?.latitude as number];
      const instructionStep: segment[] = this.routeSteps.routes[0].segments;
      const segment: any = instructionStep.find(x => x.status == undefined);

      // Check if is off route and re-route the trip
      // if (this.openLayers.checkOffRoute(currentPosition,geometry) && !this.reRouting.to_route) {
      //   console.log('Off-route detected');
      //   this.reRouting.to_route = true;
      //   this.reRouting.did_reroute = true;
      //   this.drawTheRoute(true);
      //   return;
      // }

      // Remove the first instruction
      segment.steps[0].status = 'DONE';

      // Get the first step that is not passed yet
      const step: step = segment.steps.find((x: step) => x.status != 'DONE')!;

      // Get the step geo position
      const currentDestinationPosition = this.openLayers.decodePolyline(geometry)[step?.way_points[0]];

      // Get the distance to the step
      const currentDistanceToStep = this.openLayers.calculateDistance(currentPosition, currentDestinationPosition);

      // On the first interaction with this step, set the lastDistance == currentDistanceToStep, so it's 0
      if (step.lastDistance == undefined) {
        step.lastDistance = currentDistanceToStep;
      }

      // Mark the step as DONE, if distance < 20 meters and the last distance - current distance < 0
      if (currentDistanceToStep < 20 &&  step.lastDistance - currentDistanceToStep < 0 ) {
        step.status = 'DONE';
        console.log(`FINISH STEP: ${step.instruction}`);
      } else if (step.lastDistance - currentDistanceToStep < -15) {

        console.log('Off-route detected');
        this.reRouting.to_route = true;
        this.reRouting.did_reroute = true;
        this.drawTheRoute(true);
        return;

      }

      // Make the readeble labels
      const currentDistanceToStepHumanRead = Math.round(currentDistanceToStep > 1000 ?  currentDistanceToStep / 1000 : currentDistanceToStep);
      const currentDistanceLabel = currentDistanceToStep > 1000 ? 'Kilometer': 'Meters';

      // Update the text Guidance
      this.textGuidance = `${currentDistanceToStepHumanRead} ${currentDistanceLabel}, ${step.instruction}`;

      // Icon guidance
      const icon = this.iconGuidance.find(x => x.type == step.type);
      this.iconGuidancePath = icon.path;
      this.cdRef.detectChanges();


      // --- Voice guidance ----

      // Check the distance and enable the voice if needed
      let speak = false
      if (currentDistanceToStep < 100 && step.warn_100 == undefined) {
        step.warn_100 = true; step.warn_250 = true; step.warn_500 = true;
        speak = true;
      } else if (currentDistanceToStep < 250 && step.warn_100 == undefined && step.warn_250 == undefined ) {
        step.warn_250 = true; step.warn_500 = true;
        speak = true;
      } else if (currentDistanceToStep < 500 && step.warn_100 == undefined && step.warn_250 == undefined && step.warn_500 == undefined ) {
        step.warn_500 = true;
        speak = true;
      }

      // If it's a re-routing, mark the past warnings
      // if (this.reRouting.did_reroute) {
      //   // if (currentDistanceToStep < 500){
      //   //   step.warn_500 = true;
      //   // }
      //   // if (currentDistanceToStep < 250) {
      //   //   step.warn_250 = true; step.warn_500 = true;
      //   // }

      //   // if (currentDistanceToStep < 100) {
      //   //   step.warn_100 = true; step.warn_250 = true; step.warn_500 = true;
      //   // }
      //   speak = false;
      //   this.reRouting.did_reroute = false;
      // }

      // Speak it.
      if (speak) {
        this.speak(`${step.instruction} in ${currentDistanceToStepHumanRead} meters`);
      }

      // Keep for the last distance
      step.lastDistance = currentDistanceToStep;

    }

    // Update the speed
    this.drivingSpeed = Math.round(this.currentGeoLocation?.coords?.speed as number);
    // Math.round(this.currentGeoLocation?.coords?.speed as number * 10 / 2) ;



    /*
    if (this.routeSteps && this.routeSteps.routes.length > 0) {
      const instructionStep: segment[] = this.routeSteps.routes[0].segments;
      const geometry = this.routeSteps.routes[0].geometry;
      const currentPosition = [this.currentGeoLocation?.coords?.longitude, this.currentGeoLocation?.coords?.latitude];
      const segment: any = instructionStep.find(x => x.status == undefined);

      if (this.reRouting.did_reroute) {
        segment.steps[0].status = 'DONE';
        this.reRouting.did_reroute = false;
      }

      if (segment) {
        const step = segment!.steps.find((x: any) => x.status == undefined)
        if (step?.way_points && step.way_points.length > 0){
          const currentDestinationPosition = this.openLayers.decodePolyline(geometry)[step?.way_points[0]];
          const currentDistanceToStep = this.openLayers.calculateDistance(currentPosition, currentDestinationPosition);

          // Check if is off route and re-route the trip
          if (this.openLayers.checkOffRoute(currentPosition,geometry) && !this.reRouting.to_route) {
            console.log('Off-route detected');
            this.reRouting.to_route = true;
            this.reRouting.did_reroute = true;
            this.drawTheRoute(true);
          }

          // Voice guidance
          if (currentDistanceToStep < 120) {
            this.speak(Math.round(currentDistanceToStep), step.instruction);
            step.status = `DONE AT ${currentDistanceToStep}`;
          }

          // Text Guidance
          this.textGuidance = `In ${Math.round(currentDistanceToStep)} Meters, ${step.instruction}`;

          // Icon guidance
          const icon = this.iconGuidance.find(x => x.type == step.type);
          this.iconGuidancePath = icon.path;
          this.cdRef.detectChanges();

        }
      }
      this.updateDriveGuidance();
    }
    */
  }

  /**
   * Speak out laude the text received
   * @param distance
   * @param text
   */
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
        //console.log(message);
    } else {
        console.error('Speech synthesis is not supported by your browser.');
    }
  }

  /**
   * Update info on drive guide div
   */
  private updateDriveGuidance() {

    const steps: step[] | undefined = this.routeSteps?.routes[0].segments[0].steps;
    const { totalDistanceDone, totalDurationDone } = steps!.filter(step => step.status == 'DONE')
                                                           .reduce((acc, step) => {
      acc.totalDistanceDone += step.distance;
      acc.totalDurationDone += step.duration;
      return acc;
    }, { totalDistanceDone: 0, totalDurationDone: 0 });


    const distanceLeft = this.routeSteps?.routes[0].summary.distance - totalDistanceDone;
    const durationLeft = this.routeSteps?.routes[0].summary.duration - totalDurationDone;

    const distanceInMeters = Math.round(distanceLeft);
    const distanceInKilometers = Math.round(distanceLeft / 1000);

    const durationInMinutes = Math.round(durationLeft / 100);
    const durationInHours = Math.round(durationLeft / 60 / 100);

    const currentTime = new Date().getTime();
    const drivingEta = new Date(currentTime + (durationLeft * 60 * 10) );

    this.driveGuidanceData.distance = `${distanceInKilometers>0 ? distanceInKilometers : distanceInMeters} ${distanceInKilometers>0 ? 'KM' : 'Meters'}`;
    const durationText = String(durationInHours).padStart(2, '0')+':'+String(durationInMinutes).padStart(2, '0');
    this.driveGuidanceData.duration = durationText.substring(0,5);
    this.driveGuidanceData.eta = drivingEta.toLocaleTimeString('en-US', { hour12: false });

  }


  private async updatePois() {
    const centerCoordinates = this.openLayers.coords_4326(this.map.getView().getCenter())
    for(const menu of this.campingsMenu){
      if (menu.selected) {
        switch (menu.title) {
          case 'Parking':
            const places = await this.park4Night.getCampings(centerCoordinates)
                                                .pipe(
                                                  timeout(10000),
                                                  catchError(async (err: any) => {
                                                    if (err.name === 'TimeoutError') {
                                                      // Handle the timeout error
                                                      console.error('Park4Night fail on request places');
                                                      const placesDB = await this.park4Night.getCampingsDB(centerCoordinates).toPromise();
                                                      console.log(`Park4Night places from DB ${placesDB.length}`);
                                                      return placesDB;
                                                    }
                                                    return throwError(err);  // Rethrow other errors
                                                  })                                          )
                                                .toPromise();
            const newCampings = places.filter((place: any) => !this.campings.some((camping) => camping.id === place.id));
            this.campings.push(...newCampings);
            break;
          case 'Camping':
          case 'ASA':
          case 'Shopping':
          case 'Laundry':
          default:
            break;
        }
      }


    }
    this.drawCampings();
  }

}
