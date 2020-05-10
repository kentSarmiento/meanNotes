import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { environment } from "../../environments/environment";
import { ExpenseConfig } from "./expense.config";
import { Expense } from "./expense.model";

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

  private userId: string;

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

  setUserId(userId: string) { this.userId = userId }

  retrieveDataFromServer() {
    let expenses = JSON.parse(localStorage.getItem("expenses"));
    this.cachedExpenses = (expenses) ? expenses : [];
    this.notifyUpdatedExpenses();

    this.notifyOngoingSync(false);
  }

  private updateCachedExpenses(expense: Expense) {
    const index = this.cachedExpenses.findIndex(
      cachedExpense => expense._id === cachedExpense._id);

    if (index > -1) {
      this.cachedExpenses.splice(index, 1, expense);
    } else {
      let highrank = +localStorage.getItem("expense-rank");
      if (!highrank) highrank = 1;

      highrank++;
      localStorage.setItem("expense-rank", highrank.toString());

      expense.rank = --highrank;
      this.cachedExpenses.push(expense);
    }

    localStorage.setItem("expenses", JSON.stringify(this.cachedExpenses));
  }

  addExpense(data: ExpenseData) {
    const expense : Expense = {
      id: "",
      _id: Math.random().toString(36).substr(2, 24), // temporary id
      creator: this.userId,
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
    this.notifyOngoingSync(false);
  }

  updateExpense(expense: Expense, data: ExpenseData) {
    expense.category = data.category;
    expense.title = data.title;
    expense.currency = data.currency;
    expense.amount = data.amount;
    expense.date = data.date;

    this.updateCachedExpenses(expense);
    this.notifyUpdatedExpenses();
    this.notifyOngoingSync(false);
  }

  deleteExpense(expense: Expense) {
    const index = this.cachedExpenses.findIndex(
      cachedExpense => expense._id === cachedExpense._id);

    if (index > -1) {
      this.cachedExpenses.splice(index, 1);
      localStorage.setItem("expenses", JSON.stringify(this.cachedExpenses));
    }
    this.notifyUpdatedExpenses();
    this.notifyOngoingSync(false);
  }
}