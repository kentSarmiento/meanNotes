import { Component, Inject, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { Subscription } from "rxjs";
import { MatSidenav } from '@angular/material/sidenav';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { ActivatedRoute, ParamMap } from '@angular/router';

import { NoteConfig } from "../note.config";
import { NoteHeaderComponent } from "../note-header/note-header.component";
import { NoteService } from "../note.service";
import { OperationMethod } from "../note.service";
import { Note, Book } from "../note.model";
import { AuthService } from "../../auth/auth.service";
import { NoteSidebarService } from "./note-sidebar.service";
import { ResponsiveService } from "../../app-responsive.service";

const NOTE_ROUTE = NoteConfig.rootRoute;

export interface NoteTabData {
  id: string;
  title: string;
  book: string;
  content: string;
}

export interface NoteData {
  title: string;
  book: string;
  isCopy: boolean;
  addBook: boolean;
}

export interface BookData {
  title: string;
  isCopy: boolean;
}

export interface ListData {
  books: Book[];
  notes: Note[];
}

export interface ConfirmDialogData {
  title: string;
  message: string;
}

@Component({
  selector: 'app-note-main',
  templateUrl: './note-main.component.html',
  styleUrls: [ './note-main.component.css' ]
})
export class NoteMainComponent implements OnInit, OnDestroy {
  private bookListener : Subscription;
  books : Book[] = [];
  booksEdit = false;
  enabledBook: string;
  enabledBookName: string;

  isSortableInBook = false;

  private noteListener : Subscription;
  notes : Note[] = [];
  private noteOpener : Subscription;

  openedNotes: NoteTabData[] = [];
  enabledIndex: number;

  form: FormGroup;

  bookAdd = false;
  bookEdit = false;
  bookEditName = false;

  private authListener : Subscription;
  isUserAuthenticated = false;
  userId: string;

  private syncListener : Subscription;
  isSyncing = false;

  isLoading = false;
  isFirstLoad = true;

  private viewUpdated: Subscription;
  isMobileView: boolean;

  isBookViewMode = false;

  readonly noteRoute = NOTE_ROUTE;

  @ViewChild('sidenav') sidenav: MatSidenav;

  constructor(
    private noteService: NoteService,
    private authService: AuthService,
    private sidebarService: NoteSidebarService,
    private responsiveService: ResponsiveService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.form = new FormGroup({
      title: new FormControl("", {
        validators: [Validators.required]
      }),
      content: new FormControl("", {
        validators: [Validators.required]
      })
    });

    this.isLoading = true;

    this.enabledBook = null;
    this.activatedRoute.paramMap.subscribe((paramMap: ParamMap) => {
      if (paramMap.has('id')) {
        const id = paramMap.get('id');
        if (id !== "all") {
          this.enabledBook = id;
          this.isBookViewMode = false;
        }
      }
    });

    this.authListener = this.authService
      .getAuthStatusListener()
      .subscribe( isAuthenticated => {
        this.isUserAuthenticated = this.authService.getIsAuthenticated();
        this.userId = this.authService.getUserId();
      });

    this.bookListener = this.noteService
      .getBookUpdatedListener()
      .subscribe( (updated: { books: Book[], enabled: string }) => {
        this.books = updated.books;
        this.sortByRank(this.books);
        this.enabledBook = updated.enabled;
        this.enabledBookName = this.getEnabledBookName();
        this.bookEdit = this.getEnabledBookLock();

        this.checkSortableInBook();
      });

    this.noteListener = this.noteService
      .getNoteUpdatedListener()
      .subscribe( (updated: { notes: Note[] }) => {
        if (updated.notes) {
          if (!this.enabledBook) {
            this.notes = updated.notes;
          } else {
            this.notes = updated.notes.filter(note =>
                note.book===this.enabledBook);
          }
          this.sortByRank(this.notes);

          this.checkSortableInBook();
        } else {
          this.notes = null;
        }
      });

    this.noteOpener = this.noteService
      .getNoteOpenerListener()
      .subscribe( response => {
        this.openNote(response.note);
      });

    this.syncListener = this.noteService
      .getSyncUpdatedListener()
      .subscribe( (sync: { isOngoing: boolean, operation: OperationMethod }) => {
        this.isSyncing = sync.isOngoing;

        if (!sync.isOngoing) {
          if (this.isFirstLoad) {
            this.isFirstLoad = false;

            if (this.enabledBook) this.noteService.changeEnabledBook(this.enabledBook);
            else this.noteService.changeEnabledBookToAll();

            this.sidenav.open();
          }
          this.isLoading = false;

          this.notifyOperationResult(sync.operation)
        }
      });

    this.viewUpdated = this.responsiveService
      .getViewUpdatedListener()
      .subscribe( isMobile => {
        this.isMobileView = isMobile;
        if (!isMobile) this.sidenav.open();
      })
    this.isMobileView = this.responsiveService.checkWidth();

    this.isUserAuthenticated = this.authService.getIsAuthenticated();
    if (this.isUserAuthenticated) {
      this.userId = this.authService.getUserId();

      this.noteService.retrieveDataFromServer(this.enabledBook);
    } else {
      /* login first if not authenticated */
      this.authService.loginUser(this.noteRoute.substring(1));
    }
  }

  ngAfterViewInit() {
    this.sidebarService.setSidenav(this.sidenav);

    if (!this.isMobileView) this.sidenav.open();

    this.sidenav.openedChange.subscribe((open: boolean) => {
      // When sidenav is opened, note edit should be disabled
      if (open) this.toggleEditBook(false);
      // When sidenav is closed, book edit should be disabled
      else this.toggleEditBooks(false);
    });
  }

  toggleMenu() {
    this.sidenav.toggle();
  }

  closeSidenav() {
    if (this.isMobileView) this.sidenav.close();
    else this.sidenav.open();
  }

  toggleBookViewMode(isBookView: boolean) {
    this.isBookViewMode = isBookView;
  }

  private getEnabledBookName() {
    const index = this.books.findIndex(
      book => this.enabledBook === book._id);

    if (index > -1) return this.books[index].title;
    else return "All Notes";
  }

  private getEnabledBookLock() {
    const index = this.books.findIndex(
      book => this.enabledBook === book._id);

    if (index > -1) return this.books[index].locked;
    else return false;
  }

  private sortByRank(book: any) {
    book.sort(this.reverseSort("rank"));
  }
  private sorter(criteria) {
    return function(a, b) {
      if (a[criteria] > b[criteria]) return 1;
      else if (a[criteria] < b[criteria]) return -1;
      return 0;
    }
  }
  private reverseSort(criteria) {
     return function(a, b) {
      if (a[criteria] < b[criteria]) return 1;
      else if (a[criteria] > b[criteria]) return -1;
      return 0;
    }
  }

  private checkSortableInBook() {
    if (this.notes) {
      const sortable = this.notes.filter(
        note => this.enabledBook === note.book);

      if (sortable.length > 1) this.isSortableInBook = true;
      else this.isSortableInBook = false;
    }
  }

  getBookName(id: string) {
    const index = this.books.findIndex(
      book => id === book._id);

    if (index > -1) {
      const name = this.books[index].title;
      return name;
    }
    return "";
  }

  changeEnabledBook(book: string) {
    this.enabledBook = book;
    this.noteService.changeEnabledBook(book);
    this.toggleBookViewMode(false);
  }

  viewAllBooks() {
    this.isLoading = true;
    this.enabledBook = null;
    this.noteService.changeEnabledBookToAll();
    this.toggleBookViewMode(true);
  }

  viewAllNotes() {
    this.isLoading = true;
    this.enabledBook = null;
    this.noteService.changeEnabledBookToAll();
    this.toggleBookViewMode(false);
  }

  addBook(title: string) {
    if (title) {
      this.noteService.addBook(title);
    }
  }

  openEditBookDialog(isCopy: boolean) {
    const dialogRef = this.dialog.open(NoteBookDialogComponent, {
      width: '480px',
      data: { title: this.enabledBookName, isCopy: isCopy }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (isCopy)
          this.noteService.copyBook(this.enabledBook, result.title);
        else
          this.noteService.updateBookName(this.enabledBook, result.title);
      }
    });
  }

  openBookSettingsDialog() {
    const dialogRef = this.dialog.open(NoteListDialogComponent, {
      width: '50vw', maxHeight: '62vh',
      data: { books: this.books }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.books = result.books;
        for (let idx = 0; idx < result.deleted.length; idx++) {
          this.noteService.deleteBook(result.deleted[idx]);
          this.closeNoteByBookId(result.deleted[idx]);
        }
        if (result.deleted.length > 0) this.noteService.changeEnabledBookToAll();
      }
    });
  }

  openNoteSettingsDialog() {
    const dialogRef = this.dialog.open(NoteListDialogComponent, {
      width: '50vw', maxHeight: '62vh',
      data: { notes: this.notes }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.notes = result.notes;
        for (let idx = 0; idx < result.deleted.length; idx++) {
          this.closeNote(result.deleted[idx]);
          this.noteService.deleteNote(result.deleted[idx]);
        }
      }
    });
  }

  enableAddBook() {
    this.bookAdd = true;
  }

  disableAddBook() {
    this.bookAdd = false;
  }

  toggleEditBooks(isEdit: boolean) {
    this.booksEdit = isEdit;
  }

  sortBooks(event: CdkDragDrop<string[]>) {
    const ranks = this.books.map(book => { return book.rank; });
    let sortedBook: Book[] = [];

    if (event.previousIndex == event.currentIndex) {
      return;
    } else if (event.previousIndex < event.currentIndex) {
      moveItemInArray(this.books, event.previousIndex, event.currentIndex);
      for (let idx = event.previousIndex; idx <= event.currentIndex; idx++) {
        this.books[idx].rank = ranks[idx];
        sortedBook.push(this.books[idx]);
      }
    } else {
      moveItemInArray(this.books, event.previousIndex, event.currentIndex);
      for (let idx = event.previousIndex; idx >= event.currentIndex; idx--) {
        this.books[idx].rank = ranks[idx];
        sortedBook.push(this.books[idx]);
      }
    }
    this.noteService.updateBookRanks(sortedBook);
  }

  deleteBook(book: Book) {
    const dialogRef = this.dialog.open(NoteConfirmDialogComponent, {
      width: '240px', maxHeight: '240px',
      data: { isBook: true }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.noteService.deleteBook(book._id);
        this.closeNoteByBookId(book._id);
        this.enabledBook=null;
        this.noteService.changeEnabledBookToAll();
      }
    });
  }

  deleteBookById(book: string) {
    const dialogRef = this.dialog.open(NoteConfirmDialogComponent, {
      width: '340px', maxHeight: '240px',
      data: {
        title: "Delete Book and Notes",
        message: "Are you sure you want to delete this book and all of its notes?"
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.noteService.deleteBook(book);
        this.closeNoteByBookId(book);
        this.enabledBook=null;
        this.noteService.changeEnabledBookToAll();
      }
    });
  }

  addNote(title: string) {
    this.noteService.addNote(title, this.enabledBook);
  }

  openAddNoteDialog() {
    const dialogRef = this.dialog.open(NoteAddDialogComponent, {
      width: '480px',
      data: { title: "", book: "" }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let note;

        if (result.addBook) this.noteService.addBookAndNote(result.title, result.book);
        else this.noteService.addNote(result.title, result.book);
      }
    });
  }

  openEditNoteDialog(note: any) {
    const dialogRef = this.dialog.open(NoteAddDialogComponent, {
      width: '480px',
      data: {
        title: (note.title) ? note.title : "",
        book: (note.book) ? note.book: ""
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (result.isCopy)
          this.noteService.addNote(result.title, result.book);
        else
          this.noteService.updateNote(note._id, result.title, result.book);
      }
    });
  }

  openEditOpenedNoteDialog(openedNote: NoteTabData) {
    const note = {
      _id: openedNote.id,
      title: openedNote.title,
      book: openedNote.book
    };

    this.openEditNoteDialog(note);
  }

  toggleEditBook(isEdit: boolean) {
    this.bookEdit = isEdit;
  }

  private setNoteForm() {
    if (this.openedNotes.length > 0 && this.enabledIndex >= 0) {
      this.form.setValue({
        title: this.openedNotes[this.enabledIndex].title,
        content: this.openedNotes[this.enabledIndex].content,
      });
    }
  }

  changeEnabledNote(event: any) {
    /* Save current update in cache */
    this.openedNotes[this.enabledIndex].title = this.form.value.title;
    this.openedNotes[this.enabledIndex].content = this.form.value.content;

    this.enabledIndex = event.index;
    this.setNoteForm();
  }

  openNote(note: any) {
    const index = this.openedNotes.findIndex(foundNote =>
      note.id === foundNote.id ||
      note._id === foundNote.id);

    if (index < 0) {
      let noteId;
      if (note._id) noteId = note._id;
      else noteId = note.id;

      this.openedNotes.push({
        id: noteId,
        title: note.title,
        book: note.book,
        content: note.content
      });

      this.enabledIndex = this.openedNotes.length - 1;
      this.setNoteForm();
    } else {
      this.enabledIndex = index;
      this.setNoteForm();
    }

    this.closeSidenav();
  }

  closeNote(id: string) {
    const index = this.openedNotes.findIndex(foundNote => id === foundNote.id);
    if (index > -1) {
      this.closeNoteByIndex(index);
    }
  }

  closeNoteByIndex(index: number) {
    this.openedNotes.splice(index, 1);
    if (this.enabledIndex >= index && this.openedNotes.length > 0) {
      if (this.enabledIndex > 0) {
        this.enabledIndex--;
        this.setNoteForm();
      }
    }
  }

  closeNoteByBookId(id: string) {
    this.openedNotes = this.openedNotes.filter(
      note => note.book !== id);
    if (this.enabledIndex >= 0) {
      this.enabledIndex = 0;
      this.setNoteForm();
    }
  }

  saveNote() {
    if (this.form.invalid) {
      return;
    }

    /* Clean quill data */
    this.form.value.content = this.form.value.content.replace(
      /<p><br><\/p>/g, "<br />"
    );

    this.noteService.updateNoteContent(
      this.openedNotes[this.enabledIndex].id,
      this.form.value.title,
      this.form.value.content
    );
  }

  sortNotes(event: CdkDragDrop<string[]>) {
    const ranks = this.notes.map(book => { return book.rank; });
    let sortedNotes: Note[] = [];

    if (event.previousIndex == event.currentIndex) {
      return;
    } else if (event.previousIndex < event.currentIndex) {
      moveItemInArray(this.notes, event.previousIndex, event.currentIndex);
      for (let idx = event.previousIndex; idx <= event.currentIndex; idx++) {
        this.notes[idx].rank = ranks[idx];
        sortedNotes.push(this.notes[idx]);
      }
    } else {
      moveItemInArray(this.notes, event.previousIndex, event.currentIndex);
      for (let idx = event.previousIndex; idx >= event.currentIndex; idx--) {
        this.notes[idx].rank = ranks[idx];
        sortedNotes.push(this.notes[idx]);
      }
    }
    this.noteService.updateNoteRanks(sortedNotes);
  }

  deleteNote(id: string) {
    const dialogRef = this.dialog.open(NoteConfirmDialogComponent, {
      width: '240px', maxHeight: '240px',
      data: {
        title: "Delete note",
        message: "Are you sure you want to delete this note?"
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.closeNote(id);
        this.noteService.deleteNote(id);
      }
    });
  }

  private notifyOperationResult(operation: OperationMethod) {
    let message: string = null;

    switch (operation) {
      case OperationMethod.CREATE_BOOK:
        message = "BOOK created successfully";
        break;
      case OperationMethod.RENAME_BOOK:
        message = "BOOK renamed successfully";
        break;
      case OperationMethod.DELETE_BOOK:
        message = "BOOK deleted successfully";
        break;
      case OperationMethod.CREATE_NOTE:
        message = "NOTE created successfully";
        break;
      case OperationMethod.RENAME_NOTE:
        message = "NOTE renamed successfully";
        break;
      case OperationMethod.DELETE_NOTE:
        message = "NOTE deleted successfully";
        break;
      case OperationMethod.FINISH_NOTE:
        message = "NOTE finished successfully";
        break;
      case OperationMethod.ONGOING_NOTE:
        message = "NOTE restarted successfully";
        break;

      default:
        break;
    }

    if (message) this.openSnackBar(message);
  }

  private openSnackBar(message: string) {
    const mainClass = "snack-bar";
    const subClass = "snack-bar-" + this.isMobileView;

    this.snackBar.open(message, "Dismiss", {
      duration: 2400,
      panelClass: [ mainClass, subClass ],
    });
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.viewUpdated.unsubscribe();
    this.syncListener.unsubscribe();
    this.noteOpener.unsubscribe();
    this.noteListener.unsubscribe();
    this.bookListener.unsubscribe();
    this.authListener.unsubscribe();
  }
}

