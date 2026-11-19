const DEFAULT_BASE = '/telescope';

// The server writes the mount path into a meta tag; `vite dev` serves the page without it.
export const DASHBOARD_BASE = (): string =>
  document.querySelector<HTMLMetaElement>('meta[name="telescope-base"]')?.content ?? DEFAULT_BASE;
