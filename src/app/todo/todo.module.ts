import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

import { TodoMainComponent } from "./todo-main/todo-main.component";
import { TodoEditDialogComponent } from "./todo-main/todo-main.component";
import { TodoHeaderComponent } from "./todo-header/todo-header.component";
import { TodoRoutingModule } from './todo-routing.module';
import { AngularMaterialModule } from "../angular-material.module";

@NgModule({
  declarations: [
    TodoMainComponent,
    TodoEditDialogComponent,
    TodoHeaderComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    RouterModule,
    TodoRoutingModule
  ]
})
export class TodoModule {}