@Component({
  templateUrl: './note-add-dialog.html',
  styleUrls: [ './note-main.component.css' ]
})
export class NoteAddDialogComponent {
  form: FormGroup;
  books: Book[];
  enabledBook: string;
  isNew: boolean;
  isCopy: boolean;

  addBook = false;

  constructor(
    public dialogRef: MatDialogRef<NoteAddDialogComponent>,
    private noteService: NoteService,
    @Inject(MAT_DIALOG_DATA) public data: NoteData) {
      this.isNew = (data.title.length > 0) ? false : true;
      this.isCopy = false;
      this.books = this.noteService.getBooks();
      if (this.books.length == 0) this.addBook = true;
      else {
        this.enabledBook = this.noteService.getEnabledBook();
        if (!this.enabledBook) this.enabledBook = this.books[0]._id;
      }
      this.form = new FormGroup({
        title: new FormControl(data.title, {
          validators: [Validators.required]
        }),
        book: new FormControl((this.isNew) ? this.enabledBook : data.book, {
          validators: [Validators.required]
        })
      });
  }

  toggleNewBook() {
    this.form.setValue({
      title: this.form.value.title,
      book: ""
    });
    this.addBook = true;
  }

  submit() {
    if (this.form.invalid) {
      return;
    }
    const result: NoteData = {
      title: this.form.value.title,
      book: this.form.value.book,
      isCopy: this.isCopy,
      addBook: this.addBook
    }
    this.dialogRef.close(result);
  }

