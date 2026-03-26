import { Component, EventEmitter, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthenticationService, UserOut } from 'src/services/authetication.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Output() toggleSidenav = new EventEmitter<void>();
  currentUser$: Observable<UserOut | null>;

  navigationItems = [
    { label: 'Company Overview', route: '/company-overview', icon: 'business' },
    { label: 'Market Research', route: '/market-research', icon: 'search' },
    // { label: 'Portfolio', route: '/portfolio', icon: 'account_balance_wallet' },
    // { label: 'News & Insights', route: '/news', icon: 'article' }
  ];

  constructor(private authService: AuthenticationService) {
    this.currentUser$ = this.authService.currentUser$;
  }

  logout(): void {
    this.authService.logout();
  }
}
