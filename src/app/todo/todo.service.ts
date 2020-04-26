import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Todo, List } from './todo.model';

@Injectable({providedIn: "root"})
export class TodoService {
  private todos: Todo[] = [];
  private todoUpdated = new Subject<{ todos: Todo[], total: number }>();

  private lists: List[] = [];
  private listUpdated = new Subject<{ lists: List[] }>();
  private enabledList: List;

  constructor() {
    if (JSON.parse(localStorage.getItem("todos")))
      this.todos = JSON.parse(localStorage.getItem("todos"));

    if (JSON.parse(localStorage.getItem("lists")))
      this.lists = JSON.parse(localStorage.getItem("lists"));
  }

  private getTasks() {
    this.todoUpdated.next({
      todos: [...this.todos],
      total: this.todos.length
    });
  }

  private getTasksByList() {
    if (!this.enabledList) this.getTasks();
    else {
      const tasksByList = this.todos.filter(todo =>
        todo.list===this.enabledList.title);

      this.todoUpdated.next({
        todos: [...tasksByList],
        total: tasksByList.length
      });
    }
  }

  getTodoUpdatedListener() {
    return this.todoUpdated.asObservable();
  }

  addTask(title: string, list: string) {
    let highrank = +localStorage.getItem("highrank");
    if (!highrank) highrank = 1;

    const todo: Todo = {
      id: Math.random().toString(36).substr(2, 9), // temporary id
      title: title,
      finished: false,
      rank: highrank,
      list: list
    };

    this.todos.push(todo);

    highrank++;
    localStorage.setItem("highrank", highrank.toString());

    localStorage.setItem("todos", JSON.stringify(this.todos));
    this.getTasksByList();
  }

  toggleTask(id: string) {
    const index = this.todos.findIndex(todo => id === todo.id);
    if (index > -1) {
      if (this.todos[index].finished) this.todos[index].finished = false;
      else this.todos[index].finished = true;
    }

    localStorage.setItem("todos", JSON.stringify(this.todos));
  }

  updateTask(id: string, title: string) {
    const index = this.todos.findIndex(todo => id === todo.id);
    if (index > -1) {
      this.todos[index].title = title;
    }

    localStorage.setItem("todos", JSON.stringify(this.todos));
  }

  updateRank(id: string, rank: Number) {
    const index = this.todos.findIndex(todo => id === todo.id);
    if (index > -1) {
      this.todos[index].rank = rank;
    }
    localStorage.setItem("todos", JSON.stringify(this.todos));
  }

  deleteTask(id: string) {
    const index = this.todos.findIndex(todo => id === todo.id);
    if (index > -1)
      this.todos.splice(index, 1);

    localStorage.setItem("todos", JSON.stringify(this.todos));
    this.getTasksByList();
  }

  getLists() {
    this.listUpdated.next({
      lists: [...this.lists]
    });
  }

  getListUpdatedListener() {
    return this.listUpdated.asObservable();
  }

  addList(title: string) {
    let highrank = +localStorage.getItem("highrank");
    if (!highrank) highrank = 1;

    const list = {
      id: Math.random().toString(36).substr(2, 9), // temporary id
      title: title,
      rank: highrank
    };

    this.lists.push(list);

    highrank++;
    localStorage.setItem("highrank", highrank.toString());

    localStorage.setItem("lists", JSON.stringify(this.lists));
    this.listUpdated.next({
      lists: [...this.lists],
    });
  }

  updateList(id: string, title: string) {
    const index = this.lists.findIndex(list => id === list.id);
    if (index > -1) {
      this.lists[index].title = title;
    }

    localStorage.setItem("lists", JSON.stringify(this.lists));
    this.listUpdated.next({
      lists: [...this.lists],
    });
  }

  changeEnabledList(list: List) {
    this.enabledList = list;
    if (list) this.getTasksByList();
    else this.getTasks();
  }

  deleteList(id: string) {
    const index = this.lists.findIndex(list => id === list.id);
    if (index > -1)
      this.lists.splice(index, 1);

    localStorage.setItem("lists", JSON.stringify(this.lists));
    this.listUpdated.next({
      lists: [...this.lists],
    });
  }
}