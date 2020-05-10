import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { HttpClient } from "@angular/common/http";

import { environment } from "../../environments/environment";
import { ExpenseConfig } from "./expense.config";
import { Expense } from "./expense.model";

const EXPENSE_URL = environment.serverUrl + "/expenses/";
const EXPENSE_ROUTE = ExpenseConfig.rootRoute;

export interface UpdatedExpense {
  expenses: Expense[];
}

export interface SyncOperation {
  isOngoing: boolean;
}

export interface ExpenseData {
  title: string;
  category: string;
  currency: string;
  amount: number;
  description: string;
  date: Date;
}

@Injectable({providedIn: "root"})
export class ExpenseService {
  private expenseUpdated = new Subject<UpdatedExpense>();
  private cachedExpenses: Expense[] = [];

  private syncUpdated = new Subject<SyncOperation>();

  constructor(private http: HttpClient) {}

  getExpenseUpdatedListener() {
    return this.expenseUpdated.asObservable();
  }

  getSyncUpdatedListener() {
    return this.syncUpdated.asObservable();
  }

  private notifyUpdatedExpenses() {
    this.expenseUpdated.next({ expenses: this.cachedExpenses });
  }

  private notifyOngoingSync(isOngoing: boolean) {
    this.syncUpdated.next({ isOngoing: isOngoing });
  }

  retrieveDataFromServer() {
    this.notifyOngoingSync(true);
    this.http
      .get<any>(EXPENSE_URL)
      .subscribe(response => {
        this.cachedExpenses = response.expenses;
        this.notifyUpdatedExpenses();

        this.notifyOngoingSync(false);
      });
  }

  private updateCachedExpenses(expense: Expense) {
    const index = this.cachedExpenses.findIndex(cachedExpense =>
      expense._id === cachedExpense._id ||
      expense.id === cachedExpense.id);

    if (index > -1) {
      this.cachedExpenses.splice(index, 1, expense);
    } else {
      this.cachedExpenses.push(expense);
    }
  }

  addExpense(data: ExpenseData) {
    const expense : Expense = {
      id: Math.random().toString(36).substr(2, 24), // temporary id
      _id: "", // from backed server
      creator: "", // acquired by server from authentication token
      category: data.category,
      title: data.title,
      currency: data.currency,
      amount: data.amount,
      date: (data.date) ? data.date : new Date(),
      description: data.description,
      label: "",
      rank: 0,
      version: 1,
      locked: false,
      personal: true
    };

    this.updateCachedExpenses(expense);
    this.notifyUpdatedExpenses();

    this.notifyOngoingSync(true);
    this.http.post<any>(EXPENSE_URL, expense)
      .subscribe(response => {
        this.updateCachedExpenses(response);
        this.notifyUpdatedExpenses();

        this.notifyOngoingSync(false);
      });
  }

  updateExpense(expense: Expense, data: ExpenseData) {
    expense.category = data.category;
    expense.title = data.title;
    expense.currency = data.currency;
    expense.amount = data.amount;
    expense.date = data.date;

    this.updateCachedExpenses(expense);
    this.notifyUpdatedExpenses();

    this.notifyOngoingSync(true);
    this.http.put<any>(EXPENSE_URL + expense._id, expense)
      .subscribe(response => {
        this.updateCachedExpenses(response);
        this.notifyUpdatedExpenses();

        this.notifyOngoingSync(false);
      });
  }

  deleteExpense(expense: Expense) {
    const index = this.cachedExpenses.findIndex(cachedExpense =>
      expense._id === cachedExpense._id ||
      expense.id === cachedExpense.id);

    if (index > -1) {
      this.cachedExpenses.splice(index, 1);
      this.notifyUpdatedExpenses();

      this.http.delete<any>(EXPENSE_URL + expense._id)
        .subscribe(response => {});
      this.notifyOngoingSync(false);
    }
  }
}