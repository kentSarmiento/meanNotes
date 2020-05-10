import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ReactiveFormsModule } from "@angular/forms";

import { ExpenseMainComponent } from "./expense-main/expense-main.component";
import { ExpenseAddDialogComponent } from "./expense-main/expense-main.component";
import { ExpenseDeleteDialogComponent } from "./expense-main/expense-main.component";
import { ExpenseHeaderComponent } from "./expense-header/expense-header.component";
import { ExpenseRoutingModule } from './expense-routing.module';
import { AngularMaterialModule } from "../angular-material.module";

@NgModule({
  declarations: [
    ExpenseMainComponent,
    ExpenseHeaderComponent,
    ExpenseAddDialogComponent,
    ExpenseDeleteDialogComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    RouterModule,
    ReactiveFormsModule,
    ExpenseRoutingModule
  ]
})
export class ExpenseModule {}