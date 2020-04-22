import { NgModule } from "@angular/core";
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSidenavModule } from '@angular/material/sidenav';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  exports: [
    MatInputModule,
    MatCardModule,
    MatButtonModule,
    MatCheckboxModule,
    MatToolbarModule,
    MatExpansionModule,
    MatGridListModule,
    MatPaginatorModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    DragDropModule,
    FlexLayoutModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatSidenavModule
  ]
})
export class AngularMaterialModule {}