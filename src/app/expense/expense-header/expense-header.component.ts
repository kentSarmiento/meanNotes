import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";

import { ExpenseConfig } from "../expense.config";
import { ExpenseService } from "../expense.service";
import { ExpenseSidebarService } from "../expense-sidebar.service";
import { AuthService } from "../../auth/auth.service";
import { ResponsiveService } from "../../app-responsive.service";

const EXPENSE_ROUTE = ExpenseConfig.rootRoute;

@Component({
  selector: 'app-expense-header',
  templateUrl: './expense-header.component.html',
  styleUrls: [
    '../../header/header.component.css',
    'expense-header.component.css'
  ],
})
export class ExpenseHeaderComponent implements OnInit, OnDestroy {
  isUserAuthenticated = false;
  private authListener: Subscription;

  isMobileView: boolean;
  private viewUpdated: Subscription;

  readonly expenseRoute = EXPENSE_ROUTE;

  constructor(
    private authService: AuthService,
    private sidebarService: ExpenseSidebarService,
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