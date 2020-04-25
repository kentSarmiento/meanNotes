import { Component, Inject, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { MatDividerModule } from "@angular/material/divider";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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
        this.todos = list.todos;
      });
    this.todoService.getTasks();
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
    this.todoService.deleteTask(id);
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