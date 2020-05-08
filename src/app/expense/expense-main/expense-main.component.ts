import { Component, ViewChild, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { MatSidenav } from "@angular/material/sidenav";
import { MatTableDataSource } from "@angular/material/table";
import { ExpenseConfig } from "../expense.config";
import { ExpenseHeaderComponent } from "../expense-header/expense-header.component";
import { ExpenseService } from "../expense.service";
import { UpdatedCategory, UpdatedExpense, SyncOperation } from "../expense.service";
import { ExpenseSidebarService } from "../expense-sidebar.service";
import { Expense, Budget } from "../expense.model";
import { AuthService } from "../../auth/auth.service";
import { ResponsiveService } from "../../app-responsive.service";

const EXPENSE_ROUTE = ExpenseConfig.rootRoute;

@Component({
  selector: 'app-expense-main',
  templateUrl: './expense-main.component.html',
  styleUrls: [ './expense-main.component.css' ]
})
export class ExpenseMainComponent implements OnInit {
  private expenseListener : Subscription;
  expenses: Expense[] = [];

  private categoryListener : Subscription;
  categories: Budget[] = [];
  enabledGroup: string;
  enabledGroupName: string;

  tableColumns: string[] = [
    'category',
    'title',
    'amount',
    'date',
    'actions'
  ];

  private authListener : Subscription;
  isUserAuthenticated = false;
  userId: string;

  private syncListener : Subscription;
  isSyncing = false;

  isLoading = false;
  isFirstLoad = true;

  private viewUpdated: Subscription;
  isMobileView: boolean;

  readonly expenseRoute = EXPENSE_ROUTE;

  @ViewChild('sidenav') sidenav: MatSidenav;

  constructor(
    private authService: AuthService,
    private expenseService: ExpenseService,
    private sidebarService: ExpenseSidebarService,
    private responsiveService: ResponsiveService) {}

  ngOnInit() {
    this.isLoading = true;
    this.enabledGroup = null;

    this.authListener = this.authService
      .getAuthStatusListener()
      .subscribe( isAuthenticated => {
        this.isUserAuthenticated = this.authService.getIsAuthenticated();
        this.userId = this.authService.getUserId();
      });

    this.categoryListener = this.expenseService
      .getCategoryUpdatedListener()
      .subscribe( (updated: UpdatedCategory) => {
        this.categories = updated.categories;
        this.enabledGroup = updated.enabled;
        this.enabledGroupName = this.getEnabledCategoryName();
      });

    this.expenseListener = this.expenseService
      .getExpenseUpdatedListener()
      .subscribe( (updated: UpdatedExpense) => {
        this.expenses = updated.expenses;
      });

    this.syncListener = this.expenseService
      .getSyncUpdatedListener()
      .subscribe( (sync: SyncOperation) => {
        this.isSyncing = sync.isOngoing;

        if (!sync.isOngoing) {
          setTimeout(() => {
          if (this.isFirstLoad) {
            this.isFirstLoad = false;

            if (!this.enabledGroup) this.sidenav.open();
          }
          this.isLoading = false;
          }, 240);
        }
      });

    this.viewUpdated = this.responsiveService
      .getViewUpdatedListener()
      .subscribe( isMobile => {
        this.isMobileView = isMobile;
        if (!isMobile) this.sidenav.open();
      })
    this.isMobileView = this.responsiveService.checkWidth();

    this.isUserAuthenticated = this.authService.getIsAuthenticated();
    if (this.isUserAuthenticated) {
      this.userId = this.authService.getUserId();

      this.expenseService.setUserId(this.userId);
      this.expenseService.retrieveDataFromServer(this.enabledGroup);
    } else {
      /* login first if not authenticated */
      this.authService.loginUser(this.expenseRoute.substring(1));
    }
  }

  ngAfterViewInit() {
    this.sidebarService.setSidenav(this.sidenav);

    if (!this.isMobileView) this.sidenav.open();
  }

  closeSidenav() {
    if (this.isMobileView) this.sidenav.close();
    else this.sidenav.open();
  }

  private getEnabledCategoryName() {
    return "All Expenses";
  }

  viewAllExpenses() {}

  addCategory(title: string) {
    this.isLoading = true;
    this.expenseService.addCategory(title);
    this.sidenav.close();
  }

  updateGroupName(groupName: string) {}
  getActualDate(date: Date) {
    const actualDate = new Date(date);
    const dateStr = actualDate.toDateString();
    return dateStr;
  }
  getTotalAmount() {
    return "Coming Soon";
  }
  editElement(element: Expense) {}
  deleteElement(element: Expense) {}

  logout() {
    this.authService.logout();
  }
}