import { Component } from "@angular/core";

@Component({
  selector: 'app-notes-list',
  templateUrl: './notes-list.component.html',
  styleUrls: ['./notes-list.component.css'],
})
export class NotesListComponent {
  posts = [
    {title: 'First Note', content: 'This is the first note'},
    {title: 'Second Note', content: 'This is the second note'},
    {title: 'Third Note', content: 'This is the third note'},
  ];
}
