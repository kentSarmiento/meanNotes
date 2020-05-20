import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { AuthGuard } from "../auth/auth-guard";

import { NoteMainComponent } from "./note-main/note-main.component";

const routes: Routes = [
  { path: '', redirectTo: 'all', pathMatch: 'full' },
  { path: ':id', component: NoteMainComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NoteRoutingModule {}