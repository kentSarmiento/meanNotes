import { Component , OnInit, OnDestroy } from "@angular/core";
import { PageEvent } from '@angular/material/paginator';
import { Subscription } from 'rxjs';

import { Note } from "../notes.model"
import { NotesService } from '../notes.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-notes-private',
  templateUrl: './notes-private.component.html',
  styleUrls: ['./notes-private.component.css'],
})
export class NotesPrivateComponent implements OnInit {
  private notesSub : Subscription;
  notes: Note[] = [];
  page = 1;
  limit = 5;
  total = 0;
  options = [1, 2, 5, 10];
  isLoading = false;

  private authListener : Subscription;
  isUserAuthenticated = false;
  userId: string;

  constructor (
    public notesService: NotesService,
    private authService: AuthService) {}

  ngOnInit() {
    this.isLoading = true;
    this.isUserAuthenticated = this.authService.getIsAuthenticated();
    this.userId = this.authService.getUserId();
    this.notesService.getNotesByUser(this.userId, this.page, this.limit);

    this.notesSub = this.notesService
      .getNotesUpdatedListener()
      .subscribe( (notebook: { notes: Note[], total: number }) => {
        this.isLoading = false;
        this.total = notebook.total;
        this.notes = notebook.notes;
      });

     this.authListener = this.authService
       .getAuthStatusListener()
       .subscribe( isAuthenticated => {
          this.isUserAuthenticated = this.authService.getIsAuthenticated();
          this.userId = this.authService.getUserId();
        });
  }

  onChangePage(pageInfo: PageEvent) {
    this.isLoading = true;
    this.page = pageInfo.pageIndex + 1;
    this.limit = pageInfo.pageSize;
    this.notesService.getNotesByUser(this.userId, this.page, this.limit);
  }

  onDelete(id: string) {
    this.isLoading = true;
    this.notesService.deleteNote(id).subscribe(() => {
      this.notesService.getNotesByUser(this.userId, this.page, this.limit);
    });
  }

  ngOnDestroy() {
    this.authListener.unsubscribe();
    this.notesSub.unsubscribe();
  }
}
