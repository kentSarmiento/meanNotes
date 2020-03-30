import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { NotesService } from '../notes.service';
import { Note } from '../notes.model';

@Component({
  selector: 'app-notes-create',
  templateUrl: './notes-create.component.html',
  styleUrls: ['./notes-create.component.css']
})
export class NotesCreateComponent implements OnInit {
  private mode = 'create';
  private id: string;
  note: Note;
  isLoading = false;

  constructor(public notesService: NotesService, public route: ActivatedRoute) {}

  ngOnInit() {
    this.route.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has('id')) {
        this.mode = 'edit';
        this.id = paramMap.get('id');
        this.isLoading = true;
        this.notesService.getNote(this.id).subscribe(noteData => {
          this.isLoading = false;
          this.note = {  id: noteData._id,
                         title: noteData.title,
                         content: noteData.content,
                         category: noteData.category,
                         author: noteData.author};
          });
      } else {
        this.mode = 'create';
        this.id = null;
      }
    });
  }

  onSaveNote(form: NgForm) {
    if (form.invalid) {
      return;
    }
    this.isLoading = true;
    if (this.mode === 'create' ){
      this.notesService.addNote( form.value.title,
                                 form.value.content,
                                 form.value.category,
                                 form.value.author );
    } else {
      this.notesService.updateNote( this.id,
                                    form.value.title,
                                    form.value.content,
                                    form.value.category,
                                    form.value.author );
    }
    form.resetForm();
  }
}
