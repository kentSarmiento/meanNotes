import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  savedNotes = [];

  onNoteAdded(note) {
    this.savedNotes.push(note);
  }
}
