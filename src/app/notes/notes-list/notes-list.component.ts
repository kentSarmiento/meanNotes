import { Component , OnInit, OnDestroy } from "@angular/core";
import { PageEvent } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

import { Note } from "../notes.model"
import { NotesService } from '../notes.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.css'],
})
export class NotesListComponent implements OnInit {
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
    private authService: AuthService,
    public route: Router) {}

  ngOnInit() {
    this.isLoading = true;
    this.isUserAuthenticated = this.authService.getIsAuthenticated();
    this.userId = this.authService.getUserId();

    if (this.route.url === "/personal") {
      this.notesService.getNotesByUser(this.userId, this.page, this.limit);
    } else {
      this.notesService.getNotes(this.page, this.limit);
    }

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

          this.isLoading = true;
          if (this.route.url === "/personal") {
            this.notesService.getNotesByUser(this.userId, this.page, this.limit);
          } else {
            this.notesService.getNotes(this.page, this.limit);
          }
        });
  }

  onChangePage(pageInfo: PageEvent) {
    this.isLoading = true;
    this.page = pageInfo.pageIndex + 1;
    this.limit = pageInfo.pageSize;
    if (this.route.url === "/personal") {
      this.notesService.getNotesByUser(this.userId, this.page, this.limit);
    } else {
      this.notesService.getNotes(this.page, this.limit);
    }
  }

  onDelete(id: string) {
    this.isLoading = true;
    this.notesService.deleteNote(id).subscribe(() => {
      this.isLoading = true;
      if (this.route.url === "/personal") {
        this.notesService.getNotesByUser(this.userId, this.page, this.limit);
      } else {
        this.notesService.getNotes(this.page, this.limit);
      }
    });
  }

  ngOnDestroy() {
    this.authListener.unsubscribe();
    this.notesSub.unsubscribe();
  }
}
