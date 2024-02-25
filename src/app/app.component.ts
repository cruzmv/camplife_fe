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
      title: 'Maps',
      icon: 'map-outline',
      link: '/maps'
    },
    {
      title: 'Maps2',
      icon: 'map-outline',
      link: '/maps2'
    },
    {
      title: 'Finance',
      icon: 'percent-outline',
      link: '/finance'
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
