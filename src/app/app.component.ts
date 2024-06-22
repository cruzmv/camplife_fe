import { Router } from '@angular/router';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NbMenuItem } from '@nebular/theme';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'camplife';
  items: NbMenuItem[] = [
    {
      title: 'Dashboard',
      icon: 'home-outline',
      link: '/dashboard'
    },
    {
      title: 'Map',
      icon: 'map-outline',
      link: '/map'
    },
    {
      title: 'IPTV',
      icon: 'monitor-outline',
      link: '/iptv'
    },
    {
      title: 'Logout',
      icon: 'unlock-outline',
      link: '/logout'
    },
  ];

  constructor(private router: Router) {}
  
  handleMenuClick(event: any) {
    const url = new URL(event.target.href);
    const route = url.pathname;
    this.router.navigate([route]);
  }

}
