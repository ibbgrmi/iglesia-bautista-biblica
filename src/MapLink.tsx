import { MouseEvent, ReactNode } from 'react';

// Opens Apple Maps on iPhone/iPad (deep-links into the Maps app when installed)
// and Google Maps everywhere else (Android default map app, or Google Maps in
// the browser on desktop).
export function MapLink({
  query,
  children,
  className,
  ariaLabel,
}: {
  query: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  // SSR-safe default; iOS hijack happens at click time below.
  const googleHref = `https://maps.google.com/?q=${encodeURIComponent(query)}`;

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (typeof navigator === 'undefined') return;
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    if (isIOS) {
      e.preventDefault();
      window.open(`https://maps.apple.com/?q=${encodeURIComponent(query)}`, '_blank', 'noopener,noreferrer');
    }
    // Otherwise let the <a href> follow to Google Maps (opens the app on
    // Android, browser everywhere else).
  }

  return (
    <a
      href={googleHref}
      onClick={onClick}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}
