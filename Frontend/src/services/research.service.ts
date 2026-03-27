import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

@Injectable({
    providedIn: 'root'
})
export class ResearchService {
    apiURL = environment.FastAPIURL + 'research/';

    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
    }
    constructor(private http: HttpClient) { }

    getResearchContext(params: any): Observable<any> {
        return this.http.post(this.apiURL + 'get_research_context', params, {headers: this.headers});
    }

    embedContent(params: any): Observable<any> {
        return this.http.post(this.apiURL + 'embed_context', params, {headers: this.headers});
    }


}