import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { QuillModule } from "ngx-quill";

import { NoteMainComponent } from "./note-main/note-main.component";
import { NoteAddDialogComponent } from "./note-main/note-main.component";
import { NoteBookDialogComponent } from "./note-main/note-main.component";
import { NoteListDialogComponent } from "./note-main/note-main.component";
import { NoteConfirmDialogComponent } from "./note-main/note-main.component";
import { NoteHeaderComponent } from "./note-header/note-header.component";
import { NoteRoutingModule } from './note-routing.module';
import { AngularMaterialModule } from "../angular-material.module";

@NgModule({
  declarations: [
    NoteMainComponent,
    NoteAddDialogComponent,
    NoteBookDialogComponent,
    NoteListDialogComponent,
    NoteConfirmDialogComponent,
    NoteHeaderComponent
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    NoteRoutingModule,
    QuillModule.forRoot()
  ]
})
export class NoteModule {}