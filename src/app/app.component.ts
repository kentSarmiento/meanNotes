import { Component, OnInit } from '@angular/core';

import { AuthService } from './auth/auth.service';
import { ResponsiveService } from './app-responsive.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  constructor(
    private authService: AuthService,
    private responsiveService: ResponsiveService) {}

  ngOnInit() {
    this.authService.autoLogin();
  }

  onResize(event) {
    this.responsiveService.checkWidth();
  }
}
