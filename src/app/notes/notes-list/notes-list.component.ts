import { Component , OnInit, OnDestroy } from "@angular/core";
import { Subscription } from 'rxjs';

import { Note } from "../notes.model"
import { NoteCategory } from "../note-category.model"

import { NotesService } from '../notes.service';
import { NoteCategoryService } from '../note-category.service';

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.css'],
})
export class NotesListComponent implements OnInit {
  private notesSub : Subscription;
  notes: Note[] = [];

  private categorySub : Subscription;
  categories: NoteCategory[] = [];

  isLoading = false;

  constructor (public notesService: NotesService,
               public noteCategoryService: NoteCategoryService) {}

  ngOnInit() {
    this.isLoading = true;
    this.noteCategoryService.getCategories();
    this.notesService.getNotes();

    this.categorySub = this.noteCategoryService.getCategoryUpdatedListener().
      subscribe( (categories: NoteCategory[]) => {
        this.categories = categories;
      });
    this.notesSub = this.notesService.getNotesUpdatedListener().
      subscribe( (notes: Note[]) => {
        this.isLoading = false;
        this.notes = notes;
      });
  }

  onDelete(id: string) {
    this.notesService.deleteNote(id);
  }

  ngOnDestroy() {
    this.notesSub.unsubscribe();
    this.categorySub.unsubscribe();
  }
}
