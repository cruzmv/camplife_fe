import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';

interface Photo {
  id?: string | null;
  link_large?: string | null;
  link_thumb?: string | null;
  numero?: string | null;
  p4n_user_id?: string | null;
  pn_lieu_id?: string | null;
}

interface DataItem {
  id?: string | null
  name: string | null;
  date_verified?: string | null;
  description?: string | null;
  location?: {
      latitude: number | null;
      longitude: number | null;
  };
  category?: {
      name: string | null;
  };
  address?: string | null;
  // Additional fields from park4night
  date_creation?: string | null;
  description_fr?: string | null;
  description_en?: string | null;
  description_de?: string | null;
  description_es?: string | null;
  description_it?: string | null;
  description_nl?: string | null;
  reseaux?: string | null;
  date_fermeture?: string | null;
  borne?: string | null;
  prix_stationnement?: string | null;
  prix_services?: string | null;
  nb_places?: string | null;
  hauteur_limite?: string | null;
  route?: string | null;
  ville?: string | null;
  code_postal?: string | null;
  pays?: string | null;
  pays_iso?: string | null;
  publique?: number | null;
  nature_protect?: string | null;
  contact_visible?: number | null;
  top_liste?: number | null;
  site_internet?: string | null;
  video?: string | null;
  tel?: string | null;
  mail?: string | null;
  note_moyenne?: string | null;
  nb_commentaires?: string | null;
  nb_visites?: string | null;
  nb_photos?: string | null;
  validation_admin?: string | null;
  caravaneige?: string | null;
  animaux?: string | null;
  point_eau?: string | null;
  eau_noire?: string | null;
  eau_usee?: string | null;
  wc_public?: string | null;
  poubelle?: string | null;
  douche?: string | null;
  boulangerie?: string | null;
  electricite?: string | null;
  wifi?: string | null;
  piscine?: string | null;
  laverie?: string | null;
  gaz?: string | null;
  gpl?: string | null;
  donnees_mobile?: string | null;
  lavage?: string | null;
  visites?: string | null;
  windsurf?: string | null;
  vtt?: string | null;
  rando?: string | null;
  escalade?: string | null;
  eaux_vives?: string | null;
  peche?: string | null;
  peche_pied?: string | null;
  moto?: string | null;
  point_de_vue?: string | null;
  baignade?: string | null;
  jeux_enfants?: string | null;
  distance?: string | null;
  code?: string | null;
  utilisateur_creation?: string | null;
  user_id?: string | null;
  user_vehicule?: string | null;
  photos?: Photo[] | null;
}

interface Park4NightData {
  api_infos: string;
  status: string;
  lieux: DataItem[];
}

@Injectable({
  providedIn: 'root'
})
export class Park4nightService {
  campLifeAPiUrl: string = 'http://cruzmv.ddns.net:3000/';

  constructor(private httpClient: HttpClient) { }
  
  public getCampings(coords: number[]): Observable<any> {
    const regionCenters = [{ lat: coords[1], lng: coords[0] }];
    const observables: Observable<DataItem[]>[] = [];

    for (const center of regionCenters) {
      const regionURLs = this.generateURLsForRegion(center.lat, center.lng, 3, 10);

      for (const url of regionURLs) {
        const observable = this.getPark4NightPlaces(url).pipe(
          map((data: any) => this.flatData(data.data))
        );
        observables.push(observable);
      }
    }

    return forkJoin(observables).pipe(
      map((dataArray: DataItem[][]) => {
        let dataItems: DataItem[] = [];
        dataArray.forEach(items => {
          dataItems = [...dataItems, ...items];
        });
        return dataItems;
      })
    );
  }

