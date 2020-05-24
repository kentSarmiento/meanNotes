import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { HttpClient } from "@angular/common/http";
import { Router } from '@angular/router';

import { environment } from "../../environments/environment";
import { NoteConfig } from "./note.config";
import { Note, Book } from './note.model';

const BOOKS_URL = environment.serverUrl + "/v2/notebook/";
const NOTES_URL = environment.serverUrl + "/v2/notes/"
const NOTE_ROUTE = NoteConfig.rootRoute;

export enum OperationMethod {
  NONE = -1,
  POST = 0,
  GET,
  PUT,
  DELETE,

  CREATE_BOOK,
  RENAME_BOOK,
  DELETE_BOOK,

  CREATE_NOTE,
  RENAME_NOTE,
  FINISH_NOTE,
  ONGOING_NOTE,
  DELETE_NOTE
};

@Injectable({providedIn: "root"})
export class NoteService {
  private bookUpdated = new Subject<{ books: Book[], enabled: string }>();
  private cachedBooks: Book[] = [];
  private enabledBook: string;

  private noteUpdated = new Subject<{ notes: Note[] }>();
  private cachedNotes: Note[] = [];
  private noteOpen = new Subject<{ note: Note }>();

  private syncUpdated = new Subject<{ isOngoing: boolean, operation: OperationMethod }>();

  constructor(
    private http: HttpClient,
    private router: Router) {}

  getNoteUpdatedListener() {
    return this.noteUpdated.asObservable();
  }

  getNoteOpenerListener() {
    return this.noteOpen.asObservable();
  }

  getBookUpdatedListener() {
    return this.bookUpdated.asObservable();
  }

  getSyncUpdatedListener() {
    return this.syncUpdated.asObservable();
  }

  private notifyUpdatedNotes() {
    this.noteUpdated.next({ notes: this.cachedNotes });
  }

  private openNote(note: Note) {
    this.noteOpen.next({ note });
  }

  private notifyUpdatedBooks() {
    this.bookUpdated.next({ books: this.cachedBooks, enabled: this.enabledBook });
  }

  private notifyOngoingSync() {
    this.syncUpdated.next({ isOngoing: true, operation: OperationMethod.NONE });
  }

  private notifyFinishedSync(op: OperationMethod) {
    this.syncUpdated.next({ isOngoing: false, operation: op });
  }

  retrieveDataFromServer(book: string) {
    this.notifyOngoingSync();
    this.http
      .get<any>(BOOKS_URL)
      .subscribe(response => {

        this.enabledBook = book;
        this.cachedBooks = response.books;
        this.notifyUpdatedBooks();
        this.http
          .get<any>(NOTES_URL)
          .subscribe(response => {
            this.cachedNotes = response.notes;
            this.notifyUpdatedNotes();

            this.notifyFinishedSync(OperationMethod.GET);
          });
      });
  }

  changeEnabledBookToAll() {
    this.router.navigate([NOTE_ROUTE]);

    this.enabledBook = null;
    this.notifyUpdatedBooks();
    this.notifyUpdatedNotes();
    this.notifyFinishedSync(OperationMethod.NONE);
  }

  changeEnabledBook(book: string) {
    this.router.navigate([NOTE_ROUTE, book]);

    this.http.get<any>(BOOKS_URL + book)
      .subscribe(response => {

        const updated = this.updateCachedBook(response);
        if (updated) {
          this.enabledBook = response._id;
          this.notifyUpdatedBooks();
          this.http.get<any>(BOOKS_URL + book + "/notes")
            .subscribe(response => {

              this.updateCachedNotes(response.notes);
              this.notifyUpdatedNotes();
              this.notifyFinishedSync(OperationMethod.GET);
            });
        } else {
          this.enabledBook = response._id;
          this.notifyUpdatedBooks();
          this.notifyUpdatedNotes();
          this.notifyFinishedSync(OperationMethod.GET);
        }
      });
  }

  private updateCachedBook(book: Book) {
    const index = this.cachedBooks.findIndex(
      cachedBook => book._id === cachedBook._id);
    let updated = false;

    if (index > -1) {
      if (this.cachedBooks[index].version !== book.version) updated = true;
      this.cachedBooks.splice(index, 1, book);
    } else {
      this.cachedBooks.push(book);
    }

    return updated;
  }

