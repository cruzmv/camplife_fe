import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { 
  NbThemeModule, 
  NbSidebarModule, 
  NbLayoutModule, 
  NbButtonModule, 
  NbMenuModule, 
  NbIconModule, 
  NbCardModule, 
  NbSpinnerModule, 
  NbWindowModule, 
  NbInputModule, 
  NbSelectModule, 
  NbToastrModule, 
  NbAutocompleteModule, 
  NbTabsetModule,
  NbCheckboxModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
//import { MapsComponent } from './maps/maps.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { HttpClientModule } from '@angular/common/http';
import { ImageViewerComponent } from './components/image-viewer/image-viewer.component';

import { MapComponent } from './components/map/map.component';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { MapsComponent } from './components/maps/maps.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { ReactiveFormsModule } from '@angular/forms';

import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

import { IptvComponent } from './components/iptv/iptv.component';
import { VideoPlayerComponent } from './components/video-player/video-player.component';



@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    ImageViewerComponent,
    MapComponent,
    MapsComponent,
    IptvComponent,
    VideoPlayerComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    NbThemeModule.forRoot({ name: 'default' }),
    NbSidebarModule.forRoot(), 
    NbLayoutModule, 
    NbButtonModule, 
    NbMenuModule.forRoot(),
    NbIconModule,
    NbEvaIconsModule,
    NbCardModule,
    NbSpinnerModule,
    NbWindowModule.forRoot({}),
    NbInputModule,
    NbSelectModule,
    NbToastrModule.forRoot(),
    NbAutocompleteModule,
    NbTabsetModule,
    NbCheckboxModule,
    YouTubePlayerModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  providers: [
    provideClientHydration(),
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
