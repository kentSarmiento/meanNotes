import { Injectable } from '@angular/core';

import { environment } from "../../environments/environment";
import { ExpenseConfig } from "./expense.config";
import { Expense, Budget } from "./expense.model";

const EXPENSE_ROUTE = ExpenseConfig.rootRoute;

@Injectable({providedIn: "root"})
export class ExpenseService {}