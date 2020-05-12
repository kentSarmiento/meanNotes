import { Component, Inject, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { Subscription } from "rxjs";
import { MatSidenav } from '@angular/material/sidenav';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { ActivatedRoute, ParamMap } from '@angular/router';

import { TodoConfig } from "../todo.config";
import { TodoHeaderComponent } from "../todo-header/todo-header.component";
import { TodoService } from "../todo.service";
import { OperationMethod } from "../todo.service";
import { Todo, List } from "../todo.model";
import { AuthService } from "../../auth/auth.service";
import { TodoSidebarService } from "./todo-sidebar.service";
import { ResponsiveService } from "../../app-responsive.service";

const TODO_ROUTE = TodoConfig.rootRoute;

export interface TodoData {
  title: string;
  list: string;
}
export interface DeleteDialogData {
  isList: boolean;
}

@Component({
  selector: 'app-todo-main',
  templateUrl: './todo-main.component.html',
  styleUrls: [ './todo-main.component.css' ]
})
export class TodoMainComponent implements OnInit, OnDestroy {
  private listListener : Subscription;
  lists : List[] = [];
  listsEdit = false;
  enabledList: string;
  enabledListName: string;

  private todoListener : Subscription;
  todos : Todo[] = [];
  listEdit = false;

  private authListener : Subscription;
  isUserAuthenticated = false;
  userId: string;

  private syncListener : Subscription;
  isSyncing = false;

  isLoading = false;
  isFirstLoad = true;

  private viewUpdated: Subscription;
  isMobileView: boolean;

  readonly todoRoute = TODO_ROUTE;

  @ViewChild('sidenav') sidenav: MatSidenav;

  constructor(
    private todoService: TodoService,
    private authService: AuthService,
    private sidebarService: TodoSidebarService,
    private responsiveService: ResponsiveService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.isLoading = true;

    this.enabledList = null;
    this.activatedRoute.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has('id')) {
        const id = paramMap.get('id');
        if (id !== "all") this.enabledList = id;
      }
    });

    this.authListener = this.authService
      .getAuthStatusListener()
      .subscribe( isAuthenticated => {
        this.isUserAuthenticated = this.authService.getIsAuthenticated();
        this.userId = this.authService.getUserId();
      });

    this.listListener = this.todoService
      .getListUpdatedListener()
      .subscribe( (updated: { lists: List[], enabled: string }) => {
        this.lists = updated.lists;
        this.sortByRank(this.lists);
        this.enabledList = updated.enabled;
        this.enabledListName = this.getEnabledListName();
        this.listEdit = this.getEnabledListLock();
      });

    this.todoListener = this.todoService
      .getTodoUpdatedListener()
      .subscribe( (updated: { todos: Todo[] }) => {
        if (updated.todos) {
          if (!this.enabledList) {
            this.todos = updated.todos.filter(todo =>
                todo.finished!==true);
          } else {
            this.todos = updated.todos.filter(todo =>
                todo.list===this.enabledList);
          }
          this.todos.forEach( todo => todo.localUpdate = false );
          this.sortByRank(this.todos);
          this.sortFinishedTasks();
        } else {
          this.todos = null;
        }
      });

    this.syncListener = this.todoService
      .getSyncUpdatedListener()
      .subscribe( (sync: { isOngoing: boolean, operation: OperationMethod }) => {
        this.isSyncing = sync.isOngoing;

        if (!sync.isOngoing) {
          if (this.isFirstLoad) {
            this.isFirstLoad = false;

            if (this.enabledList) this.todoService.changeEnabledList(this.enabledList);
            else this.todoService.changeEnabledListToAll();

            if (!this.enabledList) this.sidenav.open();
          }
          this.isLoading = false;

          this.notifyOperationResult(sync.operation)
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

      this.todoService.retrieveDataFromServer(this.enabledList);
    } else {
      /* login first if not authenticated */
      this.authService.loginUser(this.todoRoute.substring(1));
    }
  }

  ngAfterViewInit() {
    this.sidebarService.setSidenav(this.sidenav);

    if (!this.isMobileView) this.sidenav.open();

    this.sidenav.openedChange.subscribe((open: boolean) => {
      // When sidenav is opened, task edit should be disabled
      if (open) this.toggleEditList(false);
      // When sidenav is closed, list edit should be disabled
      else this.toggleEditLists(false);
    });
  }

  closeSidenav() {
    if (this.isMobileView) this.sidenav.close();
    else this.sidenav.open();
  }

  private getEnabledListName() {
    const index = this.lists.findIndex(
      list => this.enabledList === list._id);

    if (index > -1) return this.lists[index].title;
    else return "All Tasks";
  }

  private getEnabledListLock() {
    const index = this.lists.findIndex(
      list => this.enabledList === list._id);

    if (index > -1) return this.lists[index].locked;
    else return false;
  }

  private sortByRank(list: any) {
    list.sort(this.reverseSort("rank"));
  }
  private sorter(criteria) {
    return function(a, b) {
      if (a[criteria] > b[criteria]) return 1;
      else if (a[criteria] < b[criteria]) return -1;
      return 0;
    }
  }
  private reverseSort(criteria) {
     return function(a, b) {
      if (a[criteria] < b[criteria]) return 1;
      else if (a[criteria] > b[criteria]) return -1;
      return 0;
    }
  }

  getListName(id: string) {
    const index = this.lists.findIndex(
      list => id === list._id);

    if (index > -1) {
      const name = this.lists[index].title.substring(0,8);
      if (this.lists[index].title.length > 8) return name + "...";
      return name;
    }
    return "";
  }

  changeEnabledList(list: string) {
    this.isLoading = true;
    this.enabledList = list;
    this.todoService.changeEnabledList(list);
    this.closeSidenav();
  }

  viewAllTasks() {
    this.isLoading = true;
    this.enabledList = null;
    this.todoService.changeEnabledListToAll();
    this.closeSidenav();
  }

  addList(title: string) {
    this.isLoading = true;
    this.todoService.addList(title);
    this.closeSidenav();
  }

  updateListName(title: string) {
    this.todoService.updateListName(this.enabledList, title);
  }

  toggleEditLists(isEdit: boolean) {
    this.listsEdit = isEdit;
  }

  sortLists(event: CdkDragDrop<string[]>) {
    const ranks = this.lists.map(list => { return list.rank; });
    let sortedList: List[] = [];

    if (event.previousIndex == event.currentIndex) {
      return;
    } else if (event.previousIndex < event.currentIndex) {
      moveItemInArray(this.lists, event.previousIndex, event.currentIndex);
      for (let idx = event.previousIndex; idx <= event.currentIndex; idx++) {
        this.lists[idx].rank = ranks[idx];
        sortedList.push(this.lists[idx]);
      }
    } else {
      moveItemInArray(this.lists, event.previousIndex, event.currentIndex);
      for (let idx = event.previousIndex; idx >= event.currentIndex; idx--) {
        this.lists[idx].rank = ranks[idx];
        sortedList.push(this.lists[idx]);
      }
    }
    this.todoService.updateListRanks(sortedList);
  }

  deleteList(list: List) {
    const dialogRef = this.dialog.open(TodoDeleteDialogComponent, {
      width: '240px', maxHeight: '240px',
      data: { isList: true }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.todoService.deleteList(list._id);
        this.enabledList=null;
        this.todoService.changeEnabledListToAll();
      }
    });
  }

  openEditTaskDialog(todo: Todo) {
    const dialogRef = this.dialog.open(TodoAddDialogComponent, {
      width: '480px',
      data: { title: todo.title, list: todo.list }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.todoService.updateTask(todo._id, result.title, result.list);
      }
    });
  }

  updateTaskFinished(id: string) {
    this.todoService.updateTaskFinished(id);
  }

  toggleEditList(isEdit: boolean) {
    this.listEdit = isEdit;
    document.getElementById('display-list-title').focus();

    if (!isEdit) {
      this.todos.forEach( todo => todo.localUpdate = false );
    }
  }

  toggleEditTask(todo: Todo) {
    todo.localUpdate = !todo.localUpdate;
  }

  updateTaskName(id: string, title: string) {
    this.todoService.updateTaskName(id, title);
  }

  sortTasks(event: CdkDragDrop<string[]>) {
    const ranks = this.todos.map(list => { return list.rank; });
    let sortedTasks: Todo[] = [];

    if (event.previousIndex == event.currentIndex) {
      return;
    } else if (event.previousIndex < event.currentIndex) {
      for (let idx = event.previousIndex; idx <= event.currentIndex; idx++) {
        /* block sorting which includes finished tasks */
        if (this.todos[idx].finished) return;
      }
      moveItemInArray(this.todos, event.previousIndex, event.currentIndex);
      for (let idx = event.previousIndex; idx <= event.currentIndex; idx++) {
        this.todos[idx].rank = ranks[idx];
        sortedTasks.push(this.todos[idx]);
      }
    } else {
      moveItemInArray(this.todos, event.previousIndex, event.currentIndex);
      for (let idx = event.previousIndex; idx >= event.currentIndex; idx--) {
        this.todos[idx].rank = ranks[idx];
        sortedTasks.push(this.todos[idx]);
      }
    }
    this.todoService.updateTaskRanks(sortedTasks);
  }

  sortFinishedTasks() {
    const ranks = this.todos.map(todo => { return todo.rank; });

    this.todos.sort(this.sorter("finished"));
    for (let idx = 0; idx < this.todos.length; idx++) {
      this.todos[idx].rank = ranks[idx];
    }
    this.todoService.updateTaskRanks(this.todos);
  }

  deleteTask(id: string) {
    const dialogRef = this.dialog.open(TodoDeleteDialogComponent, {
      width: '240px', maxHeight: '240px',
      data: { isList: false }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.todoService.deleteTask(id);
      }
    });
  }

  private notifyOperationResult(operation: OperationMethod) {
    let message: string = null;

    switch (operation) {
      case OperationMethod.CREATE_LIST:
        message = "LIST created successfully";
        break;
      case OperationMethod.RENAME_LIST:
        message = "LIST renamed successfully";
        break;
      case OperationMethod.DELETE_LIST:
        message = "LIST deleted successfully";
        break;
      case OperationMethod.CREATE_TASK:
        message = "TASK created successfully";
        break;
      case OperationMethod.RENAME_TASK:
        message = "TASK renamed successfully";
        break;
      case OperationMethod.DELETE_TASK:
        message = "TASK deleted successfully";
        break;
      case OperationMethod.FINISH_TASK:
        message = "TASK finished successfully";
        break;
      case OperationMethod.ONGOING_TASK:
        message = "TASK restarted successfully";
        break;

      default:
        break;
    }

    if (message) this.openSnackBar(message);
  }

  private openSnackBar(message: string) {
    const mainClass = "snack-bar";
    const subClass = "snack-bar-" + this.isMobileView;

    this.snackBar.open(message, "Dismiss", {
      duration: 2400,
      panelClass: [ mainClass, subClass ],
    });
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.viewUpdated.unsubscribe();
    this.syncListener.unsubscribe();
    this.todoListener.unsubscribe();
    this.listListener.unsubscribe();
    this.authListener.unsubscribe();
  }
}

