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

  private getTasksByUser(user: string) {
    const tasksByUser = this.todos.filter(todo =>
      todo.creator===user);

    this.todoUpdated.next({
      todos: [...tasksByUser],
      total: tasksByUser.length
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

  private getTasksByListAndUser(user: string) {
    if (!this.enabledList) this.getTasksByUser(user);
    else {
      const tasksByListAndUser = this.todos.filter(todo =>
        todo.list===this.enabledList.title &&
        todo.creator===user);

      this.todoUpdated.next({
        todos: [...tasksByListAndUser],
        total: tasksByListAndUser.length
      });
    }
  }

  getTodoUpdatedListener() {
    return this.todoUpdated.asObservable();
  }

  addTask(title: string, list: string, user: string) {
    let highrank = +localStorage.getItem("highrank");
    if (!highrank) highrank = 1;

    const todo: Todo = {
      id: Math.random().toString(36).substr(2, 9), // temporary id
      title: title,
      finished: false,
      rank: highrank,
      list: list,
      creator: user
    };

    this.todos.push(todo);

    highrank++;
    localStorage.setItem("highrank", highrank.toString());

    localStorage.setItem("todos", JSON.stringify(this.todos));
    this.getTasksByListAndUser(user);
  }

  toggleTask(id: string) {
    const index = this.todos.findIndex(todo => id === todo.id);
    if (index > -1) {
      if (this.todos[index].finished) this.todos[index].finished = false;
      else this.todos[index].finished = true;
    }

    localStorage.setItem("todos", JSON.stringify(this.todos));
  }

  updateTask(id: string, title: string, user: string) {
    const index = this.todos.findIndex(todo => id === todo.id);
    if (index > -1) {
      this.todos[index].title = title;
      this.todos[index].creator = user;
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

  deleteTask(id: string, user: string) {
    const index = this.todos.findIndex(todo => id === todo.id);
    if (index > -1)
      this.todos.splice(index, 1);

    localStorage.setItem("todos", JSON.stringify(this.todos));
    this.getTasksByListAndUser(user);
  }

  deleteTasksByList(list: string, user: string) {
    for (var idx = this.todos.length - 1; idx >= 0; idx--) {
      if (this.todos[idx].list === list &&
          this.todos[idx].creator === user) {
        this.todos.splice(idx, 1);
      }
    }

    localStorage.setItem("todos", JSON.stringify(this.todos));
    this.getTasksByListAndUser(user);
  }

  getLists() {
    this.listUpdated.next({
      lists: [...this.lists]
    });
  }

  getListsByUser(user: string) {
    const listByUser = this.lists.filter(list =>
      list.creator===user);

    this.listUpdated.next({
      lists: [...listByUser]
    });
  }

  getListUpdatedListener() {
    return this.listUpdated.asObservable();
  }

  addList(title: string, user: string) {
    let highrank = +localStorage.getItem("highrank");
    if (!highrank) highrank = 1;

    const list = {
      id: Math.random().toString(36).substr(2, 9), // temporary id
      title: title,
      rank: highrank,
      creator: user
    };

    this.lists.push(list);

    highrank++;
    localStorage.setItem("highrank", highrank.toString());

    localStorage.setItem("lists", JSON.stringify(this.lists));
    this.getListsByUser(user);
  }

  updateList(id: string, title: string, user: string) {
    const index = this.lists.findIndex(list => id === list.id);
    if (index > -1) {
      this.lists[index].title = title;
      this.lists[index].creator = user;
    }

    localStorage.setItem("lists", JSON.stringify(this.lists));
  }

  updateListRank(id: string, rank: Number) {
    const index = this.lists.findIndex(list => id === list.id);
    if (index > -1) {
      this.lists[index].rank = rank;
    }
    localStorage.setItem("lists", JSON.stringify(this.lists));
  }

  changeEnabledListByUser(list: List, user: string) {
    this.enabledList = list;
    if (list) this.getTasksByListAndUser(user);
    else this.getTasksByUser(user);
  }

  deleteList(id: string, user: string) {
    const index = this.lists.findIndex(list => id === list.id);
    if (index > -1) {
      this.deleteTasksByList(this.lists[index].title, user);
      this.lists.splice(index, 1);
    }

    localStorage.setItem("lists", JSON.stringify(this.lists));
    this.getListsByUser(user);
  }
}