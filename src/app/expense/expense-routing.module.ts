import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { AuthGuard } from "../auth/auth-guard";

import { ExpenseMainComponent } from "./expense-main/expense-main.component";

const routes: Routes = [
  { path: '', component: ExpenseMainComponent },
  { path: ':id', component: ExpenseMainComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExpenseRoutingModule {}