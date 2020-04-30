import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { MatSidenav } from '@angular/material/sidenav';

@Injectable({providedIn: "root"})
export class TodoSidebarService {
  private sidenav: MatSidenav;

  setSidenav(sidenav: MatSidenav) {
    this.sidenav = sidenav;
  }

  toggleSidebar() {
    this.sidenav.toggle();
  }
}