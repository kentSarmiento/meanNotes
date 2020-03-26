import { Component , OnInit } from "@angular/core";
import { Subscription } from 'rxjs';

import { Note } from "../notes.model"
import { NotesService } from '../notes.service';

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.css'],
})
export class NotesListComponent implements OnInit {
  notes: Note [] = [];
  private notesSub : Subscription;

  constructor (public notesService: NotesService){}

  ngOnInit() {
    this.notes = this.notesService.getNotes();
    this.notesSub = this.notesService.getNotesUpdatedListener().
      subscribe( (notes: Note[]) => {
        this.notes = notes;
      });
  }

  ngOnDestroy() {
    this.notesSub.unsubscribe();
  }
}
