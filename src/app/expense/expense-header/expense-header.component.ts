import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";

import { ExpenseConfig } from "../expense.config";
import { ExpenseService } from "../expense.service";
import { ExpenseSidebarService } from "../expense-sidebar.service";
import { AuthService } from "../../auth/auth.service";

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

  readonly expenseRoute = EXPENSE_ROUTE;

  constructor(
    private authService: AuthService,
    private sidebarService: ExpenseSidebarService) {}

  ngOnInit() {
    this.isUserAuthenticated = this.authService.getIsAuthenticated();
    this.authListener = this.authService
      .getAuthStatusListener()
      .subscribe( isAuthenticated => {
        this.isUserAuthenticated = isAuthenticated;
      });
  }

  toggleMenu() {
    this.sidebarService.toggleSidebar();
  }

  ngOnDestroy() {
    this.authListener.unsubscribe();
  }
}