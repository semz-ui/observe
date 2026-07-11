export interface ClickEvent {
  id: string;
  projectId: string;
  anonymousId: string;
  sessionId: string;
  url: string;
  pageTitle?: string;
  elementTag: string;
  elementId?: string;
  elementText?: string;
  elementSelector: string;
  elementHref?: string;
  timestamp: Date;
}
