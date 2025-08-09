import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';


import { CompanyOverviewRoutingModule } from './company-overview-routing.module';
import { CompanyOverviewComponent } from './company-overview.component';
import { StockDashboardComponent } from './stock-dashboard/stock-dashboard.component';
import { HeaderModule } from "../header/header.module";
import { MaterialModule } from '../../material/material.module';


@NgModule({
  declarations: [
    CompanyOverviewComponent,
    StockDashboardComponent
  ],
  imports: [
    CommonModule,
    CompanyOverviewRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    HeaderModule,
    MaterialModule
]
})
export class CompanyOverviewModule { }
