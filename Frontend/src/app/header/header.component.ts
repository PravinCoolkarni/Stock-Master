import { Component, EventEmitter, Output } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map, startWith } from 'rxjs/operators';
import { AuthenticationService, UserOut } from 'src/services/authetication.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Output() toggleSidenav = new EventEmitter<void>();
  currentUser$: Observable<UserOut | null>;
  isAuthRoute$: Observable<boolean>;

  navigationItems = [
    { label: 'Company Overview', route: '/company-overview', icon: 'business' },
    { label: 'Market Research', route: '/market-research', icon: 'search' },
    // { label: 'Portfolio', route: '/portfolio', icon: 'account_balance_wallet' },
    // { label: 'News & Insights', route: '/news', icon: 'article' }
  ];

  constructor(private authService: AuthenticationService, private router: Router) {
    this.currentUser$ = this.authService.currentUser$;
    this.isAuthRoute$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      startWith(null),
      map(() => this.router.url.startsWith('/auth'))
    );
  }

  logout(): void {
    this.authService.logout();
  }
}
