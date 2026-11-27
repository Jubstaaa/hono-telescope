const DEFAULT_BASE = '/telescope'

export const DASHBOARD_BASE = (): string =>
    document.querySelector<HTMLMetaElement>('meta[name="telescope-base"]')
        ?.content ?? DEFAULT_BASE
