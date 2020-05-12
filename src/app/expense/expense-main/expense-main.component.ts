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

export interface DialogData {
  isMobileView: boolean;
  expense: ExpenseData;
}

interface DateData {
  start: Date;
  end: Date;
  value: string;
}

@Component({
  selector: 'app-expense-main',
  templateUrl: './expense-main.component.html',
  styleUrls: [ './expense-main.component.css' ]
})
export class ExpenseMainComponent implements OnInit, OnDestroy {
  private expenseListener : Subscription;
  expenses: Expense[] = [];

  dataSource = new MatTableDataSource<Expense>();
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

  dateRanges: DateData[] = [];

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
        this.sortByDate(this.expenses);

        this.dataSource.data = this.expenses;
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });

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
    if (!this.isUserAuthenticated) {
      /* login first if not authenticated */
      this.authService.loginUser(this.expenseRoute.substring(1));
    }

    this.generateListOfDates();
  }

  ngAfterViewInit() {
    if (this.isUserAuthenticated) {
      this.userId = this.authService.getUserId();
      this.expenseService.retrieveDataFromServer();
    }
  }

  private sortByDate(list: any) {
    list.sort(this.desc('date'));
  }
  private asc(criteria) {
    return function(a, b) {
      if (a[criteria] > b[criteria]) return 1;
      else return -1;
    }
  }
  private desc(criteria) {
    return function(a, b) {
      if (a[criteria] < b[criteria]) return 1;
      else return -1;
    }
  }

  openSettingsDialog() {
    const dialogRef = this.dialog.open(ExpenseSettingsDialogComponent, {
      width: '480px'
    });
  }

  openEditExpenseDialog(expense: Expense) {
    const dialogRef = this.dialog.open(ExpenseAddDialogComponent, {
      width: '480px',
      data: {
        isMobileView: this.isMobileView,
        expense: {
          title: expense.title,
          category: expense.category,
          currency: expense.currency,
          amount: expense.amount,
          description: expense.description,
          date: expense.date
        }
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

  private generateListOfDates() {
    const multiplier = 24 * 60 * 60 * 1000;

    const today = new Date();
    const yesterday = new Date(Date.now() - 1 * multiplier);
    const endOfWeek = new Date(Date.now() - 2 * multiplier);
    const startOfWeek = new Date(Date.now() - 7 * multiplier);
    const endOfMonth = new Date(Date.now() - 8 * multiplier);
    const startOfMonth = new Date(Date.now() - 30 * multiplier);

    this.dateRanges = [{
      "start": new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      "end": new Date(today.getFullYear(), today.getMonth(), today.getDate()),
      "value": "Today",
    }, {
      "start": new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
      "end": new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
      "value": "Yesterday",
    }, {
      "start": new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate()),
      "end": new Date(endOfWeek.getFullYear(), endOfWeek.getMonth(), endOfWeek.getDate()),
      "value": "Last 7 Days",
    },{
      "start": new Date(startOfMonth.getFullYear(), startOfMonth.getMonth(), startOfMonth.getDate()),
      "end": new Date(endOfMonth.getFullYear(), endOfMonth.getMonth(), endOfMonth.getDate()),
      "value": "Last 30 Days",
    }];
  }

  isWithinRange(date: Date, start: Date, end: Date) {
    const actualDate = new Date(date);
    const cleanDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate());

    if ((cleanDate.getTime() >= start.getTime()) &&
        (cleanDate.getTime() <= end.getTime())) return true;
    return false;
  }

  rangeHasElement(start: Date, end: Date) {
    const index = this.expenses.findIndex(expense => {
      const actualDate = new Date(expense.date);
      const cleanDate = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate());
        if ((cleanDate.getTime() >= start.getTime()) &&
            (cleanDate.getTime() <= end.getTime())) return expense;
     });

    return index;
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
  isMobileView: boolean;

  constructor(
    public dialogRef: MatDialogRef<ExpenseAddDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {
      this.isMobileView = data.isMobileView;
      this.isNew = (data.expense.title.length > 0) ? false : true;
      this.form = new FormGroup({
        title: new FormControl(data.expense.title, {
          validators: [Validators.required]
        }),
        category: new FormControl(data.expense.category),
        currency: new FormControl(data.expense.currency, {
          validators: [Validators.required]
        }),
        amount: new FormControl(data.expense.amount, {
          validators: [Validators.required]
        }),
        date: new FormControl(data.expense.date, {
          validators: [Validators.required]
        })
      });
  }

  dateFilter = (d: Date | null): boolean => {
    const today = (new Date());
    return d < today;
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
    this.form.reset();
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

@Component({
  templateUrl: './expense-settings-dialog.html',
  styleUrls: [ './expense-main.component.css' ]
})
export class ExpenseSettingsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ExpenseSettingsDialogComponent>) {}
}