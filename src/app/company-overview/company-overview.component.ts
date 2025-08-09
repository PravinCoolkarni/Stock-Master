import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, map, Observable, of, startWith, switchMap } from 'rxjs';
import { Company } from 'src/model/Company';
import { StockData } from 'src/model/StockData';
import { CompanyOverview } from 'src/model/CompanyOverview';
import { DataExtractorService } from 'src/services/dataExtractor.service';

@Component({
  selector: 'app-company-overview',
  templateUrl: './company-overview.component.html',
  styleUrls: ['./company-overview.component.scss']
})
export class CompanyOverviewComponent implements OnInit {
  constructor(private dataExtractorService: DataExtractorService) { }

  companyForm = new FormGroup({
    companyName: new FormControl('')
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
      switchMap(value => {
        if (typeof value === 'string' && value.length > 2) {
          return this.dataExtractorService.getCompany(value).pipe(
            map(response => {
              this.options = this.convertToCompanyArray(response);
              return this.options;
            }),
            catchError(() => {
              console.error('Error fetching company data');
              return of([]);
            })
          );
        } else {
          return of(this.options.slice());
        }
      })
    );
  }

  displayFn(company: Company): string {
    return company && company.name ? company.name : '';
  }

  private _filter(name: string): Company[] {
    const filterValue = name.toLowerCase();
    const result = this.options.filter(option => option.name.toLowerCase().includes(filterValue));
    return result;
  }

  convertToCompanyArray(data: any): Company[] {
    return (data.bestMatches || []).map((item: any) => ({
      symbol: item["1. symbol"],
      name: item["2. name"],
      type: item["3. type"],
      region: item["4. region"],
      marketOpen: item["5. marketOpen"],
      marketClose: item["6. marketClose"],
      timezone: item["7. timezone"],
      currency: item["8. currency"],
      matchScore: item["9. matchScore"]
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
      }
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
      }
    });
  }

  getFormattedValue(value: string): string {
    if (!value || value === 'None' || value === '-') {
      return 'N/A';
    }
    return value;
  }

  getFormattedCurrency(value: string): string {
    if (!value || value === 'None' || value === '-') {
      return 'N/A';
    }
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    if (num >= 1000000000) {
      return '$' + (num / 1000000000).toFixed(1) + 'B';
    } else if (num >= 1000000) {
      return '$' + (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return '$' + (num / 1000).toFixed(1) + 'K';
    }
    return '$' + num.toFixed(2);
  }
}