@Component({
  templateUrl: './todo-add-dialog.html',
  styleUrls: [ './todo-main.component.css' ]
})
export class TodoAddDialogComponent {
  form: FormGroup;
  lists: List[];
  enabledList: string;
  isNew: boolean;

  constructor(
    public dialogRef: MatDialogRef<TodoAddDialogComponent>,
    private todoService: TodoService,
    @Inject(MAT_DIALOG_DATA) public data: TodoData) {
      this.isNew = (data.title.length > 0) ? false : true;
      this.lists = this.todoService.getLists();
      this.enabledList = this.todoService.getEnabledList();
      this.form = new FormGroup({
        title: new FormControl(data.title, {
          validators: [Validators.required]
        }),
        list: new FormControl((this.isNew) ? this.enabledList : data.list, {
          validators: [Validators.required]
        })
      });
  }

  submit() {
    if (this.form.invalid) {
      return;
    }
    const result: TodoData = {
      title: this.form.value.title,
      list: this.form.value.list,
    }
    this.dialogRef.close(result);
  }

  closeDialog() {
    this.form.reset();
    this.dialogRef.close();
  }
}

@Component({
  selector: 'todo-delete-dialog',
  templateUrl: './todo-delete-dialog.html',
  styleUrls: [ './todo-main.component.css' ]
})
export class TodoDeleteDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<TodoDeleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeleteDialogData) {}
}