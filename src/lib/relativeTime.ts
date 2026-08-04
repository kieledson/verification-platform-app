export function relativeTime(ts: number, now: number): string {
  const diffMin = Math.floor((now - ts) / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin === 1) return '1 min ago'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr === 1) return '1 hour ago'
  if (diffHr < 24) return `${diffHr} hours ago`
  const diffDay = Math.floor(diffHr / 24)
  return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`
}
