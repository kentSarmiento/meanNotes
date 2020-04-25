import { Component, Inject, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { MatDividerModule } from "@angular/material/divider";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { TodoHeaderComponent } from "../todo-header/todo-header.component";
import { TodoService } from "../todo.service";
import { Todo } from "../todo.model";

export interface TodoData {
  title: string;
}

@Component({
  selector: 'app-todo-main',
  templateUrl: './todo-main.component.html',
  styleUrls: [ './todo-main.component.css' ]
})
export class TodoMainComponent implements OnInit {
  private todoListener : Subscription;
  todos : Todo[] = [];

  lists: string[] = [
    "All Tasks",
    "Personal",
    "Work",
    "Today",
    "Others",
    "+ New List",
  ];

  constructor(
    private todoService: TodoService,
    private dialog: MatDialog) {}

  ngOnInit () {
    this.todoService
      .getTodoUpdatedListener()
      .subscribe( (list: { todos: Todo[], total: number }) => {
        this.tempSortTasks(list.todos);
        this.todos = list.todos;
      });
    this.todoService.getTasks();
  }

  tempSortTasks(list: Todo[]) {
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
    this.todoService.addTask("");
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
    this.todoService.updateTask(id, title);
  }

  deleteTask(id: string) {
    const dialogRef = this.dialog.open(TodoDeleteDialogComponent, {
      width: '240px', maxHeight: '240px'
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.todoService.deleteTask(id);
      }
    });
  }

  dropList(event: CdkDragDrop<string[]>) {
    const ranks = this.todos.map(todo => { return todo.rank; });

    if (event.previousIndex == event.currentIndex) {
      console.log("Not moved!");
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
  constructor(public dialogRef: MatDialogRef<TodoDeleteDialogComponent>) {}
}