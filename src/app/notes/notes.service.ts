import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from "../../environments/environment";
import { Note } from './notes.model';

const SERVER_URL = environment.serverUrl + "/notes/";

@Injectable({providedIn: "root"}) // ensure only one instance
export class NotesService {
  private notes: Note[] = [];
  private notesUpdated = new Subject<{ notes: Note[], total: number }>(); // emitter, of sort

  /* Create HttpClient to send requests to backend server */
  constructor(private http: HttpClient, private router: Router) {}

  getNotes(page: number, limits: number) {
    const query = `?page=${page}&limit=${limits}`;
    this.http
      .get<{notes: any, total: number}>(
          SERVER_URL + query
      )
      .pipe(
        map(response => {
          return {
            notes: response.notes.map(data => {
              return {
                id: data._id,
                title: data.title,
                content: data.content,
                personal: data.personal,
                created: data.created,
                updated: data.updated,
                rank: data.rank,
                creator: data.creator,
                category: data.category,
              };
            }),
            total: response.total
          }
        }))
      .subscribe(response => {
        this.notes = response.notes;
        this.notesUpdated.next({
          notes: [...this.notes],
          total: response.total
        });
      });
  }

  getNotesByUser(userId: string, page: number, limits: number) {
    const query = `?userId=${userId}&page=${page}&limit=${limits}`;
    this.http
      .get<{notes: any, total: number}>(SERVER_URL + query)
      .pipe(
        map(response => {
          return {
            notes: response.notes.map(data => {
              return {
                id: data._id,
                title: data.title,
                content: data.content,
                personal: data.personal,
                created: data.created,
                updated: data.updated,
                rank: data.rank,
                creator: data.creator,
                category: data.category,
              };
            }),
            total: response.total
          }
        }))
      .subscribe(response => {
        this.notes = response.notes;
        this.notesUpdated.next({
          notes: [...this.notes],
          total: response.total
        });
      });
  }

  getNote(userId: string, id: string) {
    const query = `?userId=${userId}`;
    return this.http.get<any>(SERVER_URL + id + query);
  }

  getNotesUpdatedListener() {
    return this.notesUpdated.asObservable(); // provide listener for emitter
  }

  addNote(title: string, content: string) {
    const note = {  id: null,
                    title: title,
                    content: content,
                    created: new Date(),
                  };
    this.http
      .post<any>(SERVER_URL, note)
      .subscribe(() => {
        this.router.navigate(["/"]);
      }, () => {
        this.router.navigate(["/"]);
      });
  }

  updateNote(id: string, title: string, content: string) {
    const note = {  id: id,
                    title: title,
                    content: content,
                    updated: new Date()
                  };
    this.http
      .put(SERVER_URL + id, note)
      .subscribe(() => {
        this.router.navigate(["/"]);
      }, () => {
        this.router.navigate(["/"]);
      });
  }

  updateNoteRank(id: string, rank: Number) {
    const note = {
      id: id,
      rank: rank
    };
    return this.http.put(SERVER_URL + id, note);
  }

  updateNoteLabel(id: string, category: string[]) {
    const note = {
      id: id,
      category: category
    };
    return this.http.put(SERVER_URL + id, note);
  }

  deleteNote(id: string) {
    return this.http.delete(SERVER_URL + id);
  }
}