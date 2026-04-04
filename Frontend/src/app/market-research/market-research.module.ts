import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarketResearchComponent } from './market-research.component';
import { MaterialModule } from '../../material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MarketResearchRoutingModule } from './market-research-routing.module';
import { LoaderModule } from '../common/loader/loader.module';
import { ContentPopupComponent } from './content-popup/content-popup.component';


@NgModule({
  declarations: [MarketResearchComponent, ContentPopupComponent],
  imports: [
    CommonModule,
    MarketResearchRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    LoaderModule
  ],
  exports: [MarketResearchComponent]
})
export class MarketResearchModule { }
