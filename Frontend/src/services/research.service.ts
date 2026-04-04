import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';
import {
  ResearchChatMessage,
  ResearchChatSession,
  ResearchContextResponse,
  ResearchQuestionResponse,
  ResearchSessionDetail,
  ResearchSessionSeedResponse,
} from 'src/interfaces/ResearchChat';

@Injectable({
  providedIn: 'root'
})
export class ResearchService {
  private readonly apiURL = environment.FastAPIURL + 'research/';

  constructor(private http: HttpClient) {}

  getResearchContext(params: any): Observable<ResearchContextResponse> {
    return this.http.post<ResearchContextResponse>(this.apiURL + 'get_research_context', params);
  }

  createSeededSession(params: any): Observable<ResearchSessionSeedResponse> {
    return this.http.post<ResearchSessionSeedResponse>(this.apiURL + 'sessions/seed', params);
  }

  listSessions(): Observable<ResearchChatSession[]> {
    return this.http.get<ResearchChatSession[]>(this.apiURL + 'sessions');
  }

  getSessionDetail(sessionId: string): Observable<ResearchSessionDetail> {
    return this.http.get<ResearchSessionDetail>(this.apiURL + 'sessions/' + sessionId);
  }

  addQuestion(sessionId: string, content: string): Observable<ResearchQuestionResponse> {
    return this.http.post<ResearchQuestionResponse>(this.apiURL + 'sessions/' + sessionId + '/messages', { content });
  }

  embedContent(params: { context: string; session_id: string }): Observable<any> {
    return this.http.post(this.apiURL + 'embed_context', params);
  }
}
