import { Component } from '@angular/core';
import { MenubarModule } from 'primeng/menubar';

@Component({
  selector: 'app-navbar',
  imports: [
    MenubarModule
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  items = [
    {
      label: 'Inicio',
      icon: 'pi pi-home',
      routerLink: '/'
    },

    {
      label: 'Products',
      icon: 'pi pi-list',
      items: [
        { label: 'New', icon: 'pi pi-plus', routerLink: '/products/new' },
        { label: 'List', icon: 'pi pi-bars', routerLink: '/products' }
      ]
    },
    {
      label: 'About',
      icon: 'pi pi-info',
      routerLink: '/about'
    }
  ];

}
