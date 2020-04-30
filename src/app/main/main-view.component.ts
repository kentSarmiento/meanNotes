import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: [ './main-view.component.css' ]
})
export class MainViewComponent implements OnInit {
  isLoading = false;

  private authListener : Subscription;
  isUserAuthenticated = false;
  userId: string;

  constructor (
    private authService: AuthService,
    private router: Router) {}

  ngOnInit() {
    this.isUserAuthenticated = this.authService.getIsAuthenticated();
    this.userId = this.authService.getUserId();
  }
}
