import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { NotesListComponent } from "./notes/notes-list/notes-list.component";
import { NotesCreateComponent } from "./notes/notes-create/notes-create.component";
import { SignupComponent } from "./auth/signup/signup.component";

const routes: Routes = [
  { path: '', component: NotesListComponent },
  { path: 'create', component: NotesCreateComponent },
  { path: 'edit/:id', component: NotesCreateComponent },
  { path: 'signup', component: SignupComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {

}