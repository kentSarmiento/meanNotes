import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";

import { TodoConfig } from "../todo.config";
import { AuthService } from "../../auth/auth.service";

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

  readonly todoRoute = TODO_ROUTE;

  constructor(
    private authService: AuthService) {}

  ngOnInit() {
    this.isUserAuthenticated = this.authService.getIsAuthenticated();
    this.authListener = this.authService
      .getAuthStatusListener()
      .subscribe( isAuthenticated => {
        this.isUserAuthenticated = isAuthenticated;
      });
  }

  ngOnDestroy() {
    this.authListener.unsubscribe();
  }
}
