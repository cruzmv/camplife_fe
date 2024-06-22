//declare const JSMpeg: any;
import { HttpClient } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Observable, map } from 'rxjs';
//import { vlc } from 'vlc-player';


interface PlaylistItem {
  tvgId: string;
  tvgName: string;
  tvgLogo: string;
  groupTitle: string;
  url: string;
}

@Component({
  selector: 'app-iptv',
  templateUrl: './iptv.component.html',
  styleUrl: './iptv.component.scss'
})
export class IptvComponent implements OnInit {
  categories: any = [];
  subCategories: any = [];
  m3uData: any = [];
  channels: any = [];
  subChannels: any = [];
  videoUrl: any = 'http://23.227.147.172:80/ZjWxTDKbTZ/aKTJDVDPC6/175988.m3u8';   //'http://23.227.147.172:80/ZjWxTDKbTZ/aKTJDVDPC6/189894.m3u8';

  player: any;
  @ViewChild('videoCanvas', { static: false }) canvas!: ElementRef;

  constructor(private http: HttpClient, 
              private cdRef: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.http.get('http://cruzmv.ddns.net:3000/get_iptv_categories').subscribe((data: any) => {
      this.categories = data.data;
      this.categories.sort((a: any, b: any) => {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
      });
    })
  }

  onCategorySelected(category: string) {
    const subCategory = this.categories.find((x: any) => x.name == category);
    this.subCategories = subCategory.subCategory;
    this.channels = [];
    this.subChannels = [];
    this.cdRef.detectChanges();
  }

  onSubCategorySelected(subCategory: string) {
    const encodedSubCategory = encodeURIComponent(subCategory);
    this.http.get(`http://cruzmv.ddns.net:3000/get_chanel_by_category?category=${encodedSubCategory}`).subscribe((data: any) => {
      this.channels = data.data;
      this.subChannels = [];
      this.cdRef.detectChanges();
    })
  }

  playChannel(channel: any) {
    if (channel.channels.length > 1) {
      this.subChannels = channel.channels;
    } else {
      this.http.get(`http://cruzmv.ddns.net:3000/play_channel_by_url?url=${channel.channels[0].url}`).subscribe((data: any) => {
        if (data.message == '\nExiting... (End of file)\n'){
          console.log('Played to the end.  Play next in the list');
        } else if(data.message == '\nExiting... (Quit)\n') {
          console.log('Closed the video window');
        } else {
          console.log(data);
        }
      },error => {
        console.log(`error `, error);
      })


      // console.log(data,channel);
      // }, error => {
      //   console.log('Error', error);
      //   this.playChannel(channel.channels[0].url);
      // });


    }

  }  
}
