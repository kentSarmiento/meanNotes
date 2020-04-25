import { Component, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { MatDividerModule } from "@angular/material/divider";

import { TodoHeaderComponent } from "../todo-header/todo-header.component";
import { TodoService } from "../todo.service";
import { Todo } from "../todo.model";

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

  constructor(private todoService: TodoService) {}

  ngOnInit () {
    this.todoService
      .getTodoUpdatedListener()
      .subscribe( (list: { todos: Todo[], total: number }) => {
        this.todos = list.todos;
      });
    this.todoService.getTasks();
  }

  toggleTask(id: string) {
    this.todoService.toggleTask(id);
  }

  deleteTask(id: string) {
    this.todoService.deleteTask(id);
  }
}