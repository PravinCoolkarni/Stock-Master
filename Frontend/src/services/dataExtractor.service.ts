import { Injectable } from '@angular/core';
import { Company } from 'src/interfaces/Company';
import { StockData } from 'src/interfaces/StockData';
import { CompanyOverview } from 'src/interfaces/CompanyOverview';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DataExtractorService {

  constructor(
    private http: HttpClient,
  ) { }

  getCompany(companyName : string): Observable<{ company_name: string; tickers: Company[] }>{
    return this.http.get<{ company_name: string; tickers: Company[] }>(
      `${environment.FastAPIURL}company/get_ticker/${encodeURIComponent(companyName)}`
    );
  }

  getStockData(symbol: string, outputSize: string = 'compact'): Observable<StockData[]> {
    return this.http.get<StockData[]>(
      `${environment.FastAPIURL}company/stock/${encodeURIComponent(symbol)}?output_size=${encodeURIComponent(outputSize)}`
    );
  }

  getCompanyOverview(symbol: string): Observable<CompanyOverview> {
    return this.http.get<CompanyOverview>(
      `${environment.FastAPIURL}company/overview/${encodeURIComponent(symbol)}`
    );
  }
}
