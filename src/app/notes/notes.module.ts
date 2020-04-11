import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
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
    FormsModule,
    AngularMaterialModule,
    RouterModule
  ]
})
export class NotesModule {}