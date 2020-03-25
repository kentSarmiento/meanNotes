import { Component , Input } from "@angular/core";

import { Note } from "../notes.model"

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.css'],
})
export class NotesListComponent {
  @Input() notes: Note [] = [];
}
