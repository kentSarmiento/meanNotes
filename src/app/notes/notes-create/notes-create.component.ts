import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { NotesService } from '../notes.service';
import { Note } from '../notes.model';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-notes-create',
  templateUrl: './notes-create.component.html',
  styleUrls: [
    '../../header/header.component.css',
    './notes-create.component.css'
  ]
})
export class NotesCreateComponent implements OnInit {
  private mode = 'create';
  private id: string;
  private personal = true;
  note: Note;
  isLoading = false;

  form: FormGroup;

  private authListener : Subscription;
  isUserAuthenticated = false;
  userId: string;

  constructor (
    private notesService: NotesService,
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.form = new FormGroup({
      title: new FormControl("", {
        validators: [Validators.required]
      }),
      content: new FormControl("", {
        validators: [Validators.required]
      })
    })

    this.isUserAuthenticated = this.authService.getIsAuthenticated();
    this.userId = this.authService.getUserId();

    this.activatedRoute.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has('id')) {
        this.mode = 'edit';
        this.id = paramMap.get('id');
        this.isLoading = true;
        this.notesService.getNote(this.userId, this.id).subscribe(noteData => {
          this.isLoading = false;
          this.note = {  id: noteData._id,
                         title: noteData.title, content: noteData.content,
                         personal: noteData.personal, creator: noteData.creator,
                         category: noteData.category,
                         created: noteData.created, updated: noteData.updated,
                         rank: noteData.rank };
          this.form.setValue({
            title: noteData.title,
            content: noteData.content
          });
        }, () => {
            this.isLoading = false;
            this.router.navigate(["/"]);
        });
      } else {
        this.mode = 'create';
        this.id = null;
        this.note = { id: null,
                      title: "", content: "",
                      personal: undefined, creator: undefined, category: undefined,
                      created: undefined, updated: undefined, rank: undefined };
      }
    });
  }

  focusEditor(event) {
    event.focus();
  }

  onSaveNote() {
    if (this.form.invalid) {
      return;
    }
    this.isLoading = true;
    if (this.mode === 'create' ){
      this.notesService.addNote( this.form.value.title,
                                 this.form.value.content);
    } else {
      this.notesService.updateNote( this.id,
                                    this.form.value.title,
                                    this.form.value.content);
    }
    this.form.reset();
  }
}
