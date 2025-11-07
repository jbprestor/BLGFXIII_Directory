import { useMemo } from "react";

/**
 * AutosaveIndicator - Shows the current autosave state
 * @param {boolean} saving - Whether data is currently being saved
 * @param {Date|string|null} savedAt - When the data was last saved
 * @param {boolean} error - Whether there was a save error
 */
export default function AutosaveIndicator({ saving = false, savedAt = null, error = false }) {
  const timeAgo = useMemo(() => {
    if (!savedAt) return null;
    
    const date = savedAt instanceof Date ? savedAt : new Date(savedAt);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 10) return "just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }, [savedAt]);

  if (saving) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-info" role="status" aria-live="polite">
        <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Saving…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-error" role="alert" aria-live="assertive">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Save failed</span>
      </div>
    );
  }

  if (savedAt && timeAgo) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-base-content/60" role="status" aria-live="polite">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Saved {timeAgo}</span>
      </div>
    );
  }

  return null;
}
