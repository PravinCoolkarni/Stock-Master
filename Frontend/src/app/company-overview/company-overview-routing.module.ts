import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompanyOverviewComponent } from './company-overview.component';

const routes: Routes = [
  {
    path: '',
    component: CompanyOverviewComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CompanyOverviewRoutingModule { }
