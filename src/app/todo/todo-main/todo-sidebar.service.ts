import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { MatSidenav } from '@angular/material/sidenav';

@Injectable({providedIn: "root"})
export class TodoSidebarService {
  private sidenav: MatSidenav;
  private sidenavToggled = new Subject<boolean>();

  setSidenav(sidenav: MatSidenav) {
    this.sidenav = sidenav;
  }

  getSidenavToggledListener() {
    return this.sidenavToggled.asObservable();
  }

  toggleSidebar() {
    this.sidenav.toggle();
    this.sidenavToggled.next(this.sidenav.opened);
  }
}