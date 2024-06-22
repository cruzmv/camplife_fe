import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import Hls from 'hls.js';
import videojs from 'video.js';


@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss'
})
export class VideoPlayerComponent implements AfterViewInit, OnDestroy {
  @Input() videoUrl: any;
  player: any;
  //@ViewChild('videoPlayer', { static: false }) videoElement!: ElementRef;
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef;




  ngAfterViewInit() {
    this.loadVideo();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['videoUrl'] && !changes['videoUrl'].isFirstChange()) {
      this.loadVideo();
    }
  }

  loadVideo() {
    const video = this.videoElement.nativeElement as HTMLVideoElement;

    if (Hls.isSupported()) {
      if (this.player) {
        this.player.destroy();
      }
      const hls = new Hls();
      hls.loadSource(this.videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play();
      });
      this.player = hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = this.videoUrl;
      video.addEventListener('canplay', () => {
        video.play();
      });
    }
  }


  ngOnDestroy() {
    if (this.player) {
      this.player.destroy();
    }
  }  



  /*
  ngAfterViewInit() {
    this.initializePlayer();
  }

  ngOnChanges(changes: any) {
    if (changes['videoUrl'] && !changes['videoUrl'].isFirstChange()) {
      this.updatePlayerSource();
    }
  }


  initializePlayer() {
    this.player = videojs('my-player', {
      fluid: true,
      autoplay: false,
      controls: true,
      sources: [{
        src: this.videoUrl,
        type: 'application/x-mpegURL'
      }]
    });

    this.player.on('error', (e: any) => {
      console.error('Video.js Error:', this.player?.error());
    });

    this.player.on('loadedmetadata', () => {
      console.log('Metadata loaded');
    });

    this.player.on('loadeddata', () => {
      console.log('Data loaded');
    });
  }
  
  

  updatePlayerSource() {
    if (this.player) {
      this.player.src({
        src: this.videoUrl,
        type: 'application/x-mpegURL'
      });
      this.player.load();
      this.player.play();

      this.videoElement.nativeElement.requestPictureInPicture().catch((error: any) => {
        console.error('Error entering Picture-in-Picture mode:', error);
      });      
    }
  }
  
  

  ngOnDestroy() {
    if (this.player) {
      this.player.dispose();
    }
  }
  */
  
  

}
