import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { environment } from "../../environments/environment";
import { ExpenseConfig } from "./expense.config";
import { Expense, Budget } from "./expense.model";

const EXPENSE_ROUTE = ExpenseConfig.rootRoute;

export interface UpdatedCategory {
  categories: Budget[];
  enabled: string;
}

export interface UpdatedExpense {
  expenses: Expense[];
}

export interface SyncOperation {
  isOngoing: boolean;
}

@Injectable({providedIn: "root"})
export class ExpenseService {
  private categoryUpdated = new Subject<UpdatedCategory>();
  private cachedCategories: Budget[] = [];
  private enabledCategory: string;

  private expenseUpdated = new Subject<UpdatedExpense>();
  private cachedExpenses: Expense[] = [];

  private defaultExpense = [
    {
      "title": "coffee",
      "category": "Personal",
      "currency": "JPY",
      "amount": 240,
      "date": new Date()
    }
  ];

  private syncUpdated = new Subject<SyncOperation>();

  private userId: string;

  getCategoryUpdatedListener() {
    return this.categoryUpdated.asObservable();
  }

  getExpenseUpdatedListener() {
    return this.expenseUpdated.asObservable();
  }

  getSyncUpdatedListener() {
    return this.syncUpdated.asObservable();
  }

  private notifyUpdatedCategories() {
    this.categoryUpdated.next({
      categories: this.cachedCategories,
      enabled: this.enabledCategory
    });
  }

  private notifyUpdatedExpenses() {
    this.expenseUpdated.next({ expenses: this.cachedExpenses });
  }

  private notifyOngoingSync(isOngoing: boolean) {
    this.syncUpdated.next({ isOngoing: isOngoing });
  }

  setUserId(userId: string) { this.userId = userId }

  retrieveDataFromServer(list: string) {
    let categories = JSON.parse(localStorage.getItem("categories"));
    this.cachedCategories = (categories) ? categories : [];
    this.enabledCategory = list;
    this.notifyUpdatedCategories();

    let expenses = JSON.parse(localStorage.getItem("expenses"));
    this.cachedExpenses = (expenses) ? expenses : this.defaultExpense;
    this.notifyUpdatedExpenses();

    this.notifyOngoingSync(false);
  }

  private updateCachedCategories(budget: Budget) {
    let highrank = +localStorage.getItem("category-rank");
    if (!highrank) highrank = 1;

    highrank++;
    localStorage.setItem("category-rank", highrank.toString());

    budget.rank = --highrank;
    this.cachedCategories.push(budget);
    localStorage.setItem("categories", JSON.stringify(this.cachedCategories));
  }

  private updateCachedExpenses(expense: Expense) {
    let highrank = +localStorage.getItem("expense-rank");
    if (!highrank) highrank = 1;

    highrank++;
    localStorage.setItem("expense-rank", highrank.toString());

    expense.rank = --highrank;
    this.cachedExpenses.push(expense);
    localStorage.setItem("expenses", JSON.stringify(this.cachedExpenses));
  }

  addCategory(title: string) {
    const budget : Budget = {
      id: "",
      _id: Math.random().toString(36).substr(2, 24), // temporary id
      creator: this.userId,
      category: title,
      currency: 'JPY',
      amount: 0,
      rank: 0,
      shared: false,
      updated: new Date(),
      version: 1,
      locked: false,
      personal: true
    };

    this.updateCachedCategories(budget);
    this.notifyUpdatedCategories();
    this.notifyOngoingSync(false);
  }

  addExpense(
    title: string, category: string,
    amount: number, description: string
  ){
    const expense : Expense = {
      id: "",
      _id: Math.random().toString(36).substr(2, 24), // temporary id
      creator: this.userId,
      category: category,
      title: title,
      currency: 'JPY',
      amount: amount,
      date: new Date(),
      description: description,
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
}