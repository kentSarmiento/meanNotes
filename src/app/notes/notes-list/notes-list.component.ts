import { Component , OnInit, OnDestroy } from "@angular/core";
import { PageEvent } from '@angular/material/paginator';
import { Subscription } from 'rxjs';

import { Note } from "../notes.model"
import { NotesService } from '../notes.service';

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

  constructor (public notesService: NotesService){}

  ngOnInit() {
    this.isLoading = true;
    this.notesService.getNotes(this.page, this.limit);
    this.notesSub = this.notesService
      .getNotesUpdatedListener()
      .subscribe( (notebook: { notes: Note[], total: number }) => {
        this.isLoading = false;
        this.total = notebook.total;
        this.notes = notebook.notes;
      });
  }

  onChangePage(pageInfo: PageEvent) {
    this.isLoading = true;
    this.page = pageInfo.pageIndex + 1;
    this.limit = pageInfo.pageSize;
    this.notesService.getNotes(this.page, this.limit);
  }

  onDelete(id: string) {
    this.isLoading = true;
    this.notesService.deleteNote(id).subscribe(() => {
      this.notesService.getNotes(this.page, this.limit);
    });
  }

  ngOnDestroy() {
    this.notesSub.unsubscribe();
  }
}
