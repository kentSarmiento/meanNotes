import { Component, OnInit, HostListener } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';

import { NotesService } from '../notes.service';
import { Note } from '../notes.model';

@Component({
  selector: 'app-notes-create',
  templateUrl: './notes-create.component.html',
  styleUrls: ['../../header/header.component.css', './notes-create.component.css']
})
export class NotesCreateComponent implements OnInit {
  private mode = 'create';
  private id: string;
  private personal = true;
  note: Note;
  isLoading = false;

  textareaRow = 8;

  constructor(public notesService: NotesService, public route: ActivatedRoute) {}

  ngOnInit() {
    this.resizeTextarea();
    this.route.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has('id')) {
        this.mode = 'edit';
        this.id = paramMap.get('id');
        this.isLoading = true;
        this.notesService.getNote(this.id).subscribe(noteData => {
          this.isLoading = false;
          this.note = {  id: noteData._id,
                         title: noteData.title, content: noteData.content,
                         personal: noteData.personal, creator: noteData.creator,
                         created: noteData.created, updated: noteData.updated,
                         rank: noteData.rank };
          });
      } else {
        this.mode = 'create';
        this.id = null;
        this.note = { id: null,
                      title: "", content: "",
                      personal: undefined, creator: undefined,
                      created: undefined, updated: undefined, rank: undefined };
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize(event) { this.resizeTextarea(); }

  resizeTextarea() {
    // FIXME : This is temporary calculations based on padding-top(64) and font-size(14)
    this.textareaRow = Math.floor((window.innerHeight - 64) / 14) - 10;
  }

  togglePersonal() {
    this.personal = false;
  }

  onSaveNote(form: NgForm) {
    if (form.invalid) {
      return;
    }
    this.isLoading = true;
    if (this.mode === 'create' ){
      this.notesService.addNote( form.value.title,
                                 form.value.content,
                                 this.personal );
    } else {
      this.notesService.updateNote( this.id,
                                    form.value.title,
                                    form.value.content,
                                    this.personal );
    }
    form.resetForm();
  }
}
