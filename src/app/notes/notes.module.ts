import { NgModule } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

import { NotesCreateComponent } from './notes-create/notes-create.component';
import { NotesListComponent } from './notes-list/notes-list.component';
import { AngularMaterialModule } from "../angular-material.module";

@NgModule({
  declarations: [
    NotesCreateComponent,
    NotesListComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AngularMaterialModule,
    RouterModule
  ]
})
export class NotesModule {}