import { Component, EventEmitter, Output } from '@angular/core';

import { Note } from '../notes.model';

@Component({
  selector: 'app-notes-create',
  templateUrl: './notes-create.component.html',
  styleUrls: ['./notes-create.component.css']
})
export class NotesCreateComponent {
  enteredNoteTitle='';
  enteredNoteContent='';
  enteredCategory='';
  authorName='';

  @Output() noteCreated = new EventEmitter<Note>();

  onAddNote() {
    const note : Note = {
      title: this.enteredNoteTitle,
      content: this.enteredNoteContent,
      category: this.enteredCategory,
      author: this.authorName,
    };
    this.noteCreated.emit(note);
  }
}
