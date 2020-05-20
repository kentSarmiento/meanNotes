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

export enum OperationMethod {
  NONE = -1,
  POST = 0,
  GET,
  PUT,
  DELETE,

  CREATE_LIST,
  RENAME_LIST,
  DELETE_LIST,

  CREATE_TASK,
  RENAME_TASK,
  FINISH_TASK,
  ONGOING_TASK,
  DELETE_TASK
};

@Injectable({providedIn: "root"})
export class TodoService {
  private listUpdated = new Subject<{ lists: List[], enabled: string }>();
  private cachedLists: List[] = [];
  private enabledList: string;

  private todoUpdated = new Subject<{ todos: Todo[] }>();
  private cachedTasks: Todo[] = [];

  private syncUpdated = new Subject<{ isOngoing: boolean, operation: OperationMethod }>();

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

  private notifyUpdatedTasks() {
    this.todoUpdated.next({ todos: this.cachedTasks });
  }

  private notifyUpdatedLists() {
    this.listUpdated.next({ lists: this.cachedLists, enabled: this.enabledList });
  }

  private notifyOngoingSync() {
    this.syncUpdated.next({ isOngoing: true, operation: OperationMethod.NONE });
  }

  private notifyFinishedSync(op: OperationMethod) {
    this.syncUpdated.next({ isOngoing: false, operation: op });
  }

  retrieveDataFromServer(list: string) {
    this.notifyOngoingSync();
    this.http
      .get<any>(LISTS_URL)
      .subscribe(response => {

        this.enabledList = list;
        this.cachedLists = response.lists;
        this.notifyUpdatedLists();
        this.http
          .get<any>(TASKS_URL)
          .subscribe(response => {
            this.cachedTasks = response.tasks;
            this.notifyUpdatedTasks();

            this.notifyFinishedSync(OperationMethod.GET);
          });
      });
  }

  changeEnabledListToAll() {
    this.router.navigate([TODO_ROUTE]);

    this.enabledList = null;
    this.notifyUpdatedLists();
    this.notifyUpdatedTasks();
    this.notifyFinishedSync(OperationMethod.NONE);
  }

