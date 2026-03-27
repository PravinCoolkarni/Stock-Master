import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MarketResearchComponent } from './market-research.component';

const routes: Routes = [
  {
    path: '',
    component: MarketResearchComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MarketResearchRoutingModule { }