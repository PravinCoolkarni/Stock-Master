import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { StockData } from 'src/interfaces/StockData';
import { Company } from 'src/interfaces/Company';
import { CompanyOverview } from 'src/interfaces/CompanyOverview';
import { GeminiService } from 'src/services/gemini.service';

@Component({
  selector: 'app-stock-dashboard',
  templateUrl: './stock-dashboard.component.html',
  styleUrls: ['./stock-dashboard.component.scss']
})
export class StockDashboardComponent implements OnChanges {
  @Input() stockData: StockData[] = [];
  @Input() selectedCompany: Company | null = null;
  @Input() companyOverview: CompanyOverview | null = null;
  @Input() loading: boolean = false;

  recentPrices: StockData[] = [];
  priceChange: number = 0;
  priceChangePercent: number = 0;
  displayedColumns: string[] = ['date', 'open', 'high', 'low', 'close', 'volume'];
  prediction: any = null;

  constructor(private geminiService: GeminiService) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['stockData'] && this.stockData.length > 0) {
      this.recentPrices = this.stockData.slice(0, 5);
      this.calculatePriceChange();
      this.getPrediction();
    }
  }

  getPrediction(): void {
    this.geminiService.getFuturePricePrediction(this.stockData).subscribe(prediction => {
      this.prediction = prediction;
    });
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

  getCurrencyCode(): string {
    return this.companyOverview?.currency || 'USD';
  }

  getFormattedPrice(price: string | number): string {
    const numericPrice = typeof price === 'number' ? price : parseFloat(price);
    if (Number.isNaN(numericPrice)) {
      return String(price);
    }

    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: this.getCurrencyCode(),
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      }).format(numericPrice);
    } catch {
      return `${this.getCurrencyCode()} ${numericPrice.toFixed(2)}`;
    }
  }

  getFormattedPriceChange(): string {
    const absoluteChange = Math.abs(this.priceChange);
    return this.getFormattedPrice(absoluteChange);
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
