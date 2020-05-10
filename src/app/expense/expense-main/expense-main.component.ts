import { Component, Inject, ViewChild, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { MatTableDataSource } from "@angular/material/table";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { ExpenseConfig } from "../expense.config";
import { ExpenseHeaderComponent } from "../expense-header/expense-header.component";
import { ExpenseService } from "../expense.service";
import { UpdatedExpense, SyncOperation } from "../expense.service";
import { ExpenseData } from "../expense.service";
import { Expense } from "../expense.model";
import { AuthService } from "../../auth/auth.service";
import { ResponsiveService } from "../../app-responsive.service";

const EXPENSE_ROUTE = ExpenseConfig.rootRoute;

@Component({
  selector: 'app-expense-main',
  templateUrl: './expense-main.component.html',
  styleUrls: [ './expense-main.component.css' ]
})
export class ExpenseMainComponent implements OnInit, OnDestroy {
  private expenseListener : Subscription;
  expenses: Expense[] = [];

  dataSource = new MatTableDataSource<Expense>(this.expenses);
  tableColumns: string[] = [
    'title',
    'amount',
    'category',
    'date',
    'actions'
  ];
  totalAmount: number = 0;
  pageIndex: number = 0;
  pageSize: number = 5;

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

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private authService: AuthService,
    private expenseService: ExpenseService,
    private responsiveService: ResponsiveService,
    private dialog: MatDialog) {}

  ngOnInit() {
    this.isLoading = true;

    this.authListener = this.authService
      .getAuthStatusListener()
      .subscribe( isAuthenticated => {
        this.isUserAuthenticated = this.authService.getIsAuthenticated();
        this.userId = this.authService.getUserId();
      });

    this.expenseListener = this.expenseService
      .getExpenseUpdatedListener()
      .subscribe( (updated: UpdatedExpense) => {
        this.expenses = updated.expenses;

        this.dataSource.data = [...this.expenses];
        this.computeInitialTotalAmount();
      });

    this.syncListener = this.expenseService
      .getSyncUpdatedListener()
      .subscribe( (sync: SyncOperation) => {
        this.isSyncing = sync.isOngoing;

        if (!sync.isOngoing) {
          if (this.isFirstLoad) {
            this.isFirstLoad = false;
          }
          this.isLoading = false;
        }
      });

    this.viewUpdated = this.responsiveService
      .getViewUpdatedListener()
      .subscribe( isMobile => {
        this.isMobileView = isMobile;
      })
    this.isMobileView = this.responsiveService.checkWidth();

    this.isUserAuthenticated = this.authService.getIsAuthenticated();
    if (this.isUserAuthenticated) {
      this.userId = this.authService.getUserId();

      this.expenseService.setUserId(this.userId);
      this.expenseService.retrieveDataFromServer();
    } else {
      /* login first if not authenticated */
      this.authService.loginUser(this.expenseRoute.substring(1));
    }
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  openAddExpenseDialog() {
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

  openEditExpenseDialog(expense: Expense) {
    const dialogRef = this.dialog.open(ExpenseAddDialogComponent, {
      width: '480px',
      data: {
        title: expense.title,
        category: expense.category,
        currency: expense.currency,
        amount: expense.amount,
        description: expense.description,
        date: expense.date
      }
    });

    dialogRef.afterClosed().subscribe(data => {
      if (data) this.expenseService.updateExpense(expense, data);
    });
  }

  deleteElement(expense: Expense) {
    const dialogRef = this.dialog.open(ExpenseDeleteDialogComponent, {
      width: '240px', maxHeight: '240px'
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) this.expenseService.deleteExpense(expense);
    });
  }

  pageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.computeTotalAmountFromEvent(event);
  }
  private computeTotalAmountFromEvent(event: PageEvent) {
    let startIdx = event.pageIndex * event.pageSize;
    let endIdx = startIdx + event.pageSize;
    this.totalAmount = 0;

    for (let idx = startIdx; idx < endIdx; idx++) {
      if (idx >= event.length) return;
      this.totalAmount += +this.expenses[idx].amount;
    }
  }
  private computeInitialTotalAmount() {
    const initialEvent: PageEvent = {
      pageIndex: this.pageIndex,
      pageSize: this.pageSize,
      length: this.expenses.length
    };
    this.computeTotalAmountFromEvent(initialEvent);
  }

  getActualDate(date: Date) {
    const actualDate = new Date(date);
    const dateStr = actualDate.toDateString();
    return dateStr;
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.viewUpdated.unsubscribe();
    this.syncListener.unsubscribe();
    this.expenseListener.unsubscribe();
    this.authListener.unsubscribe();
  }
}

@Component({
  templateUrl: './expense-add-dialog.html',
  styleUrls: [ './expense-main.component.css' ]
})
export class ExpenseAddDialogComponent {
  form: FormGroup;
  isNew: boolean;

  constructor(
    public dialogRef: MatDialogRef<ExpenseAddDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExpenseData) {
      this.isNew = (data.title.length > 0) ? false : true;
      this.form = new FormGroup({
        title: new FormControl(data.title, {
          validators: [Validators.required]
        }),
        category: new FormControl(data.category),
        currency: new FormControl(data.currency, {
          validators: [Validators.required]
        }),
        amount: new FormControl(data.amount, {
          validators: [Validators.required]
        }),
        date: new FormControl(data.date, {
          validators: [Validators.required]
        })
      });
  }

  submit() {
    if (this.form.invalid) {
      return;
    }
    const expenseData: ExpenseData = {
      title: this.form.value.title,
      category: this.form.value.category,
      currency: this.form.value.currency,
      amount: this.form.value.amount,
      description: "",
      date: this.form.value.date,
    }
    this.dialogRef.close(expenseData);
  }

  closeDialog() {
    this.dialogRef.close();
  }
}

@Component({
  templateUrl: './expense-delete-dialog.html',
  styleUrls: [ './expense-main.component.css' ]
})
export class ExpenseDeleteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ExpenseDeleteDialogComponent>) {}
}