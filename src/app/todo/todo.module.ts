import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";

import { TodoMainComponent } from "./todo-main/todo-main.component";
import { TodoAddDialogComponent } from "./todo-main/todo-main.component";
import { TodoListDialogComponent } from "./todo-main/todo-main.component";
import { TodoDeleteDialogComponent } from "./todo-main/todo-main.component";
import { TodoHeaderComponent } from "./todo-header/todo-header.component";
import { TodoRoutingModule } from './todo-routing.module';
import { AngularMaterialModule } from "../angular-material.module";

@NgModule({
  declarations: [
    TodoMainComponent,
    TodoAddDialogComponent,
    TodoListDialogComponent,
    TodoDeleteDialogComponent,
    TodoHeaderComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    TodoRoutingModule
  ]
})
export class TodoModule {}