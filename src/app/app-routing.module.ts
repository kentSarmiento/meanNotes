import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { AuthGuard } from "./auth/auth-guard";
import { MainViewComponent } from "./main/main-view.component";

const routes: Routes = [
  { path: '', loadChildren: () => import('./main/main.module').then(m => m.MainModule) },
  { path: "notes", loadChildren: () => import('./notes/notes.module').then(m => m.NotesModule) },
  { path: "todo", loadChildren: () => import('./todo/todo.module').then(m => m.TodoModule) },
  { path: "auth", loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})
export class AppRoutingModule {}