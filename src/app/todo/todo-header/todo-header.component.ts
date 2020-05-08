import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";

import { TodoConfig } from "../todo.config";
import { TodoService } from "../todo.service";
import { AuthService } from "../../auth/auth.service";
import { TodoSidebarService } from "../todo-main/todo-sidebar.service";
import { ResponsiveService } from "../../app-responsive.service";

const TODO_ROUTE = TodoConfig.rootRoute;

@Component({
  selector: 'app-todo-header',
  templateUrl: './todo-header.component.html',
  styleUrls: [
    '../../header/header.component.css',
    'todo-header.component.css'
  ],
})
export class TodoHeaderComponent implements OnInit, OnDestroy {
  isUserAuthenticated = false;
  private authListener: Subscription;

  isMobileView: boolean;
  private viewUpdated: Subscription;

  readonly todoRoute = TODO_ROUTE;

  constructor(
    private authService: AuthService,
    private todoService: TodoService,
    private sidebarService: TodoSidebarService,
    private responsiveService: ResponsiveService) {}

  ngOnInit() {
    this.isUserAuthenticated = this.authService.getIsAuthenticated();
    this.authListener = this.authService
      .getAuthStatusListener()
      .subscribe( isAuthenticated => {
        this.isUserAuthenticated = isAuthenticated;
      });

    this.viewUpdated = this.responsiveService
      .getViewUpdatedListener()
      .subscribe( isMobile => {
        this.isMobileView = isMobile;
      })
    this.isMobileView = this.responsiveService.checkWidth();
  }

  toggleMenu() {
    this.sidebarService.toggleSidebar();
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.authListener.unsubscribe();
  }
}
