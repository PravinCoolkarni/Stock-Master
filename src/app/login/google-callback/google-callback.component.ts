import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService, TokenResponse } from 'src/services/authetication.service';
import { SnackbarService } from 'src/services/snackbar.service';

@Component({
  selector: 'app-google-callback',
  templateUrl: './google-callback.component.html',
  styleUrls: ['./google-callback.component.scss']
})
export class GoogleCallbackComponent implements OnInit {
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthenticationService,
    private snackbar: SnackbarService
  ) {}

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    const fragmentParams = new URLSearchParams(this.route.snapshot.fragment || '');
    const tokens = this.extractTokens(queryParams, fragmentParams);

    if (!tokens.access_token || !tokens.refresh_token || !tokens.token_type) {
      this.loading = false;
      this.snackbar.error('Google sign-in response is missing tokens.');
      this.router.navigate(['/login']);
      return;
    }

    this.authService.setSession(tokens);
    this.snackbar.success('Signed in with Google.', 2000);
    this.router.navigate(['/dashboard']);
  }

  private extractTokens(
    queryParams: Pick<URLSearchParams, 'get'>,
    fragmentParams: Pick<URLSearchParams, 'get'>
  ): TokenResponse {
    return {
      access_token: queryParams.get('access_token') || fragmentParams.get('access_token') || '',
      refresh_token: queryParams.get('refresh_token') || fragmentParams.get('refresh_token') || '',
      token_type: queryParams.get('token_type') || fragmentParams.get('token_type') || 'bearer'
    };
  }
}
