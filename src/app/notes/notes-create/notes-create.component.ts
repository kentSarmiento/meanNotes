import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';

import { Note } from '../notes.model';
import { NotesService } from '../notes.service';

@Component({
  selector: 'app-notes-create',
  templateUrl: './notes-create.component.html',
  styleUrls: ['./notes-create.component.css']
})
export class NotesCreateComponent {

  constructor(public notesService: NotesService ) {}

  onAddNote(form: NgForm) {
    if (form.invalid) {
      return;
    }
    this.notesService.addNote( form.value.title,
                               form.value.content,
                               form.value.category,
                               form.value.author );
    form.resetForm();
  }
}
