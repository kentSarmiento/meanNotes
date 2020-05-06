import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { HttpClient } from "@angular/common/http";
import { Router } from '@angular/router';

import { environment } from "../../environments/environment";
import { TodoConfig } from "./todo.config";
import { Todo, List } from './todo.model';

const LISTS_URL = environment.serverUrl + "/lists/";
const TASKS_URL = environment.serverUrl + "/tasks/"
const TODO_ROUTE = TodoConfig.rootRoute;

@Injectable({providedIn: "root"})
export class TodoService {
  private listUpdated = new Subject<{ lists: List[], enabled: string }>();
  private cachedLists: List[] = [];
  private enabledList: string;

  private todoUpdated = new Subject<{ todos: Todo[] }>();
  private cachedTasks: Todo[] = [];

  private syncUpdated = new Subject<{ isOngoing: boolean, isManual: boolean }>();

  constructor(
    private http: HttpClient,
    private router: Router) {}

  getTodoUpdatedListener() {
    return this.todoUpdated.asObservable();
  }

  getListUpdatedListener() {
    return this.listUpdated.asObservable();
  }

  getSyncUpdatedListener() {
    return this.syncUpdated.asObservable();
  }

  retrieveDataFromServer(list: string) {
    this.syncUpdated.next({ isOngoing: true, isManual: false });
    this.http
      .get<any>(LISTS_URL)
      .subscribe(response => {

        this.enabledList = list;
        this.listUpdated.next({ lists: response.lists, enabled: this.enabledList });
        this.cachedLists = response.lists;
        this.http
          .get<any>(TASKS_URL)
          .subscribe(response => {
            this.todoUpdated.next({ todos: response.tasks });
            this.cachedTasks = response.tasks;

            this.syncUpdated.next({ isOngoing: false, isManual: false });
          });
      });
  }

  changeEnabledListToAll() {
    this.router.navigate([TODO_ROUTE]);

    this.enabledList = null;
    this.listUpdated.next({ lists: this.cachedLists, enabled: this.enabledList });
    this.todoUpdated.next({ todos: this.cachedTasks });
    this.syncUpdated.next({ isOngoing: false, isManual: true });
  }

  changeEnabledList(list: string) {
    this.router.navigate([TODO_ROUTE, list]);

    this.http.get<any>(LISTS_URL + list)
      .subscribe(response => {

        const updated = this.updateCachedList(response);
        if (updated) {
          this.enabledList = response._id;
          this.listUpdated.next({ lists: this.cachedLists, enabled: this.enabledList });
          this.http.get<any>(LISTS_URL + list + "/tasks")
            .subscribe(response => {

              this.updateCachedTasks(response.tasks);
              this.todoUpdated.next({ todos: this.cachedTasks });
              this.syncUpdated.next({ isOngoing: false, isManual: true });
            });
        } else {
          this.enabledList = response._id;
          this.listUpdated.next({ lists: this.cachedLists, enabled: this.enabledList });
          this.todoUpdated.next({ todos: this.cachedTasks });
          this.syncUpdated.next({ isOngoing: false, isManual: true });
        }
      });
  }

  private updateCachedList(list: List) {
    const index = this.cachedLists.findIndex(
      cachedList => list._id === cachedList._id);
    let updated = false;

    if (index > -1) {
      if (this.cachedLists[index].version !== list.version) updated = true;
      this.cachedLists.splice(index, 1, list);
    } else {
      this.cachedLists.push(list);
    }

    return updated;
  }

  private updateCachedTask(task) {
    const index = this.cachedTasks.findIndex(cachedTask =>
      task._id === cachedTask._id ||
      task.id === cachedTask.id);

    if (index > -1) {
      this.cachedTasks.splice(index, 1, task);
    } else {
      this.cachedTasks.push(task);
    }
  }

  private updateCachedTasks(tasks: Todo[]) {
    for (let idx=0; idx<tasks.length; idx++) {
      this.updateCachedTask(tasks[idx]);
    }
  }

  addList(title: string) {
    const list = {
      title: title
    };

    this.syncUpdated.next({ isOngoing: true, isManual: true });
    this.http.post<any>(LISTS_URL, list)
      .subscribe(response => {
        this.updateCachedList(response);
        this.enabledList = response._id;
        this.listUpdated.next({ lists: this.cachedLists, enabled: this.enabledList });
        this.todoUpdated.next({ todos: [] });

        this.router.navigate([TODO_ROUTE, response._id]);
        this.syncUpdated.next({ isOngoing: false, isManual: true });
      });
  }

  updateListName(id: string, title: string) {
    const index = this.cachedLists.findIndex(
      cachedList => id === cachedList._id);

    if (index > -1) {
      if (this.cachedLists[index].title !== title) {
        this.cachedLists[index].title = title;

        this.syncUpdated.next({ isOngoing: true, isManual: true });
        this.http.put<any>(LISTS_URL + id, this.cachedLists[index])
          .subscribe(response => {
            this.updateCachedList(response);
            this.syncUpdated.next({ isOngoing: false, isManual: true });
          });
      }
    }
  }

