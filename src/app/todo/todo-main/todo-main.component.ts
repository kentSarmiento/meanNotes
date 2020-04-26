import { Component, Inject, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { Subscription } from "rxjs";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { MatDividerModule } from "@angular/material/divider";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MatSidenav } from '@angular/material/sidenav';

import { TodoHeaderComponent } from "../todo-header/todo-header.component";
import { TodoService } from "../todo.service";
import { Todo, List } from "../todo.model";
import { AuthService } from "../../auth/auth.service";
import { TodoSidebarService } from "./todo-sidebar.service";

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

  @ViewChild('sidenav') sidenav: MatSidenav;

  constructor(
    private todoService: TodoService,
    private authService: AuthService,
    private sidebarService: TodoSidebarService,
    private dialog: MatDialog) {}

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
        this.isLoading = false;
        this.tempSort(list.todos);
        this.todos = list.todos;
      });

    this.listListener = this.todoService
      .getListUpdatedListener()
      .subscribe( (list: { lists: List[] }) => {
        this.isLoading = false;
        this.tempSort(list.lists);
        this.lists = list.lists;
      });

    this.isUserAuthenticated = this.authService.getIsAuthenticated();
    if (this.isUserAuthenticated) {
      this.userId = this.authService.getUserId();

      this.enabledList = null;
      this.todoService.changeEnabledListByUser(null, this.userId);

      this.todoService.getListsByUser(this.userId);
    } else {
      this.isLoading = false;
    }
  }

  ngAfterViewInit(): void {
    this.sidebarService.setSidenav(this.sidenav);
  }

  tempSort(list: any) {
    list.sort(this._tempSorter("rank"));
  }
  private _tempSorter(criteria) {
    return function(a, b) {
      if (a[criteria] > b[criteria]) return 1;
      else if (a[criteria] < b[criteria]) return -1;
      return 0;
    }
  }

  addEmptyTask() {
    this.todoService.addTask(
      "",
      this.enabledList.title,
      this.userId
    );
  }

  toggleTask(id: string) {
    this.todoService.toggleTask(id);
  }

  openEditDialog(id: string, title: string) {
    const dialogRef = this.dialog.open(TodoEditDialogComponent, {
      width: '480px', maxHeight: '320px',
      data: {title: title}
    });

    dialogRef.afterClosed().subscribe(title => {
      if (title) {
        this.updateTask(id, title);
      }
    });
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

  addList(title: string) {
    this.todoService.addList(
      title,
      this.userId
    );
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
        this.changeEnabledList(null);
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

  ngOnDestroy() {
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