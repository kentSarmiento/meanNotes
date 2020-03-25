import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-notes-create',
  templateUrl: './notes-create.component.html',
  styleUrls: ['./notes-create.component.css']
})
export class NotesCreateComponent {
  enteredNoteTitle='';
  enteredNoteContent='';

  @Output() noteCreated = new EventEmitter();

  onAddNote() {
    const post = {
      title: this.enteredNoteTitle,
      content: this.enteredNoteContent
    };
    this.noteCreated.emit(post);
  }
}
