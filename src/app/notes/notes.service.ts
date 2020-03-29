import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Subject } from 'rxjs';

import { Note } from './notes.model';

@Injectable({providedIn: "root"}) // ensure only one instance
export class NotesService {
  private notes: Note[] = [];
  private notesUpdated = new Subject<Note[]>(); // emitter, of sort

  /* Create HttpClient to send requests to backend server */
  constructor(private http: HttpClient) {}

  getNotes() {
    this.http
      .get<Note[]>(
          "http://localhost:3000/notes"
      )
      .subscribe((data: Note[]) => {
        this.notes = data;
        this.notesUpdated.next([...this.notes]);
      });
  }

  getNotesUpdatedListener() {
    return this.notesUpdated.asObservable(); // provide listener for emitter
  }

  addNote(title: string, content: string,
          category: string, author: string) {
    const note: Note = { _id: null, title: title,
                          content: content,
                          category: category,
                          author: author };
    this.http
      .post(
          "http://localhost:3000/notes", note
      )
      .subscribe(() => {
        this.notes.push(note);
        this.notesUpdated.next([...this.notes]);
      });
  }
}
