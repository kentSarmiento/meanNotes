import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { NotesService } from '../notes.service';
import { Note } from '../notes.model';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-notes-view',
  templateUrl: './notes-view.component.html',
  styleUrls: [
    '../../header/header.component.css',
    './notes-view.component.css'
  ]
})
export class NotesViewComponent implements OnInit {
  private id: string;
  note: Note;
  isLoading = false;

  private authListener : Subscription;
  isUserAuthenticated = false;
  userId: string;

  constructor (
    private notesService: NotesService,
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
    this.isUserAuthenticated = this.authService.getIsAuthenticated();
    this.userId = this.authService.getUserId();

    this.activatedRoute.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has('id')) {
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
        }, () => {
            this.isLoading = false;
            this.router.navigate(["/"]);
        });
      }
    });
  }
}
