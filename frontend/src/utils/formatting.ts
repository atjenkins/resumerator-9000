/**
 * Shared formatting utilities for the application
 */

/**
 * Formats a date string as relative time (e.g., "2h ago", "3d ago")
 * Falls back to locale date string for dates older than 7 days
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Gets a Mantine color based on an analysis score (0-100)
 */
export function getScoreColor(score?: number): string {
  if (!score) return "gray";
  if (score >= 80) return "green";
  if (score >= 60) return "yellow";
  return "red";
}

/**
 * Gets a Mantine color based on an activity action type
 */
export function getActionColor(action: string): string {
  switch (action) {
    case "create":
      return "green";
    case "update":
      return "blue";
    case "delete":
      return "red";
    case "analyze":
      return "purple";
    case "generate":
      return "orange";
    case "upload":
      return "cyan";
    case "enrich":
      return "teal";
    case "parse":
      return "grape";
    default:
      return "gray";
  }
}

/**
 * Gets a Mantine color based on resume origin
 */
export function getOriginColor(origin: string): string {
  switch (origin) {
    case "generated":
      return "orange";
    case "uploaded":
      return "blue";
    case "manual":
      return "green";
    default:
      return "gray";
  }
}

/**
 * Gets a Mantine color based on fit rating
 */
export function getFitRatingColor(rating?: string): string {
  switch (rating) {
    case "excellent":
      return "green";
    case "good":
      return "blue";
    case "moderate":
      return "yellow";
    case "poor":
      return "red";
    default:
      return "gray";
  }
}

/**
 * Determines if the updated timestamp is significantly different from created
 * to warrant displaying it separately
 */
export function shouldShowUpdated(createdAt: string, updatedAt: string): boolean {
  const createdDate = new Date(createdAt);
  const updatedDate = new Date(updatedAt);
  return updatedDate.getTime() - createdDate.getTime() > 1000;
}

/**
 * Formats a duration in milliseconds to a human-readable string
 */
export function formatDuration(durationMs: number): string {
  const seconds = durationMs / 1000;
  if (seconds < 1) return `${durationMs}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}
