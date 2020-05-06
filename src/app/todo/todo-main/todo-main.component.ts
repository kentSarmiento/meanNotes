import { Component, Inject, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { Subscription } from "rxjs";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { MatDividerModule } from "@angular/material/divider";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute, ParamMap, Router, NavigationEnd } from '@angular/router';
import { TodoConfig } from "../todo.config";
import { TodoHeaderComponent } from "../todo-header/todo-header.component";
import { TodoService } from "../todo.service";
import { Todo, List } from "../todo.model";
import { AuthService } from "../../auth/auth.service";
import { TodoSidebarService } from "./todo-sidebar.service";

const TODO_ROUTE = TodoConfig.rootRoute;

export interface TodoData {
  title: string;
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

  readonly todoRoute = TODO_ROUTE;

  @ViewChild('sidenav') sidenav: MatSidenav;

  constructor(
    private todoService: TodoService,
    private authService: AuthService,
    private sidebarService: TodoSidebarService,
    private dialog: MatDialog,
    private router: Router,
    private activatedRoute: ActivatedRoute) {
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
          const tree = router.parseUrl(router.url);
          if (tree.fragment) {
            setTimeout(() => {
              const element = document.querySelector("#" + tree.fragment);
              if (element) {
                element.scrollIntoView(true);
                this.router.navigate([TODO_ROUTE, this.enabledList]);
              }
            }, 100); // another hack here to consider delay in page render
          }
       }
      });
  }

  ngOnInit() {
    this.isLoading = true;

    this.enabledList = null;
    this.activatedRoute.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has('id')) {
        const id = paramMap.get('id');
        this.enabledList = id;
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
          this.sortByRank(this.todos);
          this.sortByFinished(this.todos);
        } else {
          this.todos = null;
        }
      });

    this.syncListener = this.todoService
      .getSyncUpdatedListener()
      .subscribe( (sync: { isOngoing: boolean, isManual: boolean }) => {
        this.isSyncing = sync.isOngoing;

        if (!sync.isOngoing) {
          if (this.isFirstLoad) {
            this.isFirstLoad = false;

            if (this.enabledList) this.todoService.changeEnabledList(this.enabledList);
            else this.todoService.changeEnabledListToAll();

            if (!this.enabledList) this.sidenav.open();
          }
          this.isLoading = false;
        }
      });

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

    this.sidenav.openedChange.subscribe((open: boolean) => {
      // When sidenav is opened, task edit should be disabled
      if (open) this.toggleEditList(false);
      // When sidenav is closed, list edit should be disabled
      else this.toggleEditLists(false);
    });
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
    list.sort(this.sorter("rank"));
  }
  private sortByFinished(list: any) {
    list.sort(this.sorter("finished"));
  }
  private sorter(criteria) {
    return function(a, b) {
      if (a[criteria] > b[criteria]) return 1;
      else if (a[criteria] < b[criteria]) return -1;
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
    this.sidenav.close();
  }

  viewAllTasks() {
    this.isLoading = true;
    this.enabledList = null;
    this.todoService.changeEnabledListToAll();
    this.sidenav.close();
  }

  addList(title: string) {
    this.isLoading = true;
    this.todoService.addList(title);
    this.sidenav.close();
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

  openAddTaskDialog(title: string) {
    const dialogRef = this.dialog.open(TodoEditDialogComponent, {
      width: '480px', maxHeight: '320px',
      data: { title: title }
    });

    dialogRef.afterClosed().subscribe(title => {
      if (title) {
        this.addTask(title);
      }
    });
  }

  addTask(title: string) {
    this.todoService.addTask(title, this.enabledList);
  }

  updateTaskFinished(id: string) {
    this.todoService.updateTaskFinished(id);
  }

  toggleEditList(isEdit: boolean) {
    this.listEdit = isEdit;
    document.getElementById('display-list-title').focus();
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

  triggerSync(isManual: boolean) {}

  logout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.syncListener.unsubscribe();
    this.todoListener.unsubscribe();
    this.listListener.unsubscribe();
    this.authListener.unsubscribe();
  }
}

@Component({
  selector: 'todo-edit-dialog',
  templateUrl: './todo-edit-dialog.html',
  styleUrls: [ './todo-main.component.css' ]
})
export class TodoEditDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<TodoEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TodoData) {}
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