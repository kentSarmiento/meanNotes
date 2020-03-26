import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { Note } from './notes.model';

@Injectable({providedIn: 'root'}) // ensure only one instance
export class NotesService {
  private notes: Note[] = [];
  private notesUpdated = new Subject<Note[]>(); // emitter, of sort

  getNotes() {
    return [...this.notes]; // copy value, not reference
  }

  getNotesUpdatedListener() {
    return this.notesUpdated.asObservable(); // provide listener for emitter
  }

  addNote(title: string, content: string,
          category: string, author: string) {
    const note: Note = { title: title,
                          content: content,
                          category: category,
                          author: author };
    this.notes.push(note);
    this.notesUpdated.next([...this.notes]);
  }
}
