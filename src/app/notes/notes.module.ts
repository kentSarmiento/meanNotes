import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { QuillModule } from 'ngx-quill';

import { NotesCreateComponent } from './notes-create/notes-create.component';
import { NotesListComponent } from './notes-list/notes-list.component';
import { NotesListCategoryDialog } from './notes-list/notes-list.component';
import { NotesListDeleteDialog } from './notes-list/notes-list.component';
import { NotesViewComponent } from './notes-view/notes-view.component';
import { NotesRoutingModule } from './notes-routing.module';
import { AngularMaterialModule } from "../angular-material.module";

@NgModule({
  declarations: [
    NotesCreateComponent,
    NotesListComponent,
    NotesListCategoryDialog,
    NotesListDeleteDialog,
    NotesViewComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    RouterModule,
    NotesRoutingModule,
    QuillModule.forRoot({
      modules: {
        toolbar: [
          [
            { 'header': [1, 2, 3, false] },
            'bold', 'italic', 'underline'
          ],
          [
            { 'align': [] },
            { 'list': 'ordered'}, { 'list': 'bullet' },
            'code-block'
          ],
        ]
      }})
  ]
})
export class NotesModule {}