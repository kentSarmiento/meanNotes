import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { MatDialog } from '@angular/material/dialog';

import { TodoConfig } from "../todo.config";
import { TodoService } from "../todo.service";
import { AuthService } from "../../auth/auth.service";
import { TodoSidebarService } from "../todo-main/todo-sidebar.service";
import { TodoAddDialogComponent } from "../todo-main/todo-main.component";
import { List } from "../todo.model";

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

  isEmptyList: boolean = true;
  private listListener : Subscription;

  isSidenavOpen: boolean = true;
  private sidenavListener : Subscription;

  readonly todoRoute = TODO_ROUTE;

  constructor(
    private authService: AuthService,
    private todoService: TodoService,
    private sidebarService: TodoSidebarService,
    private dialog: MatDialog,
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

    this.listListener = this.todoService
      .getListUpdatedListener()
      .subscribe( (updated: { lists: List[], enabled: string }) => {
        if (updated.lists.length > 0) this.isEmptyList = false;
        else this.isEmptyList = true;
      });

    const list = this.todoService.getLists();
    if (list.length > 0) this.isEmptyList = false;
    else this.isEmptyList = true;

    this.sidenavListener = this.sidebarService
      .getSidenavToggledListener()
      .subscribe( isOpen => {
        this.isSidenavOpen = isOpen;
      })
  }

  openAddTaskDialog() {
    const dialogRef = this.dialog.open(TodoAddDialogComponent, {
      width: '480px',
      data: { title: "", list: "" }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addTask(result.title, result.list);
      }
    });
  }

  addTask(title: string, list: string) {
    this.todoService.addTask(title, list);
    setTimeout(() => {
      const element = document.getElementById('content-accordion');
      element.scrollIntoView();
    }, 100);
  }

  toggleMenu() {
    this.sidebarService.toggleSidebar();
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.viewUpdated.unsubscribe();
    this.authListener.unsubscribe();
    this.listListener.unsubscribe();
    this.sidenavListener.unsubscribe();
  }
}
