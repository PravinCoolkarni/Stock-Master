import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  Observable,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { Company } from 'src/interfaces/Company';
import { CompanyOverview } from 'src/interfaces/CompanyOverview';
import { StockData } from 'src/interfaces/StockData';
import { DataExtractorService } from 'src/services/dataExtractor.service';

interface OverviewField {
  label: string;
  value: string;
  kind?: 'currency' | 'number' | 'percent' | 'text';
}

@Component({
  selector: 'app-company-overview',
  templateUrl: './company-overview.component.html',
  styleUrls: ['./company-overview.component.scss'],
})
export class CompanyOverviewComponent implements OnInit {
  constructor(private dataExtractorService: DataExtractorService) {}

  companyForm = new FormGroup({
    companyName: new FormControl(''),
  });

  options: Company[] = [];
  filteredOptions: Observable<Company[]> = new Observable<Company[]>();
  selectedCompany: Company | null = null;
  companyOverview: CompanyOverview | null = null;
  stockData: StockData[] = [];
  loading = false;

  ngOnInit() {
    this.filteredOptions = this.companyForm.controls.companyName.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((value) => {
        if (typeof value === 'string' && value.length > 2) {
          return this.dataExtractorService.getCompany(value).pipe(
            map((response) => {
              this.options = this.convertToCompanyArray(response);
              return this.options;
            }),
            catchError(() => {
              console.error('Error fetching company data');
              return of([]);
            })
          );
        }

        return of(this.options.slice());
      })
    );
  }

  displayFn(company: Company): string {
    return company?.name || '';
  }

  convertToCompanyArray(data: any): Company[] {
    return (data?.tickers || []).map((item: any) => ({
      symbol: item.symbol,
      name: item.name,
      type: '',
      region: '',
      marketOpen: '',
      marketClose: '',
      timezone: '',
      currency: '',
      matchScore: '',
    }));
  }

  onCompanySelected(company: Company) {
    this.selectedCompany = company;
    this.loadCompanyData(company.symbol);
  }

  loadCompanyData(symbol: string) {
    this.loading = true;

    this.dataExtractorService.getCompanyOverview(symbol).subscribe({
      next: (overview) => {
        this.companyOverview = overview;
      },
      error: (error) => {
        console.error('Error fetching company overview:', error);
        this.companyOverview = null;
      },
    });

    this.dataExtractorService.getStockData(symbol, 'compact').subscribe({
      next: (data) => {
        this.stockData = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching stock data:', error);
        this.stockData = [];
        this.loading = false;
      },
    });
  }

  get identityFields(): OverviewField[] {
    if (!this.companyOverview) {
      return [];
    }

    return [
      { label: 'Sector', value: this.companyOverview.sectorDisp },
      { label: 'Industry', value: this.companyOverview.industryDisp },
      { label: 'Website', value: this.companyOverview.website },
      { label: 'Location', value: this.getLocation() },
    ];
  }

  get marketFields(): OverviewField[] {
    if (!this.companyOverview) {
      return [];
    }

    return [
      { label: 'Market Cap', value: this.companyOverview.marketCap, kind: 'currency' },
      { label: 'Volume', value: this.companyOverview.volume, kind: 'number' },
      { label: 'Open', value: this.companyOverview.open, kind: 'number' },
      { label: 'Previous Close', value: this.companyOverview.previousClose, kind: 'number' },
      { label: 'Day Range', value: this.getDayRange() },
      { label: '52 Week Range', value: this.companyOverview.fiftyTwoWeekRange },
      { label: '52W High', value: this.companyOverview.fiftyTwoWeekHigh, kind: 'number' },
      { label: '52W Low', value: this.companyOverview.fiftyTwoWeekLow, kind: 'number' },
    ];
  }

  get featuredMarketFields(): OverviewField[] {
    return this.marketFields.slice(0, 4);
  }

  get secondaryMarketFields(): OverviewField[] {
    return this.marketFields.slice(4);
  }

  get businessFields(): OverviewField[] {
    if (!this.companyOverview) {
      return [];
    }

    return [
      { label: 'Total Revenue', value: this.companyOverview.totalRevenue, kind: 'currency' },
      { label: 'EBITDA', value: this.companyOverview.ebitda, kind: 'currency' },
      { label: 'Profit Margins', value: this.companyOverview.profitMargins, kind: 'percent' },
      { label: 'Gross Margins', value: this.companyOverview.grossMargins, kind: 'percent' },
      { label: 'Operating Margins', value: this.companyOverview.operatingMargins, kind: 'percent' },
      { label: 'Revenue Growth', value: this.companyOverview.revenueGrowth, kind: 'percent' },
      { label: 'Earnings Growth', value: this.companyOverview.earningsGrowth, kind: 'percent' },
    ];
  }

  getLocation(): string {
    if (!this.companyOverview) {
      return 'N/A';
    }

    const parts = [this.companyOverview.city, this.companyOverview.country].filter(Boolean);
    return parts.length ? parts.join(', ') : 'N/A';
  }

  getDayRange(): string {
    if (!this.companyOverview) {
      return 'N/A';
    }

    const { dayLow, dayHigh } = this.companyOverview;
    if (!dayLow || !dayHigh) {
      return 'N/A';
    }

    return `${dayLow} - ${dayHigh}`;
  }

  formatField(field: OverviewField): string {
    const value = field.value;
    if (!value || value === 'None' || value === '-') {
      return 'N/A';
    }

    if (field.kind === 'currency') {
      return this.getCompactCurrency(value);
    }

    if (field.kind === 'percent') {
      return this.getPercent(value);
    }

    if (field.kind === 'number') {
      return this.getCompactNumber(value);
    }

    return value;
  }

  getCompactCurrency(value: string): string {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) {
      return value;
    }

    return new Intl.NumberFormat('en-IN', {
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(numberValue);
  }

  getCompactNumber(value: string): string {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) {
      return value;
    }

    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: numberValue > 1000 ? 0 : 2,
    }).format(numberValue);
  }

  getPercent(value: string): string {
    const numberValue = Number(value);
    if (Number.isNaN(numberValue)) {
      return value;
    }

    return `${(numberValue * 100).toFixed(2)}%`;
  }
}
