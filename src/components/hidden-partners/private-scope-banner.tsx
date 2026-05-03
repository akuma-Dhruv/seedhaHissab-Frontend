import { Lock } from 'lucide-react';

/**
 * Renders the "Private / Internal Only" notice that must appear on every
 * surface displaying hidden partner data. Driven by the backend's
 * {@code visibilityScope = "PRIVATE"} marker.
 */
export function PrivateScopeBanner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200 ${className}`}
      data-testid="banner-private-scope"
    >
      <Lock className="h-4 w-4 flex-shrink-0" />
      <span>
        <strong className="font-semibold">Private / Internal Only.</strong>
        {' '}
        Only you can see this page. Hidden partners never appear in the
        official project view, summaries, or settlements.
      </span>
    </div>
  );
}
