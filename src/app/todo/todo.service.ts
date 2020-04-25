import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Todo } from './todo.model';

@Injectable({providedIn: "root"})
export class TodoService {
  private todos: Todo[] = [];
  private todoUpdated = new Subject<{ todos: Todo[], total: number }>();

  constructor() {
    if (JSON.parse(localStorage.getItem("todos")))
      this.todos = JSON.parse(localStorage.getItem("todos"));
  }

  getTasks() {
    this.todoUpdated.next({
      todos: [...this.todos],
      total: this.todos.length
    });
  }

  getTodoUpdatedListener() {
    return this.todoUpdated.asObservable();
  }

  addTask(title: string) {
    const todo = {
      id: Math.random().toString(36).substr(2, 9), // temporary id
      title: title,
    };

    this.todos.push(todo);

    localStorage.setItem("todos", JSON.stringify(this.todos));
    this.todoUpdated.next({
      todos: [...this.todos],
      total: this.todos.length
    });
  }

  deleteTask(id: string) {
    const index = this.todos.findIndex(todo => id === todo.id);
    if (index > -1)
      this.todos.splice(index, 1);

    localStorage.setItem("todos", JSON.stringify(this.todos));
    this.todoUpdated.next({
      todos: [...this.todos],
      total: this.todos.length
    });
  }
}