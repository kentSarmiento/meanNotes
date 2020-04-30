import { Component, Inject, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { Subscription } from "rxjs";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { MatDividerModule } from "@angular/material/divider";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatSidenav } from '@angular/material/sidenav';
import { Router, NavigationEnd } from '@angular/router';

import { TodoHeaderComponent } from "../todo-header/todo-header.component";
import { TodoService } from "../todo.service";
import { Todo, List } from "../todo.model";
import { AuthService } from "../../auth/auth.service";
import { TodoSidebarService } from "./todo-sidebar.service";

export interface TodoData {
  title: string;
  isNew: boolean;
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
  private todoListener : Subscription;
  private listListener : Subscription;
  todos : Todo[] = [];
  lists : List[] = [];

  listEdit = false;
  enabledList: List;

  taskEdit = false;

  private authListener : Subscription;
  isUserAuthenticated = false;
  userId: string;

  isLoading = false;
  isFirstLoad = true;

  private syncListener : Subscription;
  isSyncing = false;

  @ViewChild('sidenav') sidenav: MatSidenav;

  constructor(
    private todoService: TodoService,
    private authService: AuthService,
    private sidebarService: TodoSidebarService,
    private dialog: MatDialog,
    private router: Router) {
    router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
          const tree = router.parseUrl(router.url);
          if (tree.fragment) {
            setTimeout(() => {
              const element = document.querySelector("#" + tree.fragment);
              if (element) {
                element.scrollIntoView(true);
              }
            }, 100); // another hack here to consider delay in page render
          }
       }
      });
  }

  ngOnInit () {
    this.isLoading = true;

    this.authListener = this.authService
      .getAuthStatusListener()
      .subscribe( isAuthenticated => {
        this.isUserAuthenticated = this.authService.getIsAuthenticated();
        this.userId = this.authService.getUserId();
      });

    this.todoListener = this.todoService
      .getTodoUpdatedListener()
      .subscribe( (list: { todos: Todo[], total: number }) => {
        this.rankSort(list.todos);
        if (!this.enabledList) this.listSort(list.todos);
        this.todos = list.todos;

        this.isLoading = false;
        if (this.isFirstLoad) {
          this.sidenav.open();
          this.isFirstLoad = false;
        }
      });

    this.listListener = this.todoService
      .getListUpdatedListener()
      .subscribe( (list: { lists: List[] }) => {
        this.rankSort(list.lists);
        this.lists = list.lists;
      });

    this.syncListener = this.todoService
      .getSyncUpdatedListener()
      .subscribe( (sync: { isOngoing: boolean, isManual: boolean }) => {
        this.isSyncing = sync.isOngoing;
        if (!this.isSyncing && !sync.isManual) {
          setTimeout(() => {
            this.triggerSync(false);
          }, 8000); // trigger periodic sync every 8 secs
        }
      });

    this.isUserAuthenticated = this.authService.getIsAuthenticated();
    if (this.isUserAuthenticated) {
      this.userId = this.authService.getUserId();

      this.enabledList = null;
      this.todoService.retrieveDataFromServer();
    } else {
      this.isLoading = false;
    }
  }

  ngAfterViewInit(): void {
    this.sidebarService.setSidenav(this.sidenav);
    this.sidenav.openedChange.subscribe((open: boolean) => {
      // When sidenav is opened, task edit should be disabled
      if (open) this.taskEdit = false;
      // When sidenav is closed, list edit should be disabled
      else this.listEdit = false;
    });
  }

  listSort(list: any) {
    list.sort(this._rankSorter("list"));
  }
  rankSort(list: any) {
    list.sort(this._rankSorter("rank"));
  }
  private _rankSorter(criteria) {
    return function(a, b) {
      if (a[criteria] > b[criteria]) return 1;
      else if (a[criteria] < b[criteria]) return -1;
      return 0;
    }
  }

  sortFinishedTasks() {
    this.doneSort(this.todos);
  }
  doneSort(list: any) {
    const ranks = this.todos.map(todo => { return todo.rank; });

    list.sort(this._doneSorter("finished"));

    for (let idx = 0; idx < this.todos.length; idx++) {
      this.todos[idx].rank = ranks[idx];
      this.todoService.updateRank(
        this.todos[idx].id,
        this.todos[idx].rank
        );
    }
  }
  private _doneSorter(criteria) {
    return function(a, b) {
      if (a[criteria] > b[criteria]) return 1;
      else if (a[criteria] < b[criteria]) return -1;
      return 0;
    }
  }

  toggleTask(id: string) {
    this.todoService.toggleTask(id);
  }

  openEditDialog(id: string, title: string) {
    const isNew = id ? false : true;
    const dialogRef = this.dialog.open(TodoEditDialogComponent, {
      width: '480px', maxHeight: '320px',
      data: { title: title, isNew: isNew }
    });

    dialogRef.afterClosed().subscribe(title => {
      if (title) {
        if (id) {
          this.updateTask(id, title);
        } else {
          const taskId = this.addTask(title);
          this.router.navigate( ['/todo'], {fragment: 'panel-' + taskId});
        }
      }
    });
  }

  addTask(title: string) {
    return this.todoService.addTask(
      title,
      this.enabledList.id,
      this.userId
    );
  }

  updateTask(id: string, title: string) {
    this.todoService.updateTask(
      id,
      title,
      this.userId
    );
  }

  deleteTask(id: string) {
    const dialogRef = this.dialog.open(TodoDeleteDialogComponent, {
      width: '240px', maxHeight: '240px',
      data: { isList: false }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.todoService.deleteTask(id, this.userId);
      }
    });
  }

  sortTasks(event: CdkDragDrop<string[]>) {
    const ranks = this.todos.map(todo => { return todo.rank; });

    if (event.previousIndex == event.currentIndex) {
      return;
    } else if (event.previousIndex < event.currentIndex) {
      moveItemInArray(this.todos, event.previousIndex, event.currentIndex);
      for (let idx = event.previousIndex; idx <= event.currentIndex; idx++) {
        this.todos[idx].rank = ranks[idx];
        this.todoService.updateRank(
          this.todos[idx].id,
          this.todos[idx].rank
          );
      }
    } else {
      moveItemInArray(this.todos, event.previousIndex, event.currentIndex);
      for (let idx = event.previousIndex; idx >= event.currentIndex; idx--) {
        this.todos[idx].rank = ranks[idx];
        this.todoService.updateRank(
          this.todos[idx].id,
          this.todos[idx].rank
          );
      }
    }
  }

  getListName() {
    if (this.enabledList) return this.enabledList.title;
    return "All Tasks";
  }

  getTodoListName(listId: string) {
    const index = this.lists.findIndex(list => listId === list.id);
    if (index > -1) {
      const name = this.lists[index].title.substring(0,8);
      if (this.lists[index].title.length > 8) return name + "...";
      return name;
    }
  }

  addList(title: string) {
    const list = this.todoService.addList(title, this.userId);
    this.changeEnabledList(list);
  }

  updateList(id: string, title: string) {
    this.todoService.updateList(
      id,
      title,
      this.userId
    );
  }

  changeEnabledList(list: List) {
    this.enabledList = list;
    this.todoService.changeEnabledListByUser(list, this.userId);
    this.sidenav.close();
  }

  changeEnabledListById(listId: string) {
    const index = this.lists.findIndex(list => listId === list.id);
    if (index > -1) {
      this.changeEnabledList(this.lists[index]);
    }
  }

  toggleEditList() {
    if (this.listEdit) this.listEdit = false;
    else this.listEdit = true;
  }

  toggleEditTasks() {
    if (this.taskEdit) this.taskEdit = false;
    else this.taskEdit = true;
  }

  deleteList(id: string) {
    const dialogRef = this.dialog.open(TodoDeleteDialogComponent, {
      width: '240px', maxHeight: '240px',
      data: { isList: true }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.todoService.deleteList(id, this.userId);
        this.enabledList = null;
        this.todoService.changeEnabledListByUser(null, this.userId);
      }
    });
  }

  sortLists(event: CdkDragDrop<string[]>) {
    const ranks = this.lists.map(list => { return list.rank; });

    if (event.previousIndex == event.currentIndex) {
      return;
    } else if (event.previousIndex < event.currentIndex) {
      moveItemInArray(this.lists, event.previousIndex, event.currentIndex);
      for (let idx = event.previousIndex; idx <= event.currentIndex; idx++) {
        this.lists[idx].rank = ranks[idx];
        this.todoService.updateListRank(
          this.lists[idx].id,
          this.lists[idx].rank
          );
      }
    } else {
      moveItemInArray(this.lists, event.previousIndex, event.currentIndex);
      for (let idx = event.previousIndex; idx >= event.currentIndex; idx--) {
        this.lists[idx].rank = ranks[idx];
        this.todoService.updateListRank(
          this.lists[idx].id,
          this.lists[idx].rank
          );
      }
    }
  }

  triggerSync(isManual: boolean) {
    this.todoService.syncDataWithServer(isManual);
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.syncListener.unsubscribe();
    this.listListener.unsubscribe();
    this.todoListener.unsubscribe();
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