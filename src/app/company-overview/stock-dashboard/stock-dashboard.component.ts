import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { StockData } from 'src/model/StockData';
import { Company } from 'src/model/Company';

@Component({
  selector: 'app-stock-dashboard',
  templateUrl: './stock-dashboard.component.html',
  styleUrls: ['./stock-dashboard.component.scss']
})
export class StockDashboardComponent implements OnChanges {
  @Input() stockData: StockData[] = [];
  @Input() selectedCompany: Company | null = null;
  @Input() loading: boolean = false;

  recentPrices: StockData[] = [];
  priceChange: number = 0;
  priceChangePercent: number = 0;
  displayedColumns: string[] = ['date', 'open', 'high', 'low', 'close', 'volume'];

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stockData'] && this.stockData.length > 0) {
      this.recentPrices = this.stockData.slice(0, 5);
      this.calculatePriceChange();
    }
  }

  calculatePriceChange(): void {
    if (this.stockData.length >= 2) {
      const currentPrice = parseFloat(this.stockData[0].close);
      const previousPrice = parseFloat(this.stockData[1].close);
      this.priceChange = currentPrice - previousPrice;
      this.priceChangePercent = (this.priceChange / previousPrice) * 100;
    }
  }

  getCurrentPrice(): number {
    return this.stockData.length > 0 ? parseFloat(this.stockData[0].close) : 0;
  }

  getFormattedPrice(price: string): string {
    return parseFloat(price).toFixed(2);
  }

  getFormattedVolume(volume: string): string {
    const vol = parseInt(volume);
    if (vol >= 1000000) {
      return (vol / 1000000).toFixed(1) + 'M';
    } else if (vol >= 1000) {
      return (vol / 1000).toFixed(1) + 'K';
    }
    return vol.toString();
  }
}
