import { Component } from "@angular/core";
import { ExpenseConfig } from "../expense.config";
import { ExpenseHeaderComponent } from "../expense-header/expense-header.component";
import { ExpenseService } from "../expense.service";
import { Expense, Budget } from "../expense.model";
import { AuthService } from "../../auth/auth.service";

const EXPENSE_ROUTE = ExpenseConfig.rootRoute;

@Component({
  selector: 'app-expense-main',
  templateUrl: './expense-main.component.html',
  styleUrls: [ './expense-main.component.css' ]
})
export class ExpenseMainComponent {}