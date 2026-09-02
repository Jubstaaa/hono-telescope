declare global {
  interface Window {
    __TELESCOPE_BASE__?: string;
  }
}

export const DASHBOARD_BASE = (): string => window.__TELESCOPE_BASE__ ?? '/telescope';
