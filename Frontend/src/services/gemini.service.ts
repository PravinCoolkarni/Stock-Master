import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {

  constructor() { }

  getFuturePricePrediction(stockData: any[]): Observable<any> {
    // Simulate an API call to the Gemini API
    // In a real application, this would be an HTTP request
    const prediction = {
      prediction: (parseFloat(stockData[0].close) * (1 + (Math.random() - 0.4) / 10)).toFixed(2),
      confidence: (Math.random() * 0.5 + 0.5).toFixed(2)
    };

    return of(prediction).pipe(delay(1000));
  }
}
