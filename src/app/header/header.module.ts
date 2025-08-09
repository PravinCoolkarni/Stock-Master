import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { HeaderRoutingModule } from './header-routing.module';
import { MaterialModule } from 'src/material/material.module';



@NgModule({
  declarations: [
    HeaderComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,
    HeaderRoutingModule
  ],
  exports: [
    HeaderComponent
  ]
})
export class HeaderModule { }
