import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { Note } from './notes.model';

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
          "http://localhost:3000/notes" + query
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
                creator: data.creator,
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
    const query = `?page=${page}&limit=${limits}`;
    this.http
      .get<{notes: any, total: number}>(
          "http://localhost:3000/users/" + userId + "/notes" + query
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
                creator: data.creator,
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

  getNote(id: string) {
    return this.http.get<any>("http://localhost:3000/notes/" + id);
  }

  getNotesUpdatedListener() {
    return this.notesUpdated.asObservable(); // provide listener for emitter
  }

  addNote(title: string, content: string, personal: boolean) {
    const note: Note = {  id: null,
                          title: title,
                          content: content,
                          personal: personal,
                          creator: null // creator information is retrieved from token
                        };
    this.http
      .post<any>(
          "http://localhost:3000/notes", note
      )
      .subscribe(() => {
        this.router.navigate(["/"]);
      });
  }

  updateNote(id: string, title: string, content: string, personal: boolean) {
    const note: Note = {  id: id,
                          title: title,
                          content: content,
                          personal: personal,
                          creator: null // creator information is retrieved from token
                        };
    this.http
      .put(
          "http://localhost:3000/notes/" + id, note
      )
      .subscribe(() => {
        this.router.navigate(["/"]);
      });
  }

  deleteNote(id: string) {
    return this.http
      .delete( "http://localhost:3000/notes/" + id );
  }
}