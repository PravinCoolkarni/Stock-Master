import { Component } from '@angular/core';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {

  navigationItems = [
    { label: 'Company Overview', route: '/company-overview', icon: 'business' },
    // { label: 'Market Analysis', route: '/market-analysis', icon: 'analytics' },
    // { label: 'Portfolio', route: '/portfolio', icon: 'account_balance_wallet' },
    // { label: 'News & Insights', route: '/news', icon: 'article' }
  ];
  constructor() { }
}
