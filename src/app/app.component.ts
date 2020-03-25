import { Component } from '@angular/core';

import { Note } from './notes/notes.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  savedNotes: Note [] = [];

  onNoteAdded(note) {
    this.savedNotes.push(note);
  }
}
