import { AfterViewInit, Component, ElementRef, OnDestroy, TemplateRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import BingMaps from 'ol/source/BingMaps';
import { toStringXY } from 'ol/coordinate';
import { fromLonLat, transform } from 'ol/proj';
import { Feature, Overlay } from 'ol';
import { Point } from 'ol/geom';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import { NbWindowService } from '@nebular/theme';

import { ImageViewerComponent } from '../components/image-viewer/image-viewer.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { parameters } from '../config';


//import { Ng2SmartTableModule, LocalDataSource } from 'ng2-smart-table';


@Component({
  selector: 'app-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.scss']
})
export class MapsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapElement', { static: false }) mapElement!: ElementRef;
  @ViewChild('btnElement', { static: false }) btnElement!: ElementRef;
  map: Map = new Map(); // Initialize here
  placesList: any[] = []; // Adjust the type based on your API response
  place: any;
  location_icons = [
    { category: 'Fuel Station', src: 'assets/gas-pump.png' },
    { category: 'Showers', src: 'assets/shower.png' },
    { category: 'Sanitation Dump Station', src: 'assets/undercarriage.png' },
    { category: 'Wifi', src: 'assets/wifi-signal.png' },
    { category: 'Established Campground', src: 'assets/parking.png' },
    { category: 'Wild Camping', src: 'assets/tent.png' },
    { category: 'Informal Campsite', src: 'assets/lamp.png' },
    { category: 'Water', src: 'assets/faucet.png' },
    { category: 'Tourist Attraction', src: 'assets/travel-and-tourism.png' },
    { category: 'PARKING LOT DAY/NIGHT', src: 'assets/night-parking.png' },
    { category: 'EXTRA SERVICES', src: 'assets/service.png' },
    { category: 'CAMPING', src: 'assets/parking.png' },
    { category: 'PRIVATE CAR PARK FOR CAMPERS', src: 'assets/parking.png' },
    { category: 'PAYING MOTORHOME AREA', src: 'assets/parking.png' },
    { category: 'ON THE FARM', src: 'assets/house.png' },
    { category: 'SURROUNDED BY NATURE', src: 'assets/forest.png' },
    { category: 'DAILY PARKING LOT ONLY', src: 'assets/location.png' },
    { category: 'PICNIC AREA', src: 'assets/camping-table.png' },
    { category: 'OFF-ROAD', src: 'assets/jeep.png' },
    { category: 'REST AREA', src: 'assets/restaurant.png' },
    { category: 'HOMESTAYS ACCOMMODATION', src: 'assets/homestay.png' },
  ];
  //selectedImageUrl: any = null;
  tooltipOverlay!: Overlay;
  fetchPlacesRunning: boolean = false;

  tableColumns: any= {
    actions:{
      add: false,
      edit: false,
      delete: false 
    },
    columns: {
      // black_water: {
      //   title: 'black_water'
      // },
      // closing_date: {
      //   title: 'closing_date'
      // },
      // electricity: {
      //   title: 'electricity'
      // },
      // has_wifi: {
      //   title: 'has_wifi'
      // },
      // height_limit: {
      //   title: 'height_limit'
      // },
      // is_center: {
      //   title: 'is_center'
      // },
      // number_places: {
      //   title: 'number_places'
      // },
      // parking_price: {
      //   title: 'parking_price'
      // },
      // photos: {
      //   title: 'photos'
      // },
      // place_address: {
      //   title: 'place_address'
      // },
      // place_category: {
      //   title: 'place_category'
      // },
      // place_distance_km: {
      //   title: 'place_distance_km'
      // },
      place_id: {
        title: 'place_id'
      },
      // place_latitude: {
      //   title: 'place_latitude'
      // },
      // place_longitude: {
      //   title: 'place_longitude'
      // },
      place_name: {
        title: 'place_name'
      },
      // place_resume: {
      //   title: 'place_resume'
      // },
      // postal_code: {
      //   title: 'postal_code'
      // },
      // public_toilet: {
      //   title: 'public_toilet'
      // },
      service_price: {
        title: 'service_price'
      },
      shower: {
        title: 'shower'
      },
      // verified: {
      //   title: 'verified'
      // },
      water_point: {
        title: 'water_point'
      }
    }
  };  

  @ViewChild('placeWindowClose', { read: TemplateRef }) placeWindowClose!: TemplateRef<HTMLElement>;
  @ViewChild('placeWindow', { read: TemplateRef }) placeWindow!: TemplateRef<HTMLElement>;

  @ViewChild('listPlacesWindowClose', { read: TemplateRef }) listPlacesWindowClose!: TemplateRef<HTMLElement>;
  @ViewChild('listPlacesWindow', { read: TemplateRef }) listPlacesWindow!: TemplateRef<HTMLElement>;


  constructor(private httpClient: HttpClient,
              private windowService: NbWindowService,
              private modalService: NgbModal) { }

  ngAfterViewInit(): void {
    this.initializeMap();

    // Create and add an overlay to the map for displaying tooltips
    this.tooltipOverlay = new Overlay({
      element: document.createElement('div'),
      offset: [10, 0], // Adjust the offset as needed
      positioning: 'bottom-left',
    });
    this.map.addOverlay(this.tooltipOverlay);

    // Add event listener to prevent context menu
    this.mapElement.nativeElement.addEventListener('contextmenu', (event: any) => {
      event.preventDefault();

      // const confirmUpdate = window.confirm('Do you want to update the database?');

      // if (confirmUpdate) {
        const pixel = this.map.getEventPixel(event);
        const coordinates = this.map.getCoordinateFromPixel(pixel);

        this.updateDatabase(coordinates)
      // }

    });

    // Get the clicked features at the clicked pixel
    this.map.on('click', (event: any) => {
      const features = this.map.getFeaturesAtPixel(event.pixel);

      if (features && features.length > 0) {
        // Handle the click on the features (icons)
        const clickedFeature = features[0];
        this.place = this.placesList.find(p => p.place_id === clickedFeature.get('id'));

        if (this.place) {
          this.openWindowInfo();
        }
      }

    });

    // On mouse over
    this.map.on('pointermove', (event: any) => {
      const pixel = this.map.getEventPixel(event.originalEvent);
      const hit = this.map.hasFeatureAtPixel(pixel);

      if (hit) {
        // Get the feature at the pixel
        const feature = this.map.forEachFeatureAtPixel(pixel, (feature) => feature);
        console.log(feature);

        if (feature && feature.getProperties()['name']) {
          // Set tooltip content and position
          const place = this.placesList.find((p) => p.place_id === feature.getProperties()['id']);
          let tooltipContent = '';
          if (place){
            if (place.parking_price) {
              tooltipContent += "[P]: " + place.parking_price;
            }
            
            if (place.service_price) {
              tooltipContent += " [S]: " + place.service_price
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

    // // On mouse over
    // this.map.on('pointermove', (event:any) => {
    //   const pixel = this.map.getEventPixel(event.originalEvent);
    //   const hit = this.map.hasFeatureAtPixel(pixel);
    //   this.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    // })

    // Enable geolocation
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

  getIconSrc(category: string): string {
    const categoryIcon = this.location_icons.find(x => x.category === category);
    return categoryIcon ? categoryIcon.src : 'assets/default-icon.png';
  }

  setMapView(latitude: number, longitude: number, zoomLevel: number): void {
    this.map.getView().setCenter([longitude, latitude]);
    this.map.getView().setZoom(zoomLevel);
  }

  refreshData(): void {
    const centerCoordinates = this.map.getView().getCenter();
    this.onMapClick({
      coordinate: centerCoordinates,
      type: 'contextmenu',
      originalEvent: event
    });
  }

  fetchPlaces(): void{
    const centerCoordinates = this.map.getView().getCenter();
    console.log('Center Coordinates:', centerCoordinates);
    this.updateDatabase(centerCoordinates);
  }

  updateDatabase(coordinates: any): void {
    const confirmUpdate = window.confirm('Do you want to update the database?');

    //this.updateDatabaseButton(true);
    // Get the center coordinates of the map view
    //const centerCoordinates = this.map.getView().getCenter();
    //console.log('Center Coordinates:', centerCoordinates);
    if (confirmUpdate) {
      this.updatePlacesWithCoordinate(coordinates[0], coordinates[1]);
    }
  }

  onMapClick(event: any): void {
    const coordinates = event.coordinate;
    const coordinateString = toStringXY(coordinates, 6);
    console.log('Clicked at coordinates:', coordinateString);

    if (event.type === 'contextmenu') {
      // Handle right-click actions
      this.fetchPlacesList(coordinates[0], coordinates[1]);
    } else {
      // Handle left-click actions

    }
  }

  openWindowInfo() {
    this.windowService.open(
      this.placeWindow,
      //{ title: this.place.place_name, hasBackdrop: false, closeOnEsc: false },
      { title: this.place.place_name, hasBackdrop: true },
    );
  }
  
  openWindowListPlace() {
    
    this.windowService.open(
      this.listPlacesWindow,
      { title: 'place list', hasBackdrop: true },
    );
  }

  openFullImage(photoUrl: string): void {

    const modalRef = this.modalService.open(ImageViewerComponent, { centered: true });
    modalRef.componentInstance.images = this.place.photos.map((photo:any) => photo.link_large);;


    // window.open(photoUrl, '_blank');
  }

  private initializeMap(): void {
    this.map.setTarget(this.mapElement.nativeElement);

    this.map.addLayer(
      new TileLayer({
        source: new BingMaps({
          key: parameters.bingKey,
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
        zoom: 2
      })
    )

    this.map.on('click', (event) => this.onMapClick(event));
  }

  private centerAndZoomToLocation(coordinates: [number, number]): void {
    const bingCoordinates = this.google2BingPosition(coordinates[1], coordinates[0]);
    this.map.getView().setCenter(bingCoordinates);
    this.map.getView().setZoom(12);
  }

  private bing2GooglePosition(bingLat: number, bingLong: number) {
    return transform([bingLat, bingLong], 'EPSG:3857', 'EPSG:4326');
  }

  private google2BingPosition(googleLat: number, googleLong: number) {
    return transform([googleLong, googleLat], 'EPSG:4326', 'EPSG:3857');
  }

  private updatePlacesWithCoordinate(bingLat: number, bingLong: number): void {
    //const [long, lat] = transform([bingLat, bingLong],'EPSG:3857','EPSG:4326');
    const [long, lat] = this.bing2GooglePosition(bingLat, bingLong);
    const apiUrl = 'http://192.168.1.67:3000/update_place_coordinate';
    const requestBody = { lat: lat, long: long };

    this.fetchPlacesRunning = true;
    this.httpClient.post(apiUrl, requestBody).subscribe((response: any) => {
      this.fetchPlacesRunning = false;
      this.fetchPlacesList(bingLat, bingLong)
    });
  }

  // private updateDatabaseButton(is_updating: boolean) {
  //   const button = this.btnElement.nativeElement as HTMLButtonElement;
  //   button.innerText = is_updating ? 'Updating Database' : 'Update Database';
  //   button.disabled = is_updating;

  // }

  private fetchPlacesList(bingLat: number, bingLong: number): void {
    //const [long, lat] = transform([bingLat, bingLong],'EPSG:3857','EPSG:4326');
    const [long, lat] = this.bing2GooglePosition(bingLat, bingLong);
    const apiUrl = 'http://192.168.1.67:3000/get_place_list';
    const queryParams = { lat: lat.toString(), long: long.toString() };

    this.httpClient.get(apiUrl, { params: queryParams }).subscribe((response: any) => {
      //this.placesList = response.data; // Adjust based on your API response structure
      this.placesList = this.placesList.concat(response.data);
      this.addMarkers();
    },
      (error) => {
        console.error('Error fetching places:', error);
      }
    );
  }

  private addMarkers(): void {
    const vectorLayer = this.map.getLayers().getArray().find((layer) => layer instanceof VectorLayer) as VectorLayer<VectorSource>;

    if (vectorLayer) {
      const vectorSource = vectorLayer.getSource();

      if (vectorSource) {
        // Define a custom style for the features (larger point with a pin-like symbol)

        this.placesList.forEach((place) => {
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
        console.error('VectorSource is undefined.');
      }
    } else {
      console.error('VectorLayer not found in map layers.');
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.setTarget();
    }
  }
}
