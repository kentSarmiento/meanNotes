import { Component , OnInit, OnDestroy, Inject } from "@angular/core";
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { PageEvent } from '@angular/material/paginator';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER, SPACE } from '@angular/cdk/keycodes';

import { Note } from "../notes.model"
import { NotesService } from '../notes.service';
import { AuthService } from '../../auth/auth.service';

export interface CategoryData {
  category: string[];
}

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
    public router: Router,
    private dialog: MatDialog) {}

  ngOnInit() {
    this.isLoading = true;
    this.isOngoingOperation = false
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
        this.isOngoingOperation = false
          if (this.isUserAuthenticated) {
            this.total = notebook.total;
            this.notes = notebook.notes;
          } else {
            this.notes = [];
            this.total = 0;
          }
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
            this.isOngoingOperation = false
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

  onOpenNote(note: Note) {
    this.router.navigate(["/view/" + note.id]);
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

  onUpdateNoteLabel(note: Note) {
    this.isOngoingOperation = true;
    this.notesService.updateNoteLabel(note.id, note.category)
      .subscribe(result => {
        this.isOngoingOperation = false;
      }, () => {
        this.isOngoingOperation = false;
      });
  }
  onLabelNote(note: Note) {
    if (note.category === undefined) {
      note.category = [];
    }
    const currentCategory = note.category.map(
                              category => { return category; });
    const dialogRef = this.dialog.open(NotesListCategoryDialog, {
      width: '680px', maxHeight: '240px',
      data: {category: note.category}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (JSON.stringify(currentCategory) !== JSON.stringify(result.category)) {
          note.category = result.map(
                            category => { return category; });
          this.onUpdateNoteLabel(note);
        }
      }
    });
  }

  onDelete(id: string) {
    const dialogRef = this.dialog.open(NotesListDeleteDialog, {
      width: '240px', maxHeight: '240px'
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed == true) {
        this.isOngoingOperation = true;
        this.errorOccurred = false;
        this.notesService.deleteNote(id).subscribe(() => {
          this.notesService.getNotesByUser(this.userId, this.page, this.limit);
        }, () => {
          this.isOngoingOperation = false;
        });
      }
    });
  }

  ngOnDestroy() {
    this.authListener.unsubscribe();
    this.notesSub.unsubscribe();
  }
}

@Component({
  selector: 'notes-list-category-dialog',
  templateUrl: './notes-list-category-dialog.html',
  styleUrls: ['./notes-list.component.css'],
})
export class NotesListCategoryDialog {
  readonly separatorKeysCodes: number[] = [ENTER, COMMA, SPACE];

  constructor(
    public dialogRef: MatDialogRef<NotesListCategoryDialog>,
    @Inject(MAT_DIALOG_DATA) public data: CategoryData) {}

  onAddCategory(event: MatChipInputEvent) {
    this.data.category.push(event.value.trim());
    event.input.value = '';
  }

  onRemoveCategory(category: string) {
    const index = this.data.category.indexOf(category);

    if (index >= 0) {
      this.data.category.splice(index, 1);
    }
  }
}

@Component({
  selector: 'notes-list-delete-dialog',
  templateUrl: './notes-list-delete-dialog.html',
  styleUrls: ['./notes-list.component.css'],
})
export class NotesListDeleteDialog {

  constructor(public dialogRef: MatDialogRef<NotesListDeleteDialog>) {}
}