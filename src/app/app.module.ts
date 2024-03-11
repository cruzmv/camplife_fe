import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NbThemeModule, NbSidebarModule, NbLayoutModule, NbButtonModule, NbMenuModule, NbIconModule, NbCardModule, NbSpinnerModule, NbWindowModule, NbInputModule, NbSelectModule } from '@nebular/theme';
import { NbEvaIconsModule } from '@nebular/eva-icons';
//import { MapsComponent } from './maps/maps.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { HttpClientModule } from '@angular/common/http';
import { ImageViewerComponent } from './components/image-viewer/image-viewer.component';

import { MapComponent } from './components/map/map.component';
import { YouTubePlayerModule } from '@angular/youtube-player';


@NgModule({
  declarations: [
    AppComponent,
    //MapsComponent,
    DashboardComponent,
    ImageViewerComponent,
    MapComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    NbThemeModule.forRoot({ name: 'dark' }),
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
    YouTubePlayerModule
  ],
  providers: [
    provideClientHydration()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
