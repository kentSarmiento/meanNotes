import { Component, EventEmitter, Output } from '@angular/core';
import { NgForm } from '@angular/forms';

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

  onAddNote(form: NgForm) {
    if (form.invalid) {
      return;
    }
    const note : Note = {
      title: form.value.title,
      content: form.value.content,
      category: form.value.category,
      author: form.value.author,
    };
    this.noteCreated.emit(note);
  }
}
