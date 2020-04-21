import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { Router, RouterEvent } from '@angular/router';
import { filter } from 'rxjs/operators';

import { NotesConfig } from "../notes/notes.config";
import { AuthService } from "../auth/auth.service";

const NOTES_ROUTE = NotesConfig.rootRoute;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  isUserAuthenticated = false;
  private authListener: Subscription;

  readonly noteRoute = NOTES_ROUTE;
  activatedUrl: string;

  constructor(
    private authService: AuthService,
    private router: Router) {}

  ngOnInit() {
    this.activatedUrl = "";
    this.isUserAuthenticated = this.authService.getIsAuthenticated();
    this.authListener = this.authService
      .getAuthStatusListener()
      .subscribe( isAuthenticated => {
        this.isUserAuthenticated = isAuthenticated;
      });
    this.router.events.pipe(
      filter(e => e instanceof RouterEvent)
    ).subscribe(e => {
      this.activatedUrl = e.url;
    });
  }

  isNotesApp() {
    return this.activatedUrl?.substring(0, NOTES_ROUTE.length) === NOTES_ROUTE;
  }

  onLogout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.authListener.unsubscribe();
  }
}
