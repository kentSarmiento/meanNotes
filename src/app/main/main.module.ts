import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

import { MainViewComponent } from './main-view.component';
import { MainRoutingModule } from './main-routing.module';
import { AngularMaterialModule } from "../angular-material.module";

@NgModule({
  declarations: [
    MainViewComponent,
  ],
  imports: [
    CommonModule,
    AngularMaterialModule,
    RouterModule,
    MainRoutingModule
  ]
})
export class MainModule {}