  private updateCachedNote(note) {
    const index = this.cachedNotes.findIndex(cachedNote =>
      note._id === cachedNote._id ||
      note.id === cachedNote.id);

    if (index > -1) {
      this.cachedNotes.splice(index, 1, note);
    } else {
      this.cachedNotes.push(note);
    }
  }

  private updateCachedNotes(notes: Note[]) {
    for (let idx=0; idx<notes.length; idx++) {
      this.updateCachedNote(notes[idx]);
    }
  }

  getBooks() {
    return this.cachedBooks;
  }

  getEnabledBook() {
    return this.enabledBook;
  }

  addBookAndNote(note: string, book: string) {
    const addBook = {
      title: book
    };

    this.notifyOngoingSync();
    this.http.post<any>(BOOKS_URL, addBook)
      .subscribe(response => {
        this.updateCachedBook(response);
        this.enabledBook = response._id;
        this.notifyUpdatedBooks();

        this.router.navigate([NOTE_ROUTE, response._id]);

        this.addNote(note, response._id);
      });
  }

  addBook(title: string) {
    const book = {
      title: title
    };

    this.notifyOngoingSync();
    this.http.post<any>(BOOKS_URL, book)
      .subscribe(response => {
        this.updateCachedBook(response);
        this.enabledBook = response._id;
        this.notifyUpdatedBooks();
        this.noteUpdated.next({ notes: [] });

        this.router.navigate([NOTE_ROUTE, response._id]);
        this.notifyFinishedSync(OperationMethod.CREATE_BOOK);
      });
  }

  copyNotes(from: string, to: string) {
    const copiedNotes = this.cachedNotes.filter(
      note => note.book===from);

    if (copiedNotes.length > 0) {
      let newNotes = [];
      for (let idx=0; idx < copiedNotes.length; idx++) {
        const note = {
          id: this.generateNoteId(),
          title: copiedNotes[idx].title,
          book: to,
          rank: this.generateNoteRank()
        };
        newNotes.push(note)
      }

      const noteBook = {
        total: newNotes.length,
        notes: newNotes
      };
      this.http.post<any>(NOTES_URL + "batchCreate", noteBook)
        .subscribe(response => {
          /* Update book version */
          this.http.put<any>(BOOKS_URL + to, null)
            .subscribe(response => {});
        });
    }
  }

  copyBook(from: string, title: string) {
    const book = {
      title: title
    };

    this.notifyOngoingSync();
    this.http.post<any>(BOOKS_URL, book)
      .subscribe(response => {
        this.updateCachedBook(response);
        this.notifyUpdatedBooks();

        this.copyNotes(from, response._id);
        this.notifyFinishedSync(OperationMethod.CREATE_BOOK);
      });
  }

  updateBookName(id: string, title: string) {
    const index = this.cachedBooks.findIndex(
      cachedBook => id === cachedBook._id);

    if (index > -1) {
      if (this.cachedBooks[index].title !== title) {
        this.cachedBooks[index].title = title;

        this.notifyOngoingSync();
        this.http.put<any>(BOOKS_URL + id, this.cachedBooks[index])
          .subscribe(response => {
            this.updateCachedBook(response);
            this.notifyFinishedSync(OperationMethod.RENAME_BOOK);
          });
      }
    }
  }

  updateBookLock(id: string, locked: boolean) {
    const index = this.cachedBooks.findIndex(
      cachedBook => id === cachedBook._id);

    if (index > -1) {
      this.cachedBooks[index].locked = locked;

      this.notifyOngoingSync();
      this.http.put<any>(BOOKS_URL + id, this.cachedBooks[index])
        .subscribe(response => {
          this.updateCachedBook(response);
          this.notifyFinishedSync(OperationMethod.NONE);
        });
    }
  }

  updateBookRanks(sortedBook: Book[]) {
    const updateBook = {
      total: sortedBook.length,
      books: sortedBook
    };

    this.http.post<any>(BOOKS_URL + "sort", updateBook)
      .subscribe(response => {});
  }

  deleteBook(id: string) {
    const index = this.cachedBooks.findIndex(
      cachedBook => id === cachedBook._id);

    if (index > -1) {
      this.cachedBooks.splice(index, 1);

      this.http.delete<any>(BOOKS_URL + id)
        .subscribe(response => {});
      this.deleteNotesByBook(id);

      /* No need to wait for backend processing */
      this.notifyFinishedSync(OperationMethod.DELETE_BOOK);
    }
  }

