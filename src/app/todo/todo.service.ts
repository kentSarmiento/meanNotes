import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { HttpClient } from "@angular/common/http";

import { environment } from "../../environments/environment";
import { Todo, List } from './todo.model';

const SERVER_URL = environment.serverUrl + "/tasks/";

@Injectable({providedIn: "root"})
export class TodoService {
  private todos: Todo[] = [];
  private todoUpdated = new Subject<{ todos: Todo[], total: number }>();

  private lists: List[] = [];
  private listUpdated = new Subject<{ lists: List[] }>();
  private enabledList: List;

  private taskInfoId: string;
  private highrank: number;
  private updateTime: string;

  private syncUpdated = new Subject<{ isOngoing: boolean, isManual: boolean }>();
  private isDataUpdated: boolean;

  constructor(private http: HttpClient) {}

  retrieveDataFromServer() {

    this.syncUpdated.next({ isOngoing: true, isManual: false });
    this.http
      .get<any>(SERVER_URL)
      .subscribe(response => {
        this.taskInfoId = response._id;
        this.todos = (response.tasksInfo) ? JSON.parse(response.tasksInfo) : [];
        this.lists = (response.listsInfo) ? JSON.parse(response.listsInfo) : [];
        this.updateTime = response.updated;
        this.highrank = response.highrank;

        this.getLists();
        this.changeEnabledList(null);
        this.syncUpdated.next({ isOngoing: false, isManual: false });
      }, error => {
        if (error.status === 404) {
          this.addInitialEntryForUser();
        }
      });
  }

  private addInitialEntryForUser() {
    const tasksInfo = {
      highrank: 1,
      updated: new Date()
    };

    this.http
      .post<any>(SERVER_URL, tasksInfo)
      .subscribe(response => {
        this.taskInfoId = response._id;
        this.updateTime = response.updated;
        this.highrank = response.highrank;
        this.todos = [];
        this.lists = [];

        this.getLists();
        this.changeEnabledList(null);
        this.syncUpdated.next({ isOngoing: false, isManual: false });
      });
  }

  syncDataWithServer(isManual: boolean) {

    /* If no updates in data, periodic sync will not proceed */
    if (!isManual && !this.isDataUpdated) {
      this.syncUpdated.next({ isOngoing: false, isManual: isManual });
      return;
    }

    const todoData = JSON.stringify(this.todos);
    const listData = JSON.stringify(this.lists);

    const tasksInfo = {
      tasks: todoData,
      lists: listData,
      highrank: this.highrank,
      updated: new Date(),
    };

    this.syncUpdated.next({ isOngoing: true, isManual: isManual });
    this.http
      .put<any>(SERVER_URL + this.taskInfoId, tasksInfo)
      .subscribe(response => {
        this.updateTime = response.updated;
        this.highrank = response.highrank;

        this.markUpdated(false);
        this.syncUpdated.next({ isOngoing: false, isManual: isManual });
      });
  }

  getSyncUpdatedListener() {
    return this.syncUpdated.asObservable();
  }

  private getTasks() {
    const ongoingTasks = this.todos.filter(todo =>
      todo.finished === false);

    this.todoUpdated.next({
      todos: [...ongoingTasks],
      total: this.todos.length
    });
  }

  private getTasksByUser(user: string) {
    const tasksByUser = this.todos.filter(todo =>
      todo.creator === user &&
      todo.finished === false);

    this.todoUpdated.next({
      todos: [...tasksByUser],
      total: tasksByUser.length
    });
  }

  private getTasksByList() {
    if (!this.enabledList) this.getTasks();
    else {
      const tasksByList = this.todos.filter(todo =>
        todo.list===this.enabledList.id);

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
        todo.list===this.enabledList.id &&
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

  private markUpdated(isUpdated: boolean) {
    this.isDataUpdated = isUpdated;
  }

  addTask(title: string, list: string, user: string) {
    const taskId = Math.random().toString(36).substr(2, 9); // temporary id
    const todo: Todo = {
      id: taskId,
      title: title,
      finished: false,
      rank: this.highrank,
      list: list,
      creator: user
    };
    this.todos.push(todo);
    this.highrank++;

    this.markUpdated(true);
    this.getTasksByListAndUser(user);
    return taskId;
  }

  toggleTask(id: string) {
    const index = this.todos.findIndex(todo => id === todo.id);
    if (index > -1) {
      if (this.todos[index].finished) this.todos[index].finished = false;
      else this.todos[index].finished = true;
    }
    this.markUpdated(true);
  }

  updateTask(id: string, title: string, user: string) {
    const index = this.todos.findIndex(todo => id === todo.id);
    if (index > -1) {
      this.todos[index].title = title;
      this.todos[index].creator = user;
    }
    this.markUpdated(true);
  }

  updateRank(id: string, rank: Number) {
    const index = this.todos.findIndex(todo => id === todo.id);
    if (index > -1) {
      this.todos[index].rank = rank;
    }
    this.markUpdated(true);
  }

  deleteTasksByList(list: string, user: string) {
    for (var idx = this.todos.length - 1; idx >= 0; idx--) {
      if (this.todos[idx].list === list &&
          this.todos[idx].creator === user) {
        this.todos.splice(idx, 1);
      }
    }

    this.markUpdated(true);
    this.getTasksByListAndUser(user);
  }

  deleteTask(id: string, user: string) {
    const index = this.todos.findIndex(todo => id === todo.id);
    if (index > -1)
      this.todos.splice(index, 1);

    this.markUpdated(true);
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
    const list = {
      id: Math.random().toString(36).substr(2, 9), // temporary id
      title: title,
      rank: this.highrank,
      creator: user
    };
    this.lists.push(list);
    this.highrank++;

    this.markUpdated(true);
    this.getListsByUser(user);
  }

  updateList(id: string, title: string, user: string) {
    const index = this.lists.findIndex(list => id === list.id);
    if (index > -1) {
      this.lists[index].title = title;
      this.lists[index].creator = user;
    }

    this.markUpdated(true);
    this.getTasksByListAndUser(user); // tasks should be loaded at this point
  }

  updateListRank(id: string, rank: Number) {
    const index = this.lists.findIndex(list => id === list.id);
    if (index > -1) {
      this.lists[index].rank = rank;
    }
    this.markUpdated(true);
  }

  changeEnabledList(list: List) {
    this.enabledList = list;
    if (list) this.getTasksByList();
    else this.getTasks();
  }

  changeEnabledListByUser(list: List, user: string) {
    this.enabledList = list;
    if (list) this.getTasksByListAndUser(user);
    else this.getTasksByUser(user);
  }

  deleteList(id: string, user: string) {
    const index = this.lists.findIndex(list => id === list.id);
    if (index > -1) {
      this.deleteTasksByList(this.lists[index].id, user);
      this.lists.splice(index, 1);
    }

    this.markUpdated(true);
    this.getListsByUser(user);
  }
}