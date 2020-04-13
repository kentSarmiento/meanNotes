import { Component , OnInit, OnDestroy } from "@angular/core";
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
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

  errorOccurred = false;
  errorMessage: string;

  isOngoingOperation = false;

  private authListener : Subscription;
  isUserAuthenticated = false;
  userId: string;

  constructor (
    public notesService: NotesService,
    private authService: AuthService,
    public route: Router) {}

  ngOnInit() {
    this.isLoading = true;
    this.errorOccurred = false;
    this.isUserAuthenticated = this.authService.getIsAuthenticated();
    this.userId = this.authService.getUserId();

    if (this.isUserAuthenticated)
      this.notesService.getNotesByUser(this.userId, this.page, this.limit);
    else
      this.isLoading = false;

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
          if (this.isUserAuthenticated)
            this.notesService.getNotesByUser(this.userId, this.page, this.limit);
          else {
            this.isLoading = false;
            this.notes = [];
            this.total = 0;
          }
        });
  }

  onChangePage(pageInfo: PageEvent) {
    this.isLoading = true;
    this.errorOccurred = false;
    this.page = pageInfo.pageIndex + 1;
    this.limit = pageInfo.pageSize;
    this.notesService.getNotesByUser(this.userId, this.page, this.limit);
  }

  onDelete(id: string) {
    this.isLoading = true;
    this.errorOccurred = false;
    this.notesService.deleteNote(id).subscribe(() => {
      this.isLoading = true;
      this.notesService.getNotesByUser(this.userId, this.page, this.limit);
    }, () => {
      this.isLoading = false;
    });
  }

  /* The following implementation for drag&drop feature should be improved */
  onUpdateNoteRankDown = (id, rank, first, index, last, done, notes) => {
    this.notesService.updateNoteRank(id, rank)
      .subscribe((result) => {
        if (done) {
          this.isOngoingOperation = false;
          return;
        }
        index = index+1;
        if (index <= last) {
          this.onUpdateNoteRankDown(notes[index].id,
                                    notes[index].rank,
                                    first, index, last, false, notes);
        } else {
          // update first entry correctly
          this.onUpdateNoteRankDown(notes[first].id,
                                    notes[first].rank,
                                    first, index, last, true, notes);
        }
      }, () => {
          // error occurred in update, re-enable operations
          this.isOngoingOperation = false;
      });
  }
  onUpdateNoteRankUp = (id, rank, first, index, last, done, notes) => {
    this.notesService.updateNoteRank(id, rank)
      .subscribe((result) => {
        if (done) {
          this.isOngoingOperation = false;
          return;
        }
        index = index-1;
        if (index >= last) {
          this.onUpdateNoteRankUp(notes[index].id,
                                  notes[index].rank,
                                  first, index, last, false, notes);
        } else {
          this.onUpdateNoteRankUp(notes[first].id,
                                  notes[first].rank,
                                  first, index, last, true, notes);
        }
      }, () => {
          this.isOngoingOperation = false;
      });
  }
  onDrop(event: CdkDragDrop<string[]>) {
    const ranks = this.notes.map(note => { return note.rank; });
    this.errorOccurred = false;

    if (event.previousIndex == event.currentIndex) {
      this.errorOccurred = true;
      this.errorMessage = "Note is not moved";
      return;
    } else if (event.previousIndex < event.currentIndex) {
      for (let idx = event.previousIndex; idx <= event.currentIndex; idx++) {
        if (this.notes[idx].creator!=this.userId) {
          this.errorOccurred = true;
          this.errorMessage = "Cannot move note made by others";
          return;
        }
      }

      moveItemInArray(this.notes, event.previousIndex, event.currentIndex);
      for (let idx = event.previousIndex; idx <= event.currentIndex; idx++) {
        this.notes[idx].rank = ranks[idx];
      }

      this.isOngoingOperation = true;
      this.onUpdateNoteRankDown(this.notes[event.previousIndex].id,
                                Number.MAX_SAFE_INTEGER,
                                event.previousIndex, event.previousIndex,
                                event.currentIndex, false, this.notes);
    } else {
      for (let idx = event.previousIndex; idx >= event.currentIndex; idx--) {
        if (this.notes[idx].creator!=this.userId) {
          this.errorOccurred = true;
          this.errorMessage = "Cannot move note made by others";
          return;
        }
      }

      moveItemInArray(this.notes, event.previousIndex, event.currentIndex);
      for (let idx = event.previousIndex; idx >= event.currentIndex; idx--) {
        this.notes[idx].rank = ranks[idx];
      }

      this.isOngoingOperation = true;
      this.onUpdateNoteRankUp(this.notes[event.previousIndex].id,
                              Number.MAX_SAFE_INTEGER,
                              event.previousIndex, event.previousIndex,
                              event.currentIndex, false, this.notes);
    }
  }

  ngOnDestroy() {
    this.authListener.unsubscribe();
    this.notesSub.unsubscribe();
  }
}