  updateListLock(id: string, locked: boolean) {
    const index = this.cachedLists.findIndex(
      cachedList => id === cachedList._id);

    if (index > -1) {
      this.cachedLists[index].locked = locked;

      this.syncUpdated.next({ isOngoing: true, isManual: true });
      this.http.put<any>(LISTS_URL + id, this.cachedLists[index])
        .subscribe(response => {
          this.updateCachedList(response);
          this.syncUpdated.next({ isOngoing: false, isManual: true });
        });
    }
  }

  updateListRanks(sortedList: List[]) {
    const updateList = {
      total: sortedList.length,
      lists: sortedList
    };

    this.http.post<any>(LISTS_URL + "sort", updateList)
      .subscribe(response => {});
  }

  deleteList(id: string) {
    const index = this.cachedLists.findIndex(
      cachedList => id === cachedList._id);

    if (index > -1) {
      this.cachedLists.splice(index, 1);
      this.http.delete<any>(LISTS_URL + id)
        .subscribe(response => {});
      this.deleteTasksByList(id);
    }
  }

  private generateTaskId() {
    return Math.random().toString(36).substr(2, 9); // temporary id
  }

  private generateTaskRank() {
    let rank = 1;
    for (let idx=0; idx<this.cachedTasks.length; idx++) {
      rank = (this.cachedTasks[idx].rank > rank) ? this.cachedTasks[idx].rank : rank;
      rank++;
    }
    return rank;
  }

  addTask(title: string, list: string) {
    const taskId = this.generateTaskId();
    const taskRank = this.generateTaskRank();
    const task = {
      id: taskId,
      title: title,
      list: list,
      rank: taskRank
    };

    this.updateCachedTask(task);
    this.todoUpdated.next({ todos: this.cachedTasks });

    /* Background sync with backend server */
    this.syncUpdated.next({ isOngoing: true, isManual: true });
    this.http.post<any>(TASKS_URL, task)
      .subscribe(response => {

        this.updateCachedTask(response);
        this.todoUpdated.next({ todos: this.cachedTasks });
        this.syncUpdated.next({ isOngoing: false, isManual: true });

        /* Update list version */
        this.http.put<any>(LISTS_URL + list, null)
          .subscribe(response => {});
      });
  }

  updateTaskName(id: string, title: string) {
    const index = this.cachedTasks.findIndex(cachedTask =>
      id === cachedTask._id ||
      id === cachedTask.id);

    if (index > -1) {
      const task = this.cachedTasks[index];
      if (task.title !== title) {
        task.title = title;

        /* Background sync with backend server */
        this.syncUpdated.next({ isOngoing: true, isManual: true });
        this.http.put<any>(TASKS_URL + task._id, task)
          .subscribe(response => {

            this.updateCachedTask(response);
            this.syncUpdated.next({ isOngoing: false, isManual: true });

            /* Update list version */
            this.http.put<any>(LISTS_URL + task.list, null)
              .subscribe(response => {});
          });
      }
    }
  }

  updateTaskFinished(id: string) {
    const index = this.cachedTasks.findIndex(cachedTask =>
      id === cachedTask._id ||
      id === cachedTask.id);

    if (index > -1) {
      const task = this.cachedTasks[index];
      task.finished = !task.finished;
      this.todoUpdated.next({ todos: this.cachedTasks });

      /* Background sync with backend server */
      this.syncUpdated.next({ isOngoing: true, isManual: true });
      this.http.put<any>(TASKS_URL + task._id, task)
        .subscribe(response => {

          this.updateCachedTask(response);
          this.syncUpdated.next({ isOngoing: false, isManual: true });
        });
    }
  }

  updateTaskRanks(sortedTasks: Todo[]) {
    const updateList = {
      total: sortedTasks.length,
      tasks: sortedTasks
    };

    this.http.post<any>(TASKS_URL + "sort", updateList)
      .subscribe(response => {});
  }

  deleteTask(id: string) {
    const index = this.cachedTasks.findIndex(cachedTask =>
      id === cachedTask._id ||
      id === cachedTask.id);

    if (index > -1) {
      const taskId =  this.cachedTasks[index]._id;
      const listId =  this.cachedTasks[index].list;

      this.cachedTasks.splice(index, 1);
      this.todoUpdated.next({ todos: this.cachedTasks });

      this.http.delete<any>(TASKS_URL + taskId)
        .subscribe(response => {
          /* Update list version */
          this.http.put<any>(LISTS_URL + listId, null)
            .subscribe(response => {});
        });
    }
  }

  deleteTasksByList(list: string) {
    const deletedTasks = this.cachedTasks.filter(
      todo => todo.list===list);

    this.cachedTasks = this.cachedTasks.filter(
      todo => todo.list!==list);

    if (deletedTasks.length > 0)
      this.http.post<any>(LISTS_URL + list + "/deleteTasks", null)
        .subscribe(response => {});
  }

}