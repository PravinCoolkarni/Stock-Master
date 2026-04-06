import { Component } from '@angular/core';

interface WorkflowCard {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  accentClass: string;
  actionLabel: string;
  bulletPoints: string[];
}

interface SignalMetric {
  label: string;
  value: string;
  supportingCopy: string;
  toneClass: string;
}

interface FeatureNote {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  readonly workflowCards: WorkflowCard[] = [
    {
      eyebrow: 'Company Overview',
      title: 'Turn a company search into a fast, usable market snapshot.',
      description:
        'Search by company name, land on the correct ticker, and read the essentials that matter before you dig deeper.',
      icon: 'query_stats',
      route: '/company-overview',
      accentClass: 'workflow-card--overview',
      actionLabel: 'Explore Company Overview',
      bulletPoints: ['Find the right ticker faster', 'Read sector, exchange, and market signals', 'Review recent price action in one view'],
    },
    {
      eyebrow: 'Market Research',
      title: 'Ask questions against your own source material.',
      description:
        'Upload a PDF, use a URL, or paste text to create a research session where answers stay tied to retrieved evidence.',
      icon: 'forum',
      route: '/market-research',
      accentClass: 'workflow-card--research',
      actionLabel: 'Launch Market Research',
      bulletPoints: ['Embed source material into a live session', 'Retrieve relevant chunks before each answer', 'Keep responses grounded in the current topic'],
    },
  ];

  readonly signalMetrics: SignalMetric[] = [
    {
      label: 'Research Workflow',
      value: 'Evidence-first',
      supportingCopy: 'Answers are built from retrieved session chunks before Gemini responds.',
      toneClass: 'signal-card--positive',
    },
    {
      label: 'Search Experience',
      value: 'Ticker-aware',
      supportingCopy: 'Company search resolves through yfinance-backed ticker lookup.',
      toneClass: 'signal-card--neutral',
    },
    {
      label: 'Investor Workflow',
      value: 'Built to move fast',
      supportingCopy: 'Use overview for market context and research for source-grounded exploration.',
      toneClass: 'signal-card--info',
    },
  ];

  readonly featureNotes: FeatureNote[] = [
    {
      icon: 'manage_search',
      title: 'Start with a company, not a ticker code',
      description:
        'Stock Master handles the mapping so users can focus on understanding the business, not memorizing symbols.',
    },
    {
      icon: 'dataset_linked',
      title: 'Research from your own source of truth',
      description:
        'Use URLs, documents, or raw text to seed a session, embed context, and ask follow-up questions naturally.',
    },
    {
      icon: 'insights',
      title: 'Move from signals to evidence',
      description:
        'Overview gives the market picture, while research gives the narrative and evidence behind the decision.',
    },
  ];

}
