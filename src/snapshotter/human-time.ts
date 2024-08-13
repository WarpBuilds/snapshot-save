// humanTime returns a string in the format
// 'x hours y minutes z seconds' if the time is > 1 hour
// 'y minutes z seconds' if the time is < 1 hour
// 'z seconds' if the time is < 1 minute
export function humanTime(ms: number): string {
  const hours = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  if (hours > 0) {
    return `${hours} hours ${minutes} minutes ${seconds} seconds`
  } else if (minutes > 0) {
    return `${minutes} minutes ${seconds} seconds`
  } else {
    return `${seconds} seconds`
  }
}
