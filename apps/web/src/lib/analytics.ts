const GA_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as
  | string
  | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let initialized = false;

/** No-op unless VITE_GA4_MEASUREMENT_ID is set — safe to call in every environment. */
export function initAnalytics() {
  if (initialized || !GA_MEASUREMENT_ID) return;
  initialized = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
}

export function trackPageView(path: string) {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  window.gtag('event', 'page_view', { page_path: path });
}
