import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

import { ExpenseMainComponent } from "./expense-main/expense-main.component";
import { ExpenseHeaderComponent } from "./expense-header/expense-header.component";
import { ExpenseRoutingModule } from './expense-routing.module';
import { AngularMaterialModule } from "../angular-material.module";

@NgModule({
  declarations: [
    ExpenseMainComponent,
    ExpenseHeaderComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    RouterModule,
    ExpenseRoutingModule
  ]
})
export class ExpenseModule {}