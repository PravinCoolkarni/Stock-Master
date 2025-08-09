import { NgModule } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';

export const MATERIAL_MODULES = [
  MatToolbarModule,
  MatIconModule,
  MatCardModule,
  MatListModule,
  MatAutocompleteModule,
  MatFormFieldModule,
  MatInputModule,
  MatTableModule,
  MatButtonModule,
  MatProgressSpinnerModule,
  MatSidenavModule
];
@NgModule({
  exports: [
    ...MATERIAL_MODULES
  ]
})
export class MaterialModule {}
