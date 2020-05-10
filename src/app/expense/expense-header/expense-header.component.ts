import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { MatDialog } from "@angular/material/dialog";

import { ExpenseConfig } from "../expense.config";
import { ExpenseService } from "../expense.service";
import { ExpenseAddDialogComponent } from "../expense-main/expense-main.component";
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
    private responsiveService: ResponsiveService,
    private expenseService: ExpenseService,
    private dialog: MatDialog) {}

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

  openAddExpenseDialog() {
    this.dialog.closeAll();
    const dialogRef = this.dialog.open(ExpenseAddDialogComponent, {
      width: '480px',
      data: {
        title: "",
        category: "Personal",
        currency: "JPY",
        amount: undefined,
        description: "",
        date: new Date()
      }
    });

    dialogRef.afterClosed().subscribe(data => {
      if (data) this.expenseService.addExpense(data);
    });
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.authListener.unsubscribe();
  }
}