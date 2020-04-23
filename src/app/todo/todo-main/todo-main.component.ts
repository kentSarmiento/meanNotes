import { Component } from "@angular/core";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { MatDividerModule } from "@angular/material/divider";

import { TodoHeaderComponent } from "../todo-header/todo-header.component";
import { Todo } from "../todo.model";

@Component({
  selector: 'app-todo-main',
  templateUrl: './todo-main.component.html',
  styleUrls: [ './todo-main.component.css' ]
})
export class TodoMainComponent {
  todos : Todo[] = [
    { id: "", title: "First todo" },
    { id: "", title: "Second todo" },
    { id: "", title: "Third todo" },
  ];

  lists: string[] = [
    "All Tasks",
    "Personal",
    "Work",
    "Today",
    "Others",
    "+ New List",
  ];
}