  changeEnabledList(list: string) {
    this.router.navigate([TODO_ROUTE, list]);

    this.http.get<any>(LISTS_URL + list)
      .subscribe(response => {

        const updated = this.updateCachedList(response);
        if (updated) {
          this.enabledList = response._id;
          this.notifyUpdatedLists();
          this.http.get<any>(LISTS_URL + list + "/tasks")
            .subscribe(response => {

              this.updateCachedTasks(response.tasks);
              this.notifyUpdatedTasks();
              this.notifyFinishedSync(OperationMethod.GET);
            });
        } else {
          this.enabledList = response._id;
          this.notifyUpdatedLists();
          this.notifyUpdatedTasks();
          this.notifyFinishedSync(OperationMethod.GET);
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

  getLists() {
    return this.cachedLists;
  }

  getEnabledList() {
    return this.enabledList;
  }

  addList(title: string) {
    const list = {
      title: title
    };

    this.notifyOngoingSync();
    this.http.post<any>(LISTS_URL, list)
      .subscribe(response => {
        this.updateCachedList(response);
        this.enabledList = response._id;
        this.notifyUpdatedLists();
        this.todoUpdated.next({ todos: [] });

        this.router.navigate([TODO_ROUTE, response._id]);
        this.notifyFinishedSync(OperationMethod.CREATE_LIST);
      });
  }

  copyTasks(from: string, to: string) {
    const copiedTasks = this.cachedTasks.filter(
      todo => todo.list===from);

    if (copiedTasks.length > 0) {
      let newTasks = [];
      for (let idx=0; idx < copiedTasks.length; idx++) {
        const task = {
          id: this.generateTaskId(),
          title: copiedTasks[idx].title,
          list: to,
          rank: this.generateTaskRank()
        };
        newTasks.push(task)
      }

      const taskList = {
        total: newTasks.length,
        tasks: newTasks
      };
      this.http.post<any>(TASKS_URL + "batchCreate", taskList)
        .subscribe(response => {
          /* Update list version */
          this.http.put<any>(LISTS_URL + to, null)
            .subscribe(response => {});
        });
    }
  }

  copyList(from: string, title: string) {
    const list = {
      title: title
    };

    this.notifyOngoingSync();
    this.http.post<any>(LISTS_URL, list)
      .subscribe(response => {
        this.updateCachedList(response);
        this.notifyUpdatedLists();

        this.copyTasks(from, response._id);
        this.notifyFinishedSync(OperationMethod.CREATE_LIST);
      });
  }

  updateListName(id: string, title: string) {
    const index = this.cachedLists.findIndex(
      cachedList => id === cachedList._id);

    if (index > -1) {
      if (this.cachedLists[index].title !== title) {
        this.cachedLists[index].title = title;

        this.notifyOngoingSync();
        this.http.put<any>(LISTS_URL + id, this.cachedLists[index])
          .subscribe(response => {
            this.updateCachedList(response);
            this.notifyFinishedSync(OperationMethod.RENAME_LIST);
          });
      }
    }
  }

  updateListLock(id: string, locked: boolean) {
    const index = this.cachedLists.findIndex(
      cachedList => id === cachedList._id);

    if (index > -1) {
      this.cachedLists[index].locked = locked;

      this.notifyOngoingSync();
      this.http.put<any>(LISTS_URL + id, this.cachedLists[index])
        .subscribe(response => {
          this.updateCachedList(response);
          this.notifyFinishedSync(OperationMethod.NONE);
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

      /* No need to wait for backend processing */
      this.notifyFinishedSync(OperationMethod.DELETE_LIST);
    }
  }

  getTasks() {
    return this.cachedTasks;
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
    this.notifyUpdatedTasks();

    /* Background sync with backend server */
    this.notifyOngoingSync();
    this.http.post<any>(TASKS_URL, task)
      .subscribe(response => {

        this.updateCachedTask(response);
        this.notifyUpdatedTasks();
        this.notifyFinishedSync(OperationMethod.CREATE_TASK);

        /* Update list version */
        this.http.put<any>(LISTS_URL + list, null)
          .subscribe(response => {});
      });
  }

  updateTask(id: string, title: string, list: string) {
    const index = this.cachedTasks.findIndex(cachedTask =>
      id === cachedTask._id ||
      id === cachedTask.id);

    if (index > -1) {
      const task = this.cachedTasks[index];
      const originalList = task.list;
      if (task.title !== title || task.list !== list) {
        task.title = title;
        task.list = list;

        /* Background sync with backend server */
        this.notifyOngoingSync();
        this.http.put<any>(TASKS_URL + task._id, task)
          .subscribe(response => {

            this.updateCachedTask(response);
            this.notifyUpdatedTasks();
            this.notifyFinishedSync(OperationMethod.RENAME_TASK);

            /* Update list version */
            this.http.put<any>(LISTS_URL + task.list, null)
              .subscribe(response => {});
            if (task.list !== originalList) {
              this.http.put<any>(LISTS_URL + originalList, null)
                .subscribe(response => {});
            }
          });
      }
    }
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
        this.notifyOngoingSync();
        this.http.put<any>(TASKS_URL + task._id, task)
          .subscribe(response => {

            this.updateCachedTask(response);
            this.notifyFinishedSync(OperationMethod.RENAME_TASK);

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
      this.notifyUpdatedTasks();

      /* Background sync with backend server */
      this.notifyOngoingSync();
      this.http.put<any>(TASKS_URL + task._id, task)
        .subscribe(response => {

          this.updateCachedTask(response);
          if (task.finished) this.notifyFinishedSync(OperationMethod.FINISH_TASK);
          else this.notifyFinishedSync(OperationMethod.ONGOING_TASK);
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
      this.notifyUpdatedTasks();

      this.http.delete<any>(TASKS_URL + taskId)
        .subscribe(response => {
          /* Update list version */
          this.http.put<any>(LISTS_URL + listId, null)
            .subscribe(response => {});
        });

      this.notifyFinishedSync(OperationMethod.DELETE_TASK);
    }
  }

  deleteTasksByList(list: string) {
    const deletedTasks = this.cachedTasks.filter(
      todo => todo.list===list);

    this.cachedTasks = this.cachedTasks.filter(
      todo => todo.list!==list);
    this.notifyUpdatedTasks();

    if (deletedTasks.length > 0)
      this.http.post<any>(LISTS_URL + list + "/deleteTasks", null)
        .subscribe(response => {});
  }

  deleteTasksByOngoing(list: string) {
    const deletedTasks = this.cachedTasks.filter(todo =>
      todo.list===list && todo.finished!==true);

    this.cachedTasks = this.cachedTasks.filter(todo =>
      todo.list!==list || todo.finished===true);
    this.notifyUpdatedTasks();

    if (deletedTasks.length > 0)
      this.http.post<any>(LISTS_URL + list + "/deleteOngoingTasks", null)
        .subscribe(response => {});
  }

  deleteTasksByFinished(list: string) {
    const deletedTasks = this.cachedTasks.filter(todo =>
      todo.list===list && todo.finished===true);

    this.cachedTasks = this.cachedTasks.filter(todo =>
      todo.list!==list || todo.finished!==true);
    this.notifyUpdatedTasks();

    if (deletedTasks.length > 0)
      this.http.post<any>(LISTS_URL + list + "/deleteFinishedTasks", null)
        .subscribe(response => {});
  }

}