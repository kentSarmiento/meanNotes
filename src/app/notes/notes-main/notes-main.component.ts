import { Component, Subscription } from '@angular/core';

import { NotesConfig } from "../notes.config";
import { NotesService } from "../notes.service";
import { Note } from "../notes.model";
import { AuthService } from "../../auth/auth.service";

const NOTES_ROUTE = NotesConfig.rootRoute;

@Component({
  selector: 'app-notes-main',
  templateUrl: './notes-main.component.html',
  styleUrls: [
    '../../header/header.component.css',
    './notes-main.component.css'
  ]
})
export class NotesMainComponent {
  private bookListener : Subscription;
  books : Book[] = [];

  private noteListener : Subscription;
  notes : Note[] = [];

  private authListener : Subscription;
  isUserAuthenticated = false;
  userId: string;

  private syncListener : Subscription;
  isSyncing = false;

  private viewUpdated: Subscription;
  isMobileView: boolean;

  isLoading = false;
  isFirstLoad = true;

  isMobileView: boolean;

  @ViewChild('sidenav') sidenav: MatSidenav;

  constructor(
    private notesService: NotesService,
    private authService: AuthService,
    private sidebarService: NoteSidebarService,
    private responsiveService: ResponsiveService,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private snackBar: MatSnackBar) {}

  ngOnInit() {

  }

  closeSidenav() {}
  sortLists(event: any) {}
}