export function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) return "n/a";
  const minute = 60;
  const hour = 3600;
  const day = 86400;
  const year = 31557600;

  if (seconds >= year) return `${(seconds / year).toFixed(2)} years`;
  if (seconds >= day) return `${(seconds / day).toFixed(2)} days`;
  if (seconds >= hour) return `${(seconds / hour).toFixed(2)} hours`;
  if (seconds >= minute) return `${(seconds / minute).toFixed(2)} minutes`;
  return `${seconds.toFixed(2)} seconds`;
}