  public getFeedbacks(id: any): Observable<any[]> {
    const url = `https://park4night.com/en/place/${id}`;

    return this.httpClient.get(url, { responseType: 'text' }).pipe(
      map(htmlString => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const feedbackListDiv = doc.querySelector('.place-feedback-list');
        const feedbacks: any[] = [];

        if (feedbackListDiv) {
          const dateSpans: any = feedbackListDiv.querySelectorAll('span.caption.text-gray');
          const ratings: any = feedbackListDiv.querySelectorAll('.rating-note');
          const comments: any = feedbackListDiv.querySelectorAll('.place-feedback-article-content');

          for (let i = 0; i < dateSpans.length; i++) {
            feedbacks.push({
              date: dateSpans[i].innerText.trim(),
              rating: ratings[i].innerText.trim(),
              comment: comments[i].innerText.trim()
            });
          }
        }
        return feedbacks;
      })
    );
  }

  private getPark4NightPlaces(apiUrl: string): Observable<any> {
    const url = `${this.campLifeAPiUrl}proxy_park4night?url=${encodeURIComponent(apiUrl)}`;
    return this.httpClient.get(url);
  };

  private generateURLsForRegion(centerLat: number, centerLng: number, gridSize: number, zoom: number): string[] {
    const urls: string[] = [];
    const latRange = 1.0;
    const lngRange = 1.0;
    const latStep = latRange / gridSize;
    const lngStep = lngRange / gridSize;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const lat = centerLat - latRange / 2 + i * latStep;
            const lng = centerLng - lngRange / 2 + j * lngStep;
            const url = `https://guest.park4night.com/services/V4.1/lieuxGetFilter.php?latitude=${lat}&longitude=${lng}`;
            urls.push(url);
        }
    }

    return urls;
  }

  private flatData(park4NightData: Park4NightData): DataItem[] {
    return park4NightData.lieux.map((place:any) => {
        const location = {
            latitude: parseFloat(place.latitude),
            longitude: parseFloat(place.longitude),
        };

        return {
            id: place.id,
            name: place.titre,
            date_verified: place.date_creation,
            description: place.description_fr || place.description_en || place.description_de || '',
            location,
            address: `${place.route}, ${place.ville}, ${place.code_postal}, ${place.pays}`,
            category: {
                name: this.park4NightCategory(place.code),
            },
            date_creation: place.date_creation,
            description_fr: place.description_fr,
            description_en: place.description_en,
            description_de: place.description_de,
            description_es: place.description_es || '',
            description_it: place.description_it || '',
            description_nl: place.description_nl || '',
            reseaux: place.reseaux || null,
            date_fermeture: place.date_fermeture || '',
            borne: place.borne || '',
            prix_stationnement: place.prix_stationnement || '',
            prix_services: place.prix_services || '',
            nb_places: place.nb_places || '',
            hauteur_limite: place.hauteur_limite || '',
            route: place.route,
            ville: place.ville,
            code_postal: place.code_postal,
            pays: place.pays,
            pays_iso: place.pays_iso,
            publique: place.publique || 0,
            nature_protect: place.nature_protect || '',
            contact_visible: place.contact_visible || 0,
            top_liste: place.top_liste || 0,
            site_internet: place.site_internet || '',
            video: place.video || '',
            tel: place.tel || '',
            mail: place.mail || '',
            note_moyenne: place.note_moyenne || null,
            nb_commentaires: place.nb_commentaires || null,
            nb_visites: place.nb_visites || null,
            nb_photos: place.nb_photos,
            validation_admin: place.validation_admin,
            caravaneige: place.caravaneige,
            animaux: place.animaux,
            point_eau: place.point_eau,
            eau_noire: place.eau_noire,
            eau_usee: place.eau_usee,
            wc_public: place.wc_public,
            poubelle: place.poubelle,
            douche: place.douche,
            boulangerie: place.boulangerie,
            electricite: place.electricite,
            wifi: place.wifi,
            piscine: place.piscine,
            laverie: place.laverie,
            gaz: place.gaz,
            gpl: place.gpl,
            donnees_mobile: place.donnees_mobile,
            lavage: place.lavage,
            visites: place.visites,
            windsurf: place.windsurf,
            vtt: place.vtt,
            rando: place.rando,
            escalade: place.escalade,
            eaux_vives: place.eaux_vives,
            peche: place.peche,
            peche_pied: place.peche_pied,
            moto: place.moto,
            point_de_vue: place.point_de_vue,
            baignade: place.baignade,
            jeux_enfants: place.jeux_enfants,
            distance: place.distance,
            code: place.code,
            utilisateur_creation: place.utilisateur_creation,
            user_id: place.user_id,
            user_vehicule: place.user_vehicule,
            photos: place.photos as Photo[],
        };
    });
  }

  private park4NightCategory(code: string){
    let category = 'Park4Night Category'
    switch(code){
        case 'P': category = 'PARKING LOT DAY/NIGHT'; break;
        case 'DS': category = 'EXTRA SERVICES'; break;
        case 'C': category = 'CAMPING'; break;
        case 'ACC_PR': category = 'PRIVATE CAR PARK FOR CAMPERS'; break;
        case 'ACC_P': category = 'PAYING MOTORHOME AREA'; break;
        case 'F': category = 'ON THE FARM'; break;
        case 'PN': category = 'SURROUNDED BY NATURE'; break;
        case 'PJ': category = 'DAILY PARKING LOT ONLY'; break;
        case 'APN': category = 'PICNIC AREA'; break;
        case 'OR': category = 'OFF-ROAD'; break;
        case 'AR': category = 'REST AREA'; break;
        case 'EP': category = 'HOMESTAYS ACCOMMODATION'; break;
        default: category = 'None';
    }

    return category
  }


}
