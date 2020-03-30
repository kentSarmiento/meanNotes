import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';

import { Note } from './notes.model';

@Injectable({providedIn: "root"}) // ensure only one instance
export class NotesService {
  private notes: Note[] = [];
  private notesUpdated = new Subject<Note[]>(); // emitter, of sort

  /* Create HttpClient to send requests to backend server */
  constructor(private http: HttpClient) {}

  getNotes() {
    this.http
      .get<any>(
          "http://localhost:3000/notes"
      )
      .pipe(map((data) => {
        return data.map(data => {
          return {
            id: data._id,
            title: data.title,
            content: data.content,
            category: data.category,
            author: data.author,
          };
        });
      }))
      .subscribe((data: Note[]) => {
        this.notes = data;
        this.notesUpdated.next([...this.notes]);
      });
  }

  getNote(id: string) {
    return this.http.get<any>("http://localhost:3000/notes/" + id);
  }

  getNotesUpdatedListener() {
    return this.notesUpdated.asObservable(); // provide listener for emitter
  }

  addNote(title: string, content: string,
          category: string, author: string) {
    const note: Note = {  id: null,
                          title: title,
                          content: content,
                          category: category,
                          author: author
                        };
    this.http
      .post<any>(
          "http://localhost:3000/notes", note
      )
      .subscribe(response => {
        note.id = response._id;
        this.notes.push(note);
        this.notesUpdated.next([...this.notes]);
      });
  }

  updateNote(id: string, title: string, content: string,
             category: string, author: string) {
    const note: Note = {  id: id,
                          title: title,
                          content: content,
                          category: category,
                          author: author
                        };
    this.http
      .put(
          "http://localhost:3000/notes/" + id, note
      )
      .subscribe(response => {
        const updatedNotes = this.notes;
        const updatedNoteIdx = this.notes.findIndex(note => note.id !== id);
        updatedNotes[updatedNoteIdx] = note;
        this.notes = updatedNotes;
        this.notesUpdated.next([...this.notes]);
      });
  }

  deleteNote(id: string) {
    this.http
      .delete(
          "http://localhost:3000/notes/" + id
      )
      .subscribe(() => {
        const updatedNotes = this.notes.filter(note => note.id !== id);
        this.notes = updatedNotes;
        this.notesUpdated.next([...this.notes]);
      });
  }

}
