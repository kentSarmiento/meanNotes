import { Injectable } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';

@Injectable({providedIn: "root"})
export class ExpenseSidebarService {
  private sidenav: MatSidenav;

  setSidenav(sidenav: MatSidenav) {
    this.sidenav = sidenav;
  }

  toggleSidebar() {
    this.sidenav.toggle();
  }
}