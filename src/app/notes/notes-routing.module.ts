import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { AuthGuard } from "../auth/auth-guard";

import { NotesListComponent } from "./notes-list/notes-list.component";
import { NotesCreateComponent } from "./notes-create/notes-create.component";
import { NotesViewComponent } from "./notes-view/notes-view.component";

const routes: Routes = [
  { path: '', component: NotesListComponent },
  { path: 'personal', component: NotesListComponent, canActivate: [AuthGuard] },
  { path: 'create', component: NotesCreateComponent, canActivate: [AuthGuard] },
  { path: 'edit/:id', component: NotesCreateComponent, canActivate: [AuthGuard] },
  { path: 'view/:id', component: NotesViewComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NotesRoutingModule {}