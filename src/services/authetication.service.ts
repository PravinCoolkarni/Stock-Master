import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from 'src/environment/environment';

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { email: string; password: string; full_name?: string; }
export interface TokenResponse { access_token: string; refresh_token: string; token_type: string; }
export interface UserOut {
    id: number; email: string; full_name: string | null;
    picture: string | null; role: string; is_google_user: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class AuthenticationService {
    apiUrl = environment.FastAPIURL;
    private currentUserSubject = new BehaviorSubject<UserOut | null>(null);
    currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient, private router: Router) {
        const token = localStorage.getItem('access_token');
        if (token) this.fetchMe().subscribe();
    }

    login(body: LoginRequest): Observable<TokenResponse> {
        return this.http.post<TokenResponse>(this.apiUrl + 'auth/login', body).pipe(
            tap(res => {
                this.setSession(res);
            })
        );
    }

    register(body: RegisterRequest): Observable<UserOut> {
        return this.http.post<UserOut>(this.apiUrl + 'auth/register', body);
    }

    fetchMe(): Observable<UserOut> {
        return this.http.get<UserOut>(this.apiUrl + 'auth/me').pipe(
            tap(user => this.currentUserSubject.next(user))
        );
    }

    loginWithGoogle(): void {
        const callbackUrl = encodeURIComponent(window.location.origin + '/login/google/callback');
        window.location.href = this.apiUrl + 'auth/google?redirect_uri=' + callbackUrl;
    }

    setSession(tokens: TokenResponse): void {
        localStorage.setItem('access_token', tokens.access_token);
        localStorage.setItem('refresh_token', tokens.refresh_token);
        this.fetchMe().subscribe();
    }

    logout(): void {
        this.http.post(this.apiUrl + 'auth/logout', {}).subscribe();
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem('access_token');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

}
