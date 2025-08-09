import { Injectable } from '@angular/core';
import { Company } from 'src/model/Company';
import { StockApiResponse, StockData } from 'src/model/StockData';
import { CompanyOverview } from 'src/model/CompanyOverview';
import { Observable, observable, map } from 'rxjs';
import { environment } from 'src/environment/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class DataExtractorService {

  constructor(
    private http: HttpClient,
  ) { }

  getCompany(companyName : string): Observable<any>{
    return this.http.get<Company[]>(environment.apiURL + 'query?function=SYMBOL_SEARCH&keywords=' + companyName + '&apikey=' + environment.apiKey);
  } 

  getStockData(symbol: string, outputSize: string = 'compact'): Observable<StockData[]> {
    return this.http.get<StockApiResponse>(
      `${environment.apiURL}query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputSize}&apikey=${environment.apiKey}`
    ).pipe(
      map(response => {
        const timeSeries = response['Time Series (Daily)'];
        if (!timeSeries) {
          return [];
        }
        
        return Object.keys(timeSeries)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
          .slice(0, 30)
          .map(date => ({
            symbol: response['Meta Data']['2. Symbol'],
            date: date,
            open: timeSeries[date]['1. open'],
            high: timeSeries[date]['2. high'],
            low: timeSeries[date]['3. low'],
            close: timeSeries[date]['4. close'],
            volume: timeSeries[date]['5. volume']
          }));
      })
    );
  }

  getCompanyOverview(symbol: string): Observable<CompanyOverview> {
    return this.http.get<CompanyOverview>(
      `${environment.apiURL}query?function=OVERVIEW&symbol=${symbol}&apikey=${environment.apiKey}`
    );
  } 
}