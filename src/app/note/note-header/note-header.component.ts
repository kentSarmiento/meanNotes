import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { MatDialog } from '@angular/material/dialog';

import { NoteConfig } from "../note.config";
import { NoteService } from "../note.service";
import { AuthService } from "../../auth/auth.service";
import { NoteSidebarService } from "../note-main/note-sidebar.service";
import { NoteAddDialogComponent } from "../note-main/note-main.component";
import { Book } from "../note.model";

import { ResponsiveService } from "../../app-responsive.service";

const NOTE_ROUTE = NoteConfig.rootRoute;

@Component({
  selector: 'app-note-header',
  templateUrl: './note-header.component.html',
  styleUrls: [
    '../../header/header.component.css',
    'note-header.component.css'
  ],
})
export class NoteHeaderComponent implements OnInit, OnDestroy {
  isUserAuthenticated = false;
  private authListener: Subscription;

  isMobileView: boolean;
  private viewUpdated: Subscription;

  isEmptyBook: boolean = true;
  private bookListener : Subscription;

  readonly noteRoute = NOTE_ROUTE;

  constructor(
    private authService: AuthService,
    private noteService: NoteService,
    private sidebarService: NoteSidebarService,
    private dialog: MatDialog,
    private responsiveService: ResponsiveService) {}

  ngOnInit() {
    this.isUserAuthenticated = this.authService.getIsAuthenticated();
    this.authListener = this.authService
      .getAuthStatusListener()
      .subscribe( isAuthenticated => {
        this.isUserAuthenticated = isAuthenticated;
      });

    this.viewUpdated = this.responsiveService
      .getViewUpdatedListener()
      .subscribe( isMobile => {
        this.isMobileView = isMobile;
      })
    this.isMobileView = this.responsiveService.checkWidth();

    this.bookListener = this.noteService
      .getBookUpdatedListener()
      .subscribe( (updated: { books: Book[], enabled: string }) => {
        if (updated.books.length > 0) this.isEmptyBook = false;
        else this.isEmptyBook = true;
      });

    const book = this.noteService.getBooks();
    if (book.length > 0) this.isEmptyBook = false;
    else this.isEmptyBook = true;
  }

  openAddNoteDialog() {
    const dialogRef = this.dialog.open(NoteAddDialogComponent, {
      width: '480px',
      data: { title: "", book: "" }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.addNote(result.title, result.book);
      }
    });
  }

  addNote(title: string, book: string) {
    this.noteService.addNote(title, book);
    setTimeout(() => {
      const element = document.getElementById('content-accordion');
      element.scrollIntoView();
    }, 100);
  }

  toggleMenu() {
    this.sidebarService.toggleSidebar();
  }

  logout() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.bookListener.unsubscribe();
    this.viewUpdated.unsubscribe();
    this.authListener.unsubscribe();
  }
}