  closeDialog() {
    this.form.reset();
    this.dialogRef.close();
  }
}

@Component({
  templateUrl: './note-book-dialog.html',
  styleUrls: [ './note-main.component.css' ]
})
export class NoteBookDialogComponent {
  form: FormGroup;
  isNew: boolean;
  isCopy: boolean;

  constructor(
    public dialogRef: MatDialogRef<NoteBookDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BookData) {
      this.isNew = (data.title.length > 0) ? false : true;
      this.isCopy = data.isCopy;
      this.form = new FormGroup({
        title: new FormControl(data.title, {
          validators: [Validators.required]
        })
      });
  }

  submit() {
    if (this.form.invalid) {
      return;
    }
    const result: BookData = {
      title: this.form.value.title,
      isCopy: this.isCopy
    }
    this.dialogRef.close(result);
  }

  closeDialog() {
    this.form.reset();
    this.dialogRef.close();
  }
}

@Component({
  templateUrl: './note-list-dialog.html',
  styleUrls: [ './note-list.dialog.css' ]
})
export class NoteListDialogComponent {
  books: Book[] = [];
  notes: Note[] = [];

  sorted = false;
  deletedIds: string[] = [];

  constructor(
    private noteService: NoteService,
    private dialogRef: MatDialogRef<NoteListDialogComponent>,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) private data: ListData) {
      if (data.books) this.books = [...data.books];
      if (data.notes) this.notes = [...data.notes];
  }

  sortBooks(event: CdkDragDrop<string[]>) {
    const ranks = this.books.map(book => { return book.rank; });

    if (event.previousIndex == event.currentIndex) {
      return;
    } else if (event.previousIndex < event.currentIndex) {
      moveItemInArray(this.books, event.previousIndex, event.currentIndex);
      for (let idx = event.previousIndex; idx <= event.currentIndex; idx++) {
        this.books[idx].rank = ranks[idx];
      }
    } else {
      moveItemInArray(this.books, event.previousIndex, event.currentIndex);
      for (let idx = event.previousIndex; idx >= event.currentIndex; idx--) {
        this.books[idx].rank = ranks[idx];
      }
    }

    this.sorted = true;
  }

  deleteBook(book: Book) {
    const index = this.books.findIndex(
      foundBook => book._id === foundBook._id);

    if (index > -1) {
      this.books.splice(index, 1);
      this.deletedIds.push(book._id);
    }
  }

  sortNotes(event: CdkDragDrop<string[]>) {
    const ranks = this.notes.map(book => { return book.rank; });

    if (event.previousIndex == event.currentIndex) {
      return;
    } else if (event.previousIndex < event.currentIndex) {
      moveItemInArray(this.notes, event.previousIndex, event.currentIndex);
      for (let idx = event.previousIndex; idx <= event.currentIndex; idx++) {
        this.notes[idx].rank = ranks[idx];
      }
    } else {
      moveItemInArray(this.notes, event.previousIndex, event.currentIndex);
      for (let idx = event.previousIndex; idx >= event.currentIndex; idx--) {
        this.notes[idx].rank = ranks[idx];
      }
    }

    this.sorted = true;
  }

  deleteNote(id: string) {
    const index = this.notes.findIndex(note =>
      id === note._id ||
      id === note.id);

    if (index > -1) {
      this.notes.splice(index, 1);
      this.deletedIds.push(id);
    }
  }

  confirmedAction() {
    if (this.sorted) {
      if (this.notes.length > 0) this.noteService.updateNoteRanks(this.notes);
      if (this.books.length > 0) this.noteService.updateBookRanks(this.books);
    }

    const result = {
      notes: this.notes,
      books: this.books,
      deleted: this.deletedIds
    };
    this.dialogRef.close(result);
  }

  closeDialog() {
    this.dialogRef.close();
  }
}

@Component({
  templateUrl: './note-confirm-dialog.html',
  styleUrls: [ './note-main.component.css' ]
})
export class NoteConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<NoteConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData) {}
}