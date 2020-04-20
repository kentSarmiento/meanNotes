import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { NotesListComponent } from "./notes/notes-list/notes-list.component";
import { NotesCreateComponent } from "./notes/notes-create/notes-create.component";
import { NotesViewComponent } from "./notes/notes-view/notes-view.component";
import { SignupComponent } from "./auth/signup/signup.component";
import { LoginComponent } from "./auth/login/login.component";
import { AuthGuard } from "./auth/auth-guard";

const routes: Routes = [
  { path: '', component: NotesListComponent },
  { path: 'personal', component: NotesListComponent, canActivate: [AuthGuard] },
  { path: 'create', component: NotesCreateComponent, canActivate: [AuthGuard] },
  { path: 'edit/:id', component: NotesCreateComponent, canActivate: [AuthGuard] },
  { path: 'view/:id', component: NotesViewComponent },
  { path: "auth", loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})
export class AppRoutingModule {

}