  private generateNoteId() {
    return Math.random().toString(36).substr(2, 9); // temporary id
  }

  private generateNoteRank() {
    let rank = 1;
    for (let idx=0; idx<this.cachedNotes.length; idx++) {
      rank = (this.cachedNotes[idx].rank > rank) ? this.cachedNotes[idx].rank : rank;
      rank++;
    }
    return rank;
  }

  addNote(title: string, book: string) {
    const noteId = this.generateNoteId();
    const noteRank = this.generateNoteRank();
    const note = {
      id: noteId,
      title: title,
      content: "",
      book: book,
      rank: noteRank
    };

    this.updateCachedNote(note);
    this.notifyUpdatedNotes();

    /* Background sync with backend server */
    this.notifyOngoingSync();
    this.http.post<any>(NOTES_URL, note)
      .subscribe(response => {

        this.updateCachedNote(response);
        this.notifyUpdatedNotes();
        this.openNote(response);
        this.notifyFinishedSync(OperationMethod.CREATE_NOTE);

        /* Update book version */
        this.http.put<any>(BOOKS_URL + book, null)
          .subscribe(response => {});
      });
  }

  updateNote(id: string, title: string, book: string) {
    const index = this.cachedNotes.findIndex(cachedNote =>
      id === cachedNote._id ||
      id === cachedNote.id);

    if (index > -1) {
      const note = this.cachedNotes[index];
      if (note.title !== title || note.book !== book) {
        note.title = title;
        note.book = book;

        /* Background sync with backend server */
        this.notifyOngoingSync();
        this.http.put<any>(NOTES_URL + note._id, note)
          .subscribe(response => {

            this.updateCachedNote(response);
            this.notifyUpdatedNotes();
            this.notifyFinishedSync(OperationMethod.RENAME_NOTE);

            /* Update book version */
            this.http.put<any>(BOOKS_URL + note.book, null)
              .subscribe(response => {});
          });
      }
    }
  }

  updateNoteContent(id: string, title: string, content: string) {
    const index = this.cachedNotes.findIndex(cachedNote =>
      id === cachedNote._id ||
      id === cachedNote.id);

    if (index > -1) {
      const note = this.cachedNotes[index];
      if (note.title !== title || note.content !== content) {
        note.title = title;
        note.content = content;

        /* Background sync with backend server */
        this.notifyOngoingSync();
        this.http.put<any>(NOTES_URL + note._id, note)
          .subscribe(response => {

            this.updateCachedNote(response);
            this.notifyUpdatedNotes();
            this.notifyFinishedSync(OperationMethod.RENAME_NOTE);

            /* Update book version */
            this.http.put<any>(BOOKS_URL + note.book, null)
              .subscribe(response => {});
          });
      }
    }
  }

  updateNoteRanks(sortedNotes: Note[]) {
    if (sortedNotes.length > 0) {
      const updateBook = {
        total: sortedNotes.length,
        notes: sortedNotes
      };

      this.http.post<any>(NOTES_URL + "sort", updateBook)
        .subscribe(response => {});
    }
  }

  deleteNote(id: string) {
    const index = this.cachedNotes.findIndex(cachedNote =>
      id === cachedNote._id ||
      id === cachedNote.id);

    if (index > -1) {
      const noteId =  this.cachedNotes[index]._id;
      const bookId =  this.cachedNotes[index].book;

      this.cachedNotes.splice(index, 1);
      this.notifyUpdatedNotes();

      this.http.delete<any>(NOTES_URL + noteId)
        .subscribe(response => {
          /* Update book version */
          this.http.put<any>(BOOKS_URL + bookId, null)
            .subscribe(response => {});
        });

      this.notifyFinishedSync(OperationMethod.DELETE_NOTE);
    }
  }

  deleteNotesByBook(book: string) {
    const deletedNotes = this.cachedNotes.filter(
      note => note.book===book);

    this.cachedNotes = this.cachedNotes.filter(
      note => note.book!==book);

    if (deletedNotes.length > 0)
      this.http.post<any>(BOOKS_URL + book + "/deleteNotes", null)
        .subscribe(response => {});
  }

}