import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NbThemeModule, NbSidebarModule, NbLayoutModule, NbButtonModule, NbMenuModule, NbIconModule, NbCardModule, NbSpinnerModule, NbWindowModule, NbInputModule, NbSelectModule, NbToastrModule, NbAutocompleteModule, NbTabsetModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
//import { MapsComponent } from './maps/maps.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { HttpClientModule } from '@angular/common/http';
import { ImageViewerComponent } from './components/image-viewer/image-viewer.component';

import { MapComponent } from './components/map/map.component';
import { YouTubePlayerModule } from '@angular/youtube-player';
import { MapsComponent } from './components/maps/maps.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatFormFieldModule} from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
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
    YouTubePlayerModule,
    NbToastrModule.forRoot(),
    NbAutocompleteModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    NbTabsetModule
  ],
  providers: [
    provideClientHydration(),
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
