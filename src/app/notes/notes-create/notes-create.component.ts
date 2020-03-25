import { Component } from '@angular/core';

@Component({
  selector: 'app-notes-create',
  templateUrl: './notes-create.component.html',
  styleUrls: ['./notes-create.component.css']
})
export class NotesCreateComponent {
  textareaValue = '';
  newNote = '';

  onAddNote() {
    this.newNote = this.textareaValue;
